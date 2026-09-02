"""Aasha Pipeline CLI — build_chapter.py entry point.

Usage:
  # Single chapter (v5-engine mode, default)
  python -m aasha.cli --pdf chapter.pdf --subject math --grade 4

  # Single chapter (full-synthesis 4-agent mode)
  python -m aasha.cli --pdf chapter.pdf --subject math --grade 4 --mode full-synthesis

  # Batch mode
  python -m aasha.cli --batch ./chapters/ --subject math --grade 4

  # Resume from stage (after editing spec)
  python -m aasha.cli --pdf chapter.pdf --from-stage assemble

  # Web UI
  python -m aasha.cli --web
"""

from __future__ import annotations

import argparse
import logging
import sys
import time
from pathlib import Path

from .config import Config
from .pipeline import Orchestrator

logger = logging.getLogger(__name__)


def setup_logging(verbose: bool = False):
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
        datefmt="%H:%M:%S",
    )


def run_single(args, config: Config) -> int:
    """Run a single chapter build."""
    orch = Orchestrator(config)

    pdf_path = Path(args.pdf)
    if not pdf_path.exists():
        print(f"Error: PDF not found: {pdf_path}")
        return 1

    # Validate PDF
    if pdf_path.stat().st_size > 50 * 1024 * 1024:
        print(f"Error: PDF exceeds max size of 50MB")
        return 1

    try:
        import PyPDF2
        with open(pdf_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            num_pages = len(reader.pages)
            if num_pages > 200:
                print(f"Error: PDF exceeds max page count of 200 (has {num_pages})")
                return 1
            
            # check text-based
            text_found = False
            for i in range(min(5, num_pages)):
                page = reader.pages[i]
                text = page.extract_text()
                if text and len(text.strip()) > 50:
                    text_found = True
                    break
            
            if not text_found:
                print("Error: PDF appears to be non-text based (scanned/images). Please provide a text-based PDF.")
                return 1
    except ImportError:
        pass # Skip if PyPDF2 not installed
    except Exception as e:
        print(f"Error validating PDF: {e}")
        return 1

    print(f"Creating job for: {pdf_path.name}")
    job_id = orch.create_job(
        pdf_path=pdf_path,
        subject=args.subject,
        grade=args.grade,
        provider=args.provider,
        mode=args.mode,
    )
    print(f"Job ID: {job_id}")

    from_stage = args.from_stage if hasattr(args, "from_stage") and args.from_stage else None

    stage_labels = {
        "ingest": "Ingesting PDF", "analyze": "Analyzing content",
        "design": "Designing learning", "assess": "Generating assessments",
        "lle": "Generating LLE", "assemble": "Assembling HTML",
        "synthesize": "Synthesizing HTML", "qa": "Running QA",
        "output": "Writing output",
    }

    def log_callback(msg: str):
        print(f"  {msg}")

    start_time = time.time()
    job = orch.run_pipeline(
        job_id,
        from_stage=from_stage,
        log_callback=log_callback,
        max_cost=args.max_cost
    )
    duration = time.time() - start_time

    print()
    print(f"Status: {'PASS' if job.status == 'completed' else 'FAIL'}")
    print(f"Duration: {duration:.1f}s")
    print(f"LLM Cost: ${job.cost_usd:.4f}")

    if job.status == "completed":
        html_path = job.outputs.get("html", "")
        print(f"Output: {html_path}")
        return 0
    else:
        print(f"Failed at stage: {job.error_stage}")
        print(f"Error: {job.error_message}")
        print(f"To resume after fixing, run:")
        print(f"python -m aasha.cli --pdf {args.pdf} --from-stage {job.error_stage}")
        return 1


def run_batch(args, config: Config) -> int:
    """Run batch mode over a directory of PDFs."""
    batch_dir = Path(args.batch)
    if not batch_dir.is_dir():
        print(f"Error: Directory not found: {batch_dir}")
        return 1

    pdfs = sorted(batch_dir.glob("*.pdf"))
    if not pdfs:
        print(f"No PDFs found in {batch_dir}")
        return 1

    print(f"Processing {len(pdfs)} PDFs...")
    print()

    results = []
    total_cost = 0.0
    total_time = 0.0

    for i, pdf_path in enumerate(pdfs, 1):
        print(f"[{i}/{len(pdfs)}] {pdf_path.name}...", end=" ", flush=True)

        orch = Orchestrator(config)
        job_id = orch.create_job(
            pdf_path=pdf_path,
            subject=args.subject,
            grade=args.grade,
            provider=args.provider,
            mode=args.mode,
        )

        start = time.time()
        job = orch.run_pipeline(job_id, max_cost=args.max_cost)
        dur = time.time() - start

        total_time += dur
        total_cost += job.cost_usd

        if job.status == "completed":
            print(f"PASS ({dur:.0f}s, ${job.cost_usd:.2f})")
            results.append(("pass", pdf_path.name, dur, job.cost_usd))
        else:
            print(f"FAIL ({job.error_stage})")
            results.append(("fail", pdf_path.name, dur, job.cost_usd))

    passed = sum(1 for r in results if r[0] == "pass")
    failed = len(results) - passed

    print()
    print(f"Summary: {passed} built, {failed} failed. "
          f"Cost: ${total_cost:.2f}. Time: {total_time:.0f}s.")

    return 0 if failed == 0 else 1


def run_web(args, config: Config) -> int:
    """Run the Flask web UI."""
    from .web.app import create_app
    app = create_app(config)
    print(f"Starting web UI at http://{config.web.host}:{config.web.port}")
    app.run(host=config.web.host, port=config.web.port, debug=config.web.debug)
    return 0


def main():
    parser = argparse.ArgumentParser(
        description="Aasha Pipeline — Multi-Agent AI Chapter Builder",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Build a single chapter
  python -m aasha.cli --pdf chapter.pdf --subject math --grade 4

  # Batch processing
  python -m aasha.cli --batch ./chapters/ --subject math --grade 4

  # Resume from assembly (after editing spec)
  python -m aasha.cli --pdf chapter.pdf --from-stage assemble

  # Web UI
  python -m aasha.cli --web
        """,
    )
    parser.add_argument("--pdf", help="Path to a single PDF file")
    parser.add_argument("--batch", help="Directory of PDFs for batch processing")
    parser.add_argument("--subject", default="math", help="Subject (math, science, english, evs)")
    parser.add_argument("--grade", type=int, default=4, help="Grade level (3-8)")
    parser.add_argument("--provider", default="openai", help="LLM provider (openai, gemini, anthropic)")
    parser.add_argument("--mode", default="v5-engine", choices=["v5-engine", "full-synthesis"], help="Pipeline mode: v5-engine (default, 6-agent flow) or full-synthesis (4-agent flow with plugin registry, exercise extractor, code synthesizer)")
    parser.add_argument("--from-stage", dest="from_stage", help="Resume from stage. v5-engine: ingest, analyze, design, assess, lle, assemble, qa, output. full-synthesis: ingest, analyze, design, assess, synthesize, qa, output")
    parser.add_argument("--web", action="store_true", help="Start the web UI")
    parser.add_argument("--max-cost", type=float, default=0.50, help="Maximum cost in USD (default 0.50)")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose logging")
    parser.add_argument("--config", default=None, help="Path to config.yaml (default: ./config.yaml)")

    args = parser.parse_args()
    setup_logging(args.verbose)

    config = Config.load(args.config)

    if args.web:
        return run_web(args, config)
    elif args.batch:
        return run_batch(args, config)
    elif args.pdf:
        return run_single(args, config)
    else:
        parser.print_help()
        return 0


if __name__ == "__main__":
    sys.exit(main())
