#!/usr/bin/env python3
"""
build_chapter.py — CLI entrypoint for the Aasha chapter-build agent.

Examples:
    # Full run from a real PDF, using the mock provider (no API key needed):
    python build_chapter.py --pdf source.pdf --subject math --grade 8 \\
        --title "Percentages" --storage-key aasha_percent_v5

    # Offline demo run without a PDF (uses a stub raw_extract):
    python build_chapter.py --stub-text "Percentage means per hundred..." \\
        --subject math --grade 8 --title "Percentages" --storage-key aasha_percent_v5

    # Real LLM provider:
    python build_chapter.py --pdf source.pdf --subject math --grade 8 \\
        --title "Percentages" --storage-key aasha_percent_v5 \\
        --provider anthropic --model claude-sonnet-5

    # Resume after hand-editing an intermediate JSON file:
    python build_chapter.py --job-id <id> --from-stage assess --subject math \\
        --grade 8 --title "Percentages" --storage-key aasha_percent_v5
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from orchestrator import run_pipeline, STAGES  # noqa: E402


def main() -> int:
    p = argparse.ArgumentParser(description="Aasha v5 chapter-build agent")
    p.add_argument("--pdf", help="Path to source chapter PDF")
    p.add_argument("--stub-text", help="Plain text to use instead of a PDF (offline demo)")
    p.add_argument("--subject", required=True, choices=["math", "science", "english", "evs"])
    p.add_argument("--grade", required=True, type=int)
    p.add_argument("--title", required=True)
    p.add_argument("--storage-key", required=True,
                    help="Must match ^aasha_[a-z0-9]+_v5$")
    p.add_argument("--provider", default="mock", choices=["mock", "openai", "anthropic", "gemini"])
    p.add_argument("--model", default="mock-1")
    p.add_argument("--work-dir", default="./work")
    p.add_argument("--output-dir", default="./output")
    p.add_argument("--from-stage", choices=STAGES, help="Resume from this stage")
    p.add_argument("--job-id", help="Required with --from-stage")
    args = p.parse_args()

    if not args.pdf and not args.stub_text and not args.from_stage:
        p.error("one of --pdf, --stub-text, or (--from-stage with --job-id) is required")
    if args.from_stage and not args.job_id:
        p.error("--from-stage requires --job-id")

    job = run_pipeline(
        pdf_path=args.pdf,
        subject=args.subject,
        grade=args.grade,
        title=args.title,
        storage_key=args.storage_key,
        work_dir=args.work_dir,
        output_dir=args.output_dir,
        provider_name=args.provider,
        model=args.model,
        from_stage=args.from_stage,
        job_id=args.job_id,
        stub_body_text=args.stub_text,
    )

    print(f"\nJob {job.job_id}: {job.state['status']}")
    if job.state["status"] == "failed":
        print(f"  Failed at stage: {job.state['error_stage']}")
        print(f"  Reason: {job.state['error_message']}")
        print(f"  Intermediate files: {job.dir}")
        return 1
    if job.state["status"] == "qa_failed":
        print(f"  QA failed with {len(job.state.get('qa_failures', []))} check(s):")
        for f in job.state.get("qa_failures", []):
            print(f"    ✗ [{f['check']}] {f['reason']}")
        print(f"  Fix chapter_spec.json in {job.dir} and re-run with:")
        print(f"    --from-stage assess --job-id {job.job_id}")
        return 1

    out = job.state.get("output", {})
    print(f"  HTML:  {out.get('html')}")
    print(f"  Spec:  {out.get('spec')}")
    print(f"  LLM calls: {out.get('llm_calls')}  (cache hits: {out.get('cache_hits')})")
    print(f"  Job dir (intermediate files, resumable): {job.dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
