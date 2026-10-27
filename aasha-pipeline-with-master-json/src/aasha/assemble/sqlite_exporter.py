"""Builds compressed offline SQLite database (teas_content.db / teas_content.db.gz) per Aasha TEAS Spec v2.0."""
import gzip
import json
import shutil
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS chapters (
    chapter_id TEXT PRIMARY KEY,
    chapter_title TEXT,
    grade INTEGER,
    subject TEXT,
    board TEXT,
    pipeline_version TEXT,
    generated_at TEXT,
    reward_config TEXT,
    teacher_analysis TEXT
);
CREATE TABLE IF NOT EXISTS tln_nodes (
    node_id TEXT PRIMARY KEY,
    chapter_id TEXT,
    concept_code TEXT,
    title TEXT,
    title_hi TEXT,
    explanation TEXT,
    explanation_hi TEXT,
    bloom_level TEXT,
    difficulty INTEGER,
    sort_order INTEGER,
    template TEXT,
    template_config TEXT,
    reward_points INTEGER,
    mastery_threshold INTEGER
);
CREATE TABLE IF NOT EXISTS tln_edges (
    chapter_id TEXT,
    from_node TEXT,
    to_node TEXT,
    edge_type TEXT,
    PRIMARY KEY (from_node, to_node)
);
CREATE TABLE IF NOT EXISTS questions (
    question_id TEXT PRIMARY KEY,
    chapter_id TEXT,
    concept_code TEXT,
    question_type TEXT,
    stem TEXT,
    stem_hi TEXT,
    bloom_level TEXT,
    difficulty INTEGER,
    points INTEGER,
    solution TEXT,
    sort_order INTEGER
);
CREATE TABLE IF NOT EXISTS question_options (
    option_id TEXT,
    question_id TEXT,
    text TEXT,
    text_hi TEXT,
    is_correct INTEGER,
    misconception TEXT,
    sort_order INTEGER,
    PRIMARY KEY (question_id, option_id)
);
CREATE TABLE IF NOT EXISTS question_hints (
    question_id TEXT,
    hint_order INTEGER,
    hint_text TEXT,
    PRIMARY KEY (question_id, hint_order)
);
CREATE TABLE IF NOT EXISTS vocabulary (
    word_id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id TEXT,
    word TEXT,
    word_hi TEXT,
    definition TEXT,
    definition_hi TEXT,
    part_of_speech TEXT,
    difficulty INTEGER,
    context_meaning TEXT,
    synonyms TEXT,
    antonyms TEXT,
    example_sentence TEXT,
    UNIQUE (chapter_id, word)
);
CREATE TABLE IF NOT EXISTS student_progress (
    student_id TEXT,
    chapter_id TEXT,
    node_id TEXT,
    status TEXT,
    score INTEGER,
    mastery_level TEXT,
    tokens_earned INTEGER,
    last_accessed TEXT,
    sync_status TEXT,
    PRIMARY KEY (student_id, chapter_id, node_id)
);
CREATE TABLE IF NOT EXISTS quiz_results (
    result_id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    chapter_id TEXT,
    question_id TEXT,
    selected_option TEXT,
    is_correct INTEGER,
    hints_used INTEGER,
    points_earned INTEGER,
    time_spent_ms INTEGER,
    answered_at TEXT,
    sync_status TEXT
);
CREATE INDEX IF NOT EXISTS idx_nodes_chapter ON tln_nodes(chapter_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_options_question ON question_options(question_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_vocab_chapter ON vocabulary(chapter_id);
CREATE INDEX IF NOT EXISTS idx_progress_student ON student_progress(student_id, sync_status);
CREATE INDEX IF NOT EXISTS idx_quizresults_sync ON quiz_results(student_id, sync_status);
"""

def export_chapter_to_teas_sqlite(chapter_spec: Dict[str, Any], db_path: str, compress_gz: bool = True) -> str:
    p = Path(db_path)
    p.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(p))
    try:
        conn.executescript(SCHEMA_SQL)
        ch = chapter_spec.get("chapter", {})
        ch_id = ch.get("storage_key", "aasha_ch1_v5")
        conn.execute(
            "INSERT OR REPLACE INTO chapters VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                ch_id,
                ch.get("title", "Untitled Chapter"),
                int(ch.get("grade", 6)),
                ch.get("subject", "math"),
                ch.get("board", "NCERT"),
                "v5.0-teas-2.0",
                datetime.now(timezone.utc).isoformat(),
                json.dumps({"pass_coins": 50, "mastery_coins": 100}),
                json.dumps(ch),
            ),
        )
        for idx, node in enumerate(chapter_spec.get("NODES", [])):
            node_id = f"{ch_id}_node_{idx+1}"
            conn.execute(
                "INSERT OR REPLACE INTO tln_nodes VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    node_id,
                    ch_id,
                    f"C{idx+1}",
                    node.get("name", f"Node {idx+1}"),
                    node.get("name_hi", ""),
                    json.dumps(node.get("steps", []), ensure_ascii=False),
                    "",
                    "UNDERSTAND",
                    2,
                    idx + 1,
                    "v5_node",
                    "{}",
                    10,
                    60,
                ),
            )
        conn.commit()
    finally:
        conn.close()

    if compress_gz:
        gz_path = f"{db_path}.gz"
        with open(db_path, "rb") as f_in, gzip.open(gz_path, "wb") as f_out:
            shutil.copyfileobj(f_in, f_out)
        return gz_path
    return db_path


def export_chapter_specs_to_sqlite(spec_paths, output_db_path, gzip_output=True, version="2026.10.28"):
    out_db = Path(output_db_path)
    out_db.parent.mkdir(parents=True, exist_ok=True)
    total_nodes = 0
    gz_path = str(out_db)
    for sp in spec_paths:
        spec_dict = json.loads(Path(sp).read_text(encoding="utf-8"))
        total_nodes += len(spec_dict.get("NODES", []))
        gz_path = export_chapter_to_teas_sqlite(spec_dict, str(out_db), compress_gz=gzip_output)
    return {
        "chapters": len(spec_paths),
        "nodes": total_nodes,
        "db_path": str(out_db),
        "gzip_path": gz_path,
    }
