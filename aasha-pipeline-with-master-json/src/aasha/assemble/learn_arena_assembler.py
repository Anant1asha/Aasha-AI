"""LearnArenaAssembler — compiles chapter_spec.json + lle.json into dual offline HTML5 modules:
  1. <chapter>_Learning.html (Aasha Learn: action-gated slides, live SVG visualizers, sims, LLE)
  2. <chapter>_Arena.html    (Aasha Arena: PixiJS v8 WebGL + Canvas2D battle arena, guide mode, LLE)
"""

from __future__ import annotations

import json
import logging
import re
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Domain-to-icon mapping using keys present in EMO (OpenMoji SVG library)
SUBJECT_PIC_DEFAULTS = {
    "math": ["numbers", "ratio", "balance", "ruler", "chart"],
    "science": ["lab", "scale", "sun", "water", "rocket"],
    "english": ["book", "pen", "chat", "idea", "star"],
    "evs": ["leaf", "water", "sun", "globe", "seed"],
    "social": ["globe", "law", "book", "people", "flag"],
}


class LearnArenaAssembler:
    """Compiles a chapter spec + LLE + master dictionary pack into Learn & Arena HTMLs."""

    def __init__(
        self,
        learn_template_path: str | Path,
        arena_template_path: str | Path,
        master_pack_path: str | Path | None = None,
        defaults_path: str | Path | None = None,
    ):
        self.learn_template_path = Path(learn_template_path)
        self.arena_template_path = Path(arena_template_path)
        if not self.learn_template_path.exists():
            raise FileNotFoundError(f"Learn template not found: {self.learn_template_path}")
        if not self.arena_template_path.exists():
            raise FileNotFoundError(f"Arena template not found: {self.arena_template_path}")

        self.learn_template = self.learn_template_path.read_text(encoding="utf-8")
        self.arena_template = self.arena_template_path.read_text(encoding="utf-8")

        self.master_wm2: dict[str, str] = {}
        self.master_ph: dict[str, str] = {}
        self.master_conn: dict[str, str] = {}
        self.master_emo: dict[str, str] = {}

        if defaults_path and Path(defaults_path).exists():
            d = json.loads(Path(defaults_path).read_text(encoding="utf-8"))
            self.master_wm2.update(d.get("WM", {}))
            self.master_conn.update(d.get("CONN", {}))

        if master_pack_path and Path(master_pack_path).exists():
            mp = json.loads(Path(master_pack_path).read_text(encoding="utf-8"))
            self.master_wm2.update(mp.get("WM2", {}))
            self.master_ph.update(mp.get("PH", {}))
            self.master_conn.update(mp.get("CONN", {}))
            self.master_emo.update(mp.get("EMO", {}))

    @staticmethod
    def _serialize(data: Any) -> str:
        return json.dumps(data, ensure_ascii=False, separators=(",", ":"))

    @staticmethod
    def _pick_sim_type(text: str, subject: str) -> str:
        low = text.lower()
        if any(k in low for k in ("ohm", "circuit", "voltage", "current", "resistor", "electric")):
            return "circuit_ohm"
        if any(k in low for k in ("force", "motion", "newton", "momentum", "kinetic", "work", "energy", "acceleration")):
            return "motion_force"
        if any(k in low for k in ("ledger", "spreadsheet", "data entry", "checksum", "table", "coin", "interest", "profit")):
            return "ledger_balance"
        if any(k in low for k in ("drip", "emitter", "irrigation", "jal seva", "moisture", "dehydrator", "transpiration", "stomata")):
            return "drip_flow"
        return "generic_scale"

    @staticmethod
    def _pick_pic(text: str, subject: str, idx: int) -> str:
        low = text.lower()
        if any(k in low for k in ("ratio", "fraction", "divide", "share")):
            return "ratio"
        if any(k in low for k in ("balance", "equal", "equation", "proportion")):
            return "balance"
        if any(k in low for k in ("graph", "curve", "rate", "speed", "increase", "decrease")):
            return "chart"
        if any(k in low for k in ("money", "cost", "price", "profit", "rupee", "₹")):
            return "coin"
        if any(k in low for k in ("map", "scale", "distance", "length", "cm", "km")):
            return "ruler"
        if any(k in low for k in ("water", "solar", "heat", "air", "moisture")):
            return "sun"
        pool = SUBJECT_PIC_DEFAULTS.get(subject, SUBJECT_PIC_DEFAULTS["math"])
        return pool[idx % len(pool)]

    def _merge_lle(self, lle: dict[str, Any], spec: dict[str, Any] | None = None) -> tuple[dict[str, str], dict[str, str], dict[str, str], dict[str, str]]:
        wm2 = dict(self.master_wm2)
        wm2.update(lle.get("WM", {}))
        wm2.update(lle.get("WM2", {}))

        conn = dict(self.master_conn)
        conn.update(lle.get("CONN", {}))

        ph = dict(self.master_ph)
        ph.update(lle.get("PH", {}))

        # L-Truth math-rt isolation: never map single-letter 'a' to 'एक' in WM2 (stopword & algebraic variable)
        if 'एक' in wm2.get('a', ''):
            wm2.pop('a', None)
        emo = dict(self.master_emo)
        return wm2, ph, conn, emo

    def build_learn_slides(self, spec: dict[str, Any]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
        """Convert chapter_spec NODES, WE, SOLVE into action-gated Aasha Learn SLIDES."""
        ch = spec.get("chapter", {})
        title = ch.get("title", "Interactive Chapter")
        chapter_id = ch.get("chapter_id") or ch.get("storage_key", "chapter")
        subject = ch.get("subject", "math")
        grade = ch.get("grade", 8)
        nodes = spec.get("NODES", [])
        we_map = spec.get("WE", {}) or {}
        solve_map = spec.get("SOLVE", {}) or {}

        slides: list[dict[str, Any]] = [
            {
                "kind": "title",
                "t": title,
                "s": f"{subject.title()} · Class {grade}",
                "b": f"Master {title} step by step with interactive visuals, worked examples, and quick checks.",
            }
        ]
        custom_sims: dict[str, Any] = {}
        traps: list[str] = []
        summary_points: list[str] = []

        for n_idx, node in enumerate(nodes):
            ntitle = node.get("title", f"Concept {n_idx + 1}")
            steps = node.get("steps", [])
            summary_points.append(f"{ntitle}: core rule and application.")

            # 1. Concept text / visual slides
            text_added = False
            sim_added = False
            for s_idx, step in enumerate(steps):
                st = step.get("t", "text")
                if st in ("intro", "text"):
                    body = step.get("body") or step.get("ctx") or f"Explore {ntitle}."
                    slides.append({
                        "kind": "text",
                        "t": step.get("title") or ntitle,
                        "b": body,
                        "pic": self._pick_pic(body, subject, n_idx + s_idx),
                        "viz": "bars" if s_idx % 2 == 0 else "balance",
                    })
                    text_added = True
                elif st in ("ix_slider", "ix_bar", "ix_area", "ix_pizza", "phet") and not sim_added:
                    sim_key = self._pick_sim_type(f"{title} {ntitle} {step.get('title', '')}", subject)
                    mult = max(2, int(step.get("target_num") or step.get("parts") or (n_idx + 3)))
                    custom_sims[sim_key] = {
                        "simType": sim_key,
                        "labelA": step.get("title") or "Input (x)",
                        "labelB": "Scaled Result (y)",
                        "min": 1,
                        "max": 12,
                        "val": 3,
                        "mult": mult,
                        "caption": step.get("instruction") or f"Adjust the slider to explore {ntitle}.",
                    }
                    slides.append({
                        "kind": "sim",
                        "sim": sim_key,
                        "simCfg": custom_sims[sim_key],
                        "t": step.get("title") or f"Try {ntitle}",
                        "b": step.get("instruction") or "Move the slider and watch how both values change together.",
                        "hint": step.get("body") or f"Notice how the output changes as you adjust {ntitle}.",
                    })
                    sim_added = True
                elif st == "worked" and step.get("we"):
                    we_key = step["we"].replace("WE.", "")
                    we_obj = we_map.get(we_key) or we_map.get(step["we"])
                    if we_obj:
                        we_steps = [
                            {
                                "t": ws.get("text", ""),
                                "w": "Follow this step carefully before moving to the next." if not ws.get("final") else "This gives the final verified result.",
                            }
                            for ws in we_obj.get("steps", [])
                        ]
                        slides.append({
                            "kind": "steps",
                            "t": we_obj.get("title", f"Worked Example: {ntitle}"),
                            "q": we_obj.get("question", ""),
                            "steps": we_steps,
                            "ans": we_steps[-1]["t"] if we_steps else "",
                            "pic": self._pick_pic(we_obj.get("question", ""), subject, n_idx),
                        })
                elif st in ("quiz", "vq") and step.get("q"):
                    qobj = step["q"]
                    opts = qobj.get("opts", [])
                    if opts:
                        correct_idx = next((idx for idx, o in enumerate(opts) if o.get("c")), 0)
                        for o in opts:
                            if not o.get("c") and o.get("m"):
                                traps.append(o["m"])
                        slides.append({
                            "kind": "check",
                            "t": f"Quick Check · {ntitle}",
                            "q": qobj.get("q", ""),
                            "opts": [o.get("t", "") for o in opts],
                            "ans": correct_idx,
                            "ok": "Correct! You applied the concept accurately.",
                            "bad": next((o.get("m") for o in opts if not o.get("c") and o.get("m")), "Check the rule and try again."),
                        })

            if not text_added:
                slides.append({
                    "kind": "text",
                    "t": ntitle,
                    "b": f"Key concept in {title}: understand how {ntitle.lower()} works in practice.",
                    "pic": self._pick_pic(ntitle, subject, n_idx),
                })

            if not sim_added:
                sim_key = self._pick_sim_type(f"{title} {ntitle}", subject)
                custom_sims[sim_key] = {
                    "simType": sim_key,
                    "labelA": "Base Unit",
                    "labelB": "Scaled Value",
                    "min": 1,
                    "max": 10,
                    "val": 2,
                    "mult": n_idx + 2,
                    "caption": f"Interactive explorer for {ntitle}",
                }
                slides.append({
                    "kind": "sim",
                    "sim": sim_key,
                    "simCfg": custom_sims[sim_key],
                    "t": f"Explore {ntitle}",
                    "b": f"Drag the slider to test how {ntitle} scales with different inputs.",
                    "hint": f"Watch how the bar chart updates live as you move the slider.",
                })

        if traps:
            slides.append({
                "kind": "trap",
                "t": "Common Mistakes to Avoid",
                "b": "Watch out for these traps when solving exam questions:",
                "items": traps[:5],
            })

        slides.append({
            "kind": "summary",
            "t": f"{title} — One-Page Summary",
            "b": "Keep these core ideas ready before entering the Arena:",
            "items": summary_points[:6],
        })
        slides.append({
            "kind": "end",
            "t": "Chapter Complete!",
            "b": f"You finished {title}. Now test your speed and mastery in Aasha Arena.",
        })

        return slides, custom_sims

    def build_arena_data(self, spec: dict[str, Any]) -> tuple[list[dict[str, Any]], dict[str, Any], dict[str, str]]:
        """Convert chapter_spec NODES, WE, SOLVE into Aasha Arena QUESTIONS, MODES, SECMAP."""
        ch = spec.get("chapter", {})
        subject = ch.get("subject", "math")
        nodes = spec.get("NODES", [])
        we_map = spec.get("WE", {}) or {}
        solve_map = spec.get("SOLVE", {}) or {}

        questions: list[dict[str, Any]] = []
        modes: dict[str, Any] = {
            "quick": {"em": "⚡", "name": "Quick 10", "d": "10 rapid-fire questions."}
        }
        secmap: dict[str, str] = {}

        for n_idx, node in enumerate(nodes):
            sec_name = node.get("title", f"Section {n_idx + 1}")
            sec_key = f"sec{n_idx + 1}"
            secmap[sec_key] = sec_name
            sec_emoji = node.get("emoji") or "📘"
            q_count_for_sec = 0

            for s_idx, step in enumerate(node.get("steps", [])):
                st = step.get("t", "")
                if st == "worked" and step.get("we"):
                    we_key = step["we"].replace("WE.", "")
                    we_obj = we_map.get(we_key) or we_map.get(step["we"])
                    if we_obj:
                        guide_steps = [ws.get("text", "") for ws in we_obj.get("steps", []) if ws.get("text")]
                        if guide_steps:
                            questions.append({
                                "sec": sec_name,
                                "src": f"{sec_name} · Guide",
                                "type": "guide",
                                "q": we_obj.get("question", we_obj.get("title", sec_name)),
                                "steps": guide_steps,
                                "pic": self._pick_pic(we_obj.get("question", ""), subject, n_idx),
                            })
                            q_count_for_sec += 1
                        if we_obj.get("check"):
                            chk = we_obj["check"]
                            questions.append({
                                "sec": sec_name,
                                "src": f"{sec_name} · Example Check",
                                "type": "choice",
                                "q": chk.get("q", ""),
                                "o": [
                                    {"t": o.get("t", ""), "c": 1 if o.get("c") else 0, **({"m": o["m"]} if not o.get("c") and o.get("m") else {})}
                                    for o in chk.get("opts", [])
                                ],
                                "exp": f"Verified from worked example: {we_obj.get('title', sec_name)}.",
                                "pic": self._pick_pic(chk.get("q", ""), subject, n_idx),
                            })
                            q_count_for_sec += 1

                elif st == "solve" and step.get("sl"):
                    sl_key = step["sl"].replace("SOLVE.", "")
                    sl_obj = solve_map.get(sl_key) or solve_map.get(step["sl"])
                    if sl_obj:
                        sl_steps = [ss.get("prompt", "") + (f" → {ss['answer']}" if ss.get("answer") else "") for ss in sl_obj.get("steps", [])]
                        if sl_steps:
                            questions.append({
                                "sec": sec_name,
                                "src": f"{sec_name} · Solve",
                                "type": "guide",
                                "q": sl_obj.get("question", sl_obj.get("title", sec_name)),
                                "steps": sl_steps,
                                "pic": self._pick_pic(sl_obj.get("question", ""), subject, n_idx),
                            })
                            q_count_for_sec += 1

                elif st in ("quiz", "vq") and step.get("q"):
                    qobj = step["q"]
                    opts = qobj.get("opts", [])
                    if opts:
                        correct_opt = next((o for o in opts if o.get("c")), opts[0])
                        questions.append({
                            "sec": sec_name,
                            "src": f"{sec_name} · Q{q_count_for_sec + 1}",
                            "type": "choice",
                            "q": qobj.get("q", ""),
                            "o": [
                                {"t": o.get("t", ""), "c": 1 if o.get("c") else 0, **({"m": o["m"]} if not o.get("c") and o.get("m") else {})}
                                for o in opts
                            ],
                            "exp": f"Correct answer: {correct_opt.get('t', '')}.",
                            "pic": self._pick_pic(qobj.get("q", ""), subject, n_idx + s_idx),
                        })
                        q_count_for_sec += 1

            modes[sec_key] = {
                "em": sec_emoji,
                "name": sec_name,
                "d": f"{q_count_for_sec} questions on {sec_name}.",
            }

        modes["full"] = {
            "em": "🏆",
            "name": "Full Arena",
            "d": f"All {len(questions)} questions.",
        }
        return questions, modes, secmap

    def assemble(
        self,
        spec: dict[str, Any],
        lle: dict[str, Any],
    ) -> tuple[str, str]:
        """Return (learn_html, arena_html) strings."""
        ch = spec.get("chapter", {})
        title = ch.get("title", "Interactive Chapter")
        chapter_id = ch.get("chapter_id") or ch.get("storage_key", "chapter")
        subject = ch.get("subject", "math")
        grade = ch.get("grade", 8)
        badge = f"{subject.title()} · Class {grade}"

        wm2, ph, conn, emo = self._merge_lle(lle, spec)
        slides, custom_sims = self.build_learn_slides(spec)
        questions, modes, secmap = self.build_arena_data(spec)

        learn_html = self.learn_template
        for ph_key, val in {
            "{{CHAPTER_ID}}": chapter_id,
            "{{CHAPTER_TITLE}}": title,
            "{{CHAPTER_BADGE}}": badge,
            "{{WM2_JSON}}": self._serialize(wm2),
            "{{EMO_JSON}}": self._serialize(emo),
            "{{PH_JSON}}": self._serialize(ph),
            "{{CONN_JSON}}": self._serialize(conn),
            "{{SLIDES_JSON}}": self._serialize(slides),
            "{{CUSTOM_SIMS_JSON}}": self._serialize(custom_sims),
        }.items():
            learn_html = learn_html.replace(ph_key, val)

        arena_html = self.arena_template
        for ph_key, val in {
            "{{CHAPTER_ID}}": chapter_id,
            "{{CHAPTER_TITLE}}": title,
            "{{CHAPTER_BADGE}}": badge,
            "{{WM2_JSON}}": self._serialize(wm2),
            "{{EMO_JSON}}": self._serialize(emo),
            "{{PH_JSON}}": self._serialize(ph),
            "{{CONN_JSON}}": self._serialize(conn),
            "{{QUESTIONS_JSON}}": self._serialize(questions),
            "{{MODES_JSON}}": self._serialize(modes),
            "{{SECMAP_JSON}}": self._serialize(secmap),
        }.items():
            arena_html = arena_html.replace(ph_key, val)

        return learn_html, arena_html

    def assemble_to_files(
        self,
        spec_path: str | Path,
        lle_path: str | Path,
        learn_out_path: str | Path,
        arena_out_path: str | Path,
    ) -> tuple[Path, Path]:
        spec = json.loads(Path(spec_path).read_text(encoding="utf-8"))
        lle = json.loads(Path(lle_path).read_text(encoding="utf-8")) if Path(lle_path).exists() else {}
        learn_html, arena_html = self.assemble(spec, lle)

        learn_p = Path(learn_out_path)
        arena_p = Path(arena_out_path)
        learn_p.parent.mkdir(parents=True, exist_ok=True)
        arena_p.parent.mkdir(parents=True, exist_ok=True)
        learn_p.write_text(learn_html, encoding="utf-8")
        arena_p.write_text(arena_html, encoding="utf-8")
        return learn_p, arena_p
