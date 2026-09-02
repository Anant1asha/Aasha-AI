"""Multi-agent orchestrator — manages the pipeline job lifecycle.

Sequences the 6 agents through 9 stages, tracks job state, estimates cost,
and supports resume from any stage via --from-stage.
"""

from __future__ import annotations

import json
import logging
import shutil
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from ..agents import (
    AnalysisAgent,
    AssessmentAgent,
    DesignAgent,
    IngestAgent,
    LLEAgent,
    QAAgent,
)
from ..assemble import HTMLAssembler
from ..config import Config
from ..llm import LLMAdapter, LLMGenerationError
from ..schemas import STAGE_ORDER, Job, StageResult, generate_supplementary_assessments, enrich_content_map
from ..schemas.validator import validate_chapter_spec
from .agent_bus import AgentBus

logger = logging.getLogger(__name__)


class Orchestrator:
    """Coordinates the multi-agent pipeline.

    Pipeline stages:
      1. ingest   → raw_extract.json     (IngestAgent, no LLM)
      2. analyze  → content_map.json     (AnalysisAgent, LLM)
      3. design   → chapter_spec.json    (DesignAgent, LLM)
      4. assess   → chapter_spec.json     (AssessmentAgent, LLM, updates spec)
      5. lle      → lle.json             (LLEAgent, LLM)
      6. assemble → chapter.html         (HTMLAssembler, no LLM)
      7. qa       → qa_report.json       (QAAgent, no LLM)
      8. output   → copies to output dir  (deterministic)
    """

    def __init__(self, config: Config):
        self.config = config
        self.template_path = config.template_full_path()
        self.defaults_path = config.defaults_full_path()
        self.schema_path = config.schema_full_path()
        self.work_root = Path(config.pipeline.work_dir)
        self.output_dir = Path(config.pipeline.output_dir)
        self.jobs_dir = Path(config.pipeline.jobs_dir)
        self.work_root.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.jobs_dir.mkdir(parents=True, exist_ok=True)

    def _create_llm(self, provider: str, temperature: float = 0.0) -> LLMAdapter:
        """Create an LLM adapter for the given provider."""
        provider_config = self.config.llm.providers.get(provider, None)
        model = provider_config.model if provider_config else ""
        return LLMAdapter(
            provider=provider,
            model=model,
            temperature=temperature,
            cache_dir=self.config.llm.cache_dir,
            max_retries=self.config.llm.max_retries,
            backoff_base=self.config.llm.backoff_base,
            backoff_max=self.config.llm.backoff_max,
            rate_limit_delay=getattr(self.config.llm, "rate_limit_delay", 1.0),
        )

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def create_job(
        self,
        pdf_path: str | Path,
        subject: str = "math",
        grade: int = 4,
        provider: str = "openai",
        mode: str = "v5-engine",
    ) -> str:
        """Create a new job and return the job ID."""
        from ..schemas import STAGE_ORDER_V5, STAGE_ORDER_FS
        
        job_id = str(uuid.uuid4())
        work_dir = self.work_root / job_id
        work_dir.mkdir(parents=True, exist_ok=True)

        # Copy PDF to work dir
        pdf_path = Path(pdf_path)
        if pdf_path.exists():
            shutil.copy(str(pdf_path), str(work_dir / "source.pdf"))

        stage_order = STAGE_ORDER_FS if mode == "full-synthesis" else STAGE_ORDER_V5

        job = Job(
            id=job_id,
            status="queued",
            created_at=self._now_iso(),
            updated_at=self._now_iso(),
            input={
                "source_pdf": pdf_path.name,
                "subject": subject,
                "grade": grade,
                "provider": provider,
                "model": "",
                "mode": mode,
            },
            stages=[
                StageResult(name=stage, status="pending")
                for stage in stage_order
            ],
        )

        self._save_job(job, work_dir)
        bus = AgentBus(work_dir)
        bus.publish("job.created", {
            "job_id": job_id,
            "subject": subject,
            "grade": grade,
            "provider": provider,
            "mode": mode
        })
        return job_id

    def _save_job(self, job: Job, work_dir: Path) -> None:
        """Save job.json to both work dir and jobs dir."""
        job.updated_at = self._now_iso()
        job_data = job.model_dump()

        # Save to work dir
        with open(work_dir / "job.json", "w", encoding="utf-8") as f:
            json.dump(job_data, f, ensure_ascii=False, indent=2)

        # Save to jobs dir
        job_file = self.jobs_dir / f"{job.id}.json"
        with open(job_file, "w", encoding="utf-8") as f:
            json.dump(job_data, f, ensure_ascii=False, indent=2)

    def _update_stage(self, job: Job, stage: str, status: str, duration: float = 0, output: str = "", error: str = ""):
        for s in job.stages:
            if s.name == stage:
                s.status = status
                s.duration_s = duration
                s.output = output
                s.error = error
                break

    def _get_job_work_dir(self, job_id: str) -> Path:
        return self.work_root / job_id

    def _load_job(self, job_id: str) -> Job:
        job_file = self.jobs_dir / f"{job_id}.json"
        if not job_file.exists():
            # Check work dir
            work_dir = self._get_job_work_dir(job_id)
            job_file = work_dir / "job.json"
        with open(job_file, "r", encoding="utf-8") as f:
            return Job.model_validate(json.load(f))

    def run_pipeline(
        self,
        job_id: str,
        from_stage: str | None = None,
        log_callback=None,
        max_cost: float = 0.50,
    ) -> Job:
        """Run the full pipeline for a job.

        Args:
            job_id: The job ID to run
            from_stage: Resume from this stage (skip earlier stages)
            log_callback: Optional callback for log messages
            max_cost: Maximum allowed cost in USD

        Returns:
            Updated Job object
        """
        job = self._load_job(job_id)
        work_dir = self._get_job_work_dir(job_id)

        if not work_dir.exists():
            raise FileNotFoundError(f"Work directory not found for job {job_id}")

        context = {
            "pdf_path": str(work_dir / "source.pdf"),
            "subject": job.input.subject,
            "grade": job.input.grade,
            "provider": job.input.provider,
        }

        json_log_path = work_dir / "pipeline.log"
        
        def log(msg: str, **kwargs):
            logger.info(msg)
            if log_callback:
                log_callback(msg)
            
            log_entry = {
                "timestamp": self._now_iso(),
                "message": msg,
                **kwargs
            }
            with open(json_log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry) + "\n")

        from ..schemas import STAGE_ORDER_V5, STAGE_ORDER_FS
        stage_order = STAGE_ORDER_FS if job.input.mode == "full-synthesis" else STAGE_ORDER_V5

        # Determine starting stage
        start_idx = 0
        if from_stage:
            if from_stage in stage_order:
                start_idx = stage_order.index(from_stage)
                log(f"Resuming from stage: {from_stage}")
            else:
                log(f"Unknown stage '{from_stage}', starting from beginning")

        job.status = "running"
        self._save_job(job, work_dir)
        bus = AgentBus(work_dir)

        total_cost = 0.0

        try:
            for i in range(start_idx, len(stage_order)):
                stage = stage_order[i]
                log(f"[{i+1}/{len(stage_order)}] {stage}...")
                
                if total_cost > max_cost:
                    error_msg = f"Max cost exceeded: ${total_cost:.4f} > ${max_cost:.4f}"
                    log(f"  ERROR: {error_msg}")
                    self._update_stage(job, stage, "failed", error=error_msg)
                    job.status = "failed"
                    job.error_stage = stage
                    job.error_message = error_msg
                    job.cost_usd = total_cost
                    self._save_job(job, work_dir)
                    bus.publish("stage.failed", {"stage": stage, "error": error_msg})
                    return job

                self._update_stage(job, stage, "running")
                job.status = stage
                self._save_job(job, work_dir)
                bus.publish("stage.started", {"stage": stage})

                stage_start = time.time()
                stage_result = {}

                try:
                    if stage == "ingest":
                        agent = IngestAgent()
                        stage_result = agent.run(work_dir, context)
                        for entry in agent.logs:
                            log(f"  {entry}")

                    elif stage == "analyze":
                        llm = self._create_llm(context["provider"])
                        agent = AnalysisAgent(llm)
                        stage_result = agent.run(work_dir, context)
                        total_cost += llm.cost_estimate
                        job.costs["AnalysisAgent"] = job.costs.get("AnalysisAgent", 0) + llm.cost_estimate
                        for entry in agent.logs:
                            log(f"  {entry}")

                        if job.input.mode == "full-synthesis":
                            # Stage 2 of full-synthesis: Analyze + Extract Exercises → pedagogy_map.json
                            # IngestAgent output (raw_extract.json) + ExerciseExtractor + AnalysisAgent output
                            from ..exercise import ExerciseExtractor
                            extractor = ExerciseExtractor()
                            raw_extract = json.loads((work_dir / "raw_extract.json").read_text(encoding="utf-8"))
                            exercises = extractor.extract(raw_extract)
                            ex_dicts = [ex.to_dict() for ex in exercises]

                            content_map = json.loads((work_dir / "content_map.json").read_text(encoding="utf-8"))
                            pedagogy_map = enrich_content_map(content_map, ex_dicts)

                            with open(work_dir / "pedagogy_map.json", "w", encoding="utf-8") as f:
                                json.dump(pedagogy_map, f, indent=2)
                            stats = pedagogy_map.get("exercise_stats", {})
                            stage_result = {"output_file": str(work_dir / "pedagogy_map.json")}
                            log(f"  Created pedagogy_map.json: {stats.get('total', 0)} exercises, "
                                f"types={stats.get('by_type', {})}")
                            bus.publish("concept.identified", {"count": len(pedagogy_map.get("concepts", []))})
                            bus.publish("exercise.extracted", {"count": stats.get("total", 0)})

                    elif stage == "design":
                        if job.input.mode == "full-synthesis":
                            # Stage 3 of full-synthesis: Design Interactions → experience_plan.json
                            # Query PluginRegistry.find_best() for each concept
                            from ..plugins import create_default_registry
                            from ..plugins.base import InteractionRequest
                            registry = create_default_registry()
                            pedagogy_map = json.loads((work_dir / "pedagogy_map.json").read_text(encoding="utf-8"))

                            experience_plan = {"concepts": [], "plugins_used": []}
                            plugins_used_set = set()
                            for concept in pedagogy_map.get("concepts", []):
                                req = InteractionRequest(
                                    concept=concept.get("name", ""),
                                    subject=context["subject"],
                                    grade=context["grade"],
                                    suggested_model=concept.get("suggested_model", ""),
                                    context=concept.get("summary", ""),
                                )
                                best_plugin = registry.find_best(req)
                                plugin_name = best_plugin.metadata.name if best_plugin else None
                                if plugin_name:
                                    plugins_used_set.add(plugin_name)
                                experience_plan["concepts"].append({
                                    "name": concept.get("name", ""),
                                    "summary": concept.get("summary", ""),
                                    "key_ideas": concept.get("key_ideas", []),
                                    "difficulty": concept.get("difficulty", "medium"),
                                    "plugin": plugin_name,
                                })
                            experience_plan["plugins_used"] = sorted(plugins_used_set)

                            with open(work_dir / "experience_plan.json", "w", encoding="utf-8") as f:
                                json.dump(experience_plan, f, indent=2)
                            stage_result = {"output_file": str(work_dir / "experience_plan.json")}
                            log(f"  Created experience_plan.json: {len(experience_plan['concepts'])} concepts, "
                                f"plugins={experience_plan['plugins_used']}")
                            bus.publish("interaction.assigned", {"concepts": len(experience_plan["concepts"])})
                        else:
                            import concurrent.futures
                            
                            def run_design_agent():
                                llm = self._create_llm(context["provider"])
                                agent = DesignAgent(llm)
                                res = agent.run(work_dir, context)
                                return "DesignAgent", llm.cost_estimate, agent.logs, res
                                
                            def run_lle_agent():
                                llm = self._create_llm(context["provider"], temperature=0.2)
                                agent = LLEAgent(llm, str(self.defaults_path))
                                res = agent.run(work_dir, context)
                                return "LLEAgent", llm.cost_estimate, agent.logs, res

                            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
                                future_d = executor.submit(run_design_agent)
                                future_l = executor.submit(run_lle_agent)
                                
                                agent_name_d, cost_d, logs_d, res_d = future_d.result()
                                agent_name_l, cost_l, logs_l, res_l = future_l.result()
                                
                            total_cost += cost_d + cost_l
                            job.costs[agent_name_d] = job.costs.get(agent_name_d, 0) + cost_d
                            job.costs[agent_name_l] = job.costs.get(agent_name_l, 0) + cost_l
                            
                            for entry in logs_d:
                                log(f"  [Design] {entry}")
                            for entry in logs_l:
                                log(f"  [LLE] {entry}")
                                
                            stage_result = res_d

                    elif stage == "assess":
                        if job.input.mode == "full-synthesis":
                            # Stage 4 of full-synthesis: Generate Assessments → assessment_suite.json
                            # Convert all extracted exercises into 3 gamified levels + generate supplementary
                            pedagogy_map = json.loads((work_dir / "pedagogy_map.json").read_text(encoding="utf-8"))
                            exercises = pedagogy_map.get("extracted_exercises", [])
                            concepts = pedagogy_map.get("concepts", [])

                            from ..exercise import ExerciseExtractor
                            extractor = ExerciseExtractor()

                            assessment_suite: dict[str, list] = {
                                "warmup": [],
                                "deep_dive": [],
                                "boss": [],
                            }

                            for ex in exercises:
                                level = extractor.to_assessment_level(ex.get("difficulty", "recall"))
                                assessment_suite[level].append(ex)

                            # Generate supplementary assessments to fill level gaps
                            assessment_suite = generate_supplementary_assessments(
                                assessment_suite,
                                subject=context["subject"],
                                concepts=concepts,
                            )

                            # Add summary stats
                            assessment_suite["total_xp"] = sum(
                                ex.get("xp", 5) for level_list in assessment_suite.values()
                                if isinstance(level_list, list) for ex in level_list
                            )
                            assessment_suite["level_counts"] = {
                                level: len(assessment_suite.get(level, []))
                                for level in ("warmup", "deep_dive", "boss")
                            }

                            with open(work_dir / "assessment_suite.json", "w", encoding="utf-8") as f:
                                json.dump(assessment_suite, f, indent=2)
                            counts = assessment_suite["level_counts"]
                            stage_result = {"output_file": str(work_dir / "assessment_suite.json")}
                            log(f"  Created assessment_suite.json: warmup={counts['warmup']}, "
                                f"deep_dive={counts['deep_dive']}, boss={counts['boss']}")
                            bus.publish("assessment.generated", {"total_xp": assessment_suite.get("total_xp", 0)})
                        else:
                            llm = self._create_llm(context["provider"])
                            agent = AssessmentAgent(llm)
                            stage_result = agent.run(work_dir, context)
                            total_cost += llm.cost_estimate
                            job.costs["AssessmentAgent"] = job.costs.get("AssessmentAgent", 0) + llm.cost_estimate
                            for entry in agent.logs:
                                log(f"  {entry}")

                    elif stage == "synthesize":
                        from ..synthesis.code_synthesizer import FrontendCodeSynthesizer
                        agent = FrontendCodeSynthesizer()
                        stage_result = agent.run(work_dir, context)
                        for entry in agent.logs:
                            log(f"  {entry}")

                    elif stage == "lle":
                        if (work_dir / "lle.json").exists():
                            log("  LLE already generated in parallel during Design stage.")
                            stage_result = {"output_file": str(work_dir / "lle.json")}
                        else:
                            llm = self._create_llm(context["provider"], temperature=0.2)
                            agent = LLEAgent(llm, str(self.defaults_path))
                            stage_result = agent.run(work_dir, context)
                            total_cost += llm.cost_estimate
                            job.costs["LLEAgent"] = job.costs.get("LLEAgent", 0) + llm.cost_estimate
                            for entry in agent.logs:
                                log(f"  {entry}")

                    elif stage == "assemble":
                        assembler = HTMLAssembler(str(self.template_path))
                        spec_path = work_dir / "chapter_spec.json"
                        lle_path = work_dir / "lle.json"
                        html_path = work_dir / "chapter.html"
                        assembler.assemble_to_file(
                            spec_path, lle_path, html_path, str(self.defaults_path)
                        )
                        stage_result = {"output_file": str(html_path)}
                        log(f"  Assembled chapter.html ({html_path.stat().st_size / 1024:.0f} KB)")

                    elif stage == "qa":
                        qa_runner = self.config.pipeline.qa_runner
                        agent = QAAgent(qa_runner)
                        stage_result = agent.run(work_dir, context)
                        for entry in agent.logs:
                            log(f"  {entry}")
                        
                        bus.publish("qa.result", {"passed": stage_result.get("passed", False)})

                        # Check if QA passed
                        if not stage_result.get("passed", False):
                            job.status = "qa_failed"
                            job.error_stage = "qa"
                            self._update_stage(
                                job, stage, "failed",
                                duration=time.time() - stage_start,
                                output=stage_result.get("output_file", ""),
                                error=f"QA failed with {stage_result.get('failure_count', 0)} failures"
                            )
                            job.cost_usd = total_cost
                            self._save_job(job, work_dir)
                            bus.publish("stage.failed", {"stage": stage, "error": f"QA failed with {stage_result.get('failure_count', 0)} failures"})
                            log(f"  QA FAILED — chapter not delivered")
                            return job

                    elif stage == "output":
                        # Copy to output directory
                        html_src = work_dir / "chapter.html"
                        spec_src = work_dir / "chapter_spec.json"

                        chapter_name = job.input.source_pdf.replace(".pdf", "").replace(" ", "_")
                        html_out = self.output_dir / f"{chapter_name}_chapter.html"
                        spec_out = self.output_dir / f"{chapter_name}_spec.json"

                        if html_src.exists():
                            shutil.copy(str(html_src), str(html_out))
                            job.outputs["html"] = str(html_out)
                        if spec_src.exists():
                            shutil.copy(str(spec_src), str(spec_out))
                            job.outputs["spec"] = str(spec_out)

                        # Full-synthesis mode: also copy intermediate JSONs
                        if job.input.mode == "full-synthesis":
                            for json_name in ("pedagogy_map.json", "experience_plan.json", "assessment_suite.json"):
                                json_src = work_dir / json_name
                                if json_src.exists():
                                    json_out = self.output_dir / f"{chapter_name}_{json_name}"
                                    shutil.copy(str(json_src), str(json_out))
                                    job.outputs[json_name] = str(json_out)

                        stage_result = {"html": str(html_out), "spec": str(spec_out)}
                        log(f"  Output: {html_out.name}")

                    duration = time.time() - stage_start
                    self._update_stage(
                        job, stage, "done",
                        duration=duration,
                        output=stage_result.get("output_file", ""),
                    )
                    job.cost_usd = total_cost
                    self._save_job(job, work_dir)
                    bus.publish("stage.completed", {
                        "stage": stage,
                        "duration": duration,
                        "output": stage_result.get("output_file", "")
                    })

                    log(f"  Done ({duration:.1f}s)")

                except LLMGenerationError as e:
                    log(f"  ERROR: {e}")
                    self._update_stage(job, stage, "failed", error=str(e))
                    job.status = "failed"
                    job.error_stage = stage
                    job.error_message = str(e)
                    job.cost_usd = total_cost
                    self._save_job(job, work_dir)
                    bus.publish("stage.failed", {"stage": stage, "error": str(e)})
                    return job

                except Exception as e:
                    log(f"  ERROR: {e}")
                    import traceback
                    traceback.print_exc()
                    self._update_stage(job, stage, "failed", error=str(e))
                    job.status = "failed"
                    job.error_stage = stage
                    job.error_message = str(e)
                    job.cost_usd = total_cost
                    self._save_job(job, work_dir)
                    bus.publish("stage.failed", {"stage": stage, "error": str(e)})
                    return job

            # All stages complete
            job.status = "completed"
            job.cost_usd = total_cost
            self._save_job(job, work_dir)
            log(f"Pipeline complete. Cost: ${total_cost:.4f}")

            return job

        except Exception as e:
            log(f"Pipeline error: {e}")
            job.status = "failed"
            job.error_stage = "pipeline"
            job.error_message = str(e)
            job.cost_usd = total_cost
            self._save_job(job, work_dir)
            return job

    def list_jobs(self) -> list[dict[str, Any]]:
        """List all jobs."""
        jobs = []
        for job_file in sorted(self.jobs_dir.glob("*.json"), reverse=True):
            try:
                with open(job_file, "r", encoding="utf-8") as f:
                    job_data = json.load(f)
                jobs.append({
                    "id": job_data.get("id", ""),
                    "source_pdf": job_data.get("input", {}).get("source_pdf", ""),
                    "status": job_data.get("status", ""),
                    "created_at": job_data.get("created_at", ""),
                    "cost_usd": job_data.get("cost_usd", 0),
                })
            except Exception:
                continue
        return jobs

    def get_job(self, job_id: str) -> Job | None:
        """Get a job by ID."""
        try:
            return self._load_job(job_id)
        except Exception:
            return None

    def get_job_work_dir(self, job_id: str) -> Path:
        """Get the work directory for a job."""
        return self._get_job_work_dir(job_id)
