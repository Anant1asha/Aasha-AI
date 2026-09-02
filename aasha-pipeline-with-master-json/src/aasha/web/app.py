"""Flask web UI for the Aasha pipeline.

Routes:
  GET  /              — Upload form
  POST /              — Create job, redirect to detail
  GET  /jobs          — List all jobs
  GET  /job/<id>      — Job detail (progress, log, result)
  GET  /job/<id>/preview   — Preview HTML in iframe
  GET  /job/<id>/download/html   — Download HTML
  GET  /job/<id>/download/spec   — Download JSON spec
  GET  /job/<id>/edit  — JSON spec editor
  POST /job/<id>/rerun — Re-run from stage
  GET  /api/job/<id>  — JSON job status (for polling)
"""

from __future__ import annotations

import json
from pathlib import Path

from flask import (
    Flask,
    abort,
    jsonify,
    render_template,
    request,
    send_file,
    url_for,
    redirect,
)
import threading

from ..config import Config
from ..pipeline import Orchestrator


def create_app(config: Config) -> Flask:
    app = Flask(__name__, template_folder="templates")
    app.config["SECRET_KEY"] = "aasha-pipeline-dev-key"

    orch = Orchestrator(config)

    @app.route("/")
    def upload_view():
        jobs = orch.list_jobs()
        return render_template("upload.html", jobs=jobs[:5])

    @app.route("/plugins")
    def plugins_view():
        # In a real app we'd fetch from PluginRegistry, here we use placeholder or actual registry if available
        try:
            from ..plugins import create_default_registry
            registry = create_default_registry()
            plugins = registry.list_all()
        except Exception:
            plugins = []
        return render_template("plugins.html", plugins=plugins)

    @app.route("/jobs")
    def jobs_list():
        jobs = orch.list_jobs()
        return render_template("jobs.html", jobs=jobs)

    @app.route("/job/<job_id>")
    def job_detail(job_id: str):
        job = orch.get_job(job_id)
        if not job:
            abort(404)
        work_dir = orch.get_job_work_dir(job_id)
        return render_template("job_detail.html", job=job, work_dir=work_dir)

    @app.route("/job/<job_id>/preview")
    def job_preview(job_id: str):
        work_dir = orch.get_job_work_dir(job_id)
        html_path = work_dir / "chapter.html"
        if not html_path.exists():
            abort(404)
        return send_file(str(html_path))

    @app.route("/job/<job_id>/download/html")
    def download_html(job_id: str):
        work_dir = orch.get_job_work_dir(job_id)
        html_path = work_dir / "chapter.html"
        if not html_path.exists():
            abort(404)
        return send_file(str(html_path), as_attachment=True, download_name="chapter.html")

    @app.route("/job/<job_id>/download/spec")
    def download_spec(job_id: str):
        work_dir = orch.get_job_work_dir(job_id)
        spec_path = work_dir / "chapter_spec.json"
        if not spec_path.exists():
            abort(404)
        return send_file(str(spec_path), as_attachment=True, download_name="chapter_spec.json")

    @app.route("/job/<job_id>/edit", methods=["GET", "POST"])
    def edit_spec(job_id: str):
        work_dir = orch.get_job_work_dir(job_id)
        spec_path = work_dir / "chapter_spec.json"

        if request.method == "POST":
            spec_text = request.form.get("spec", "")
            try:
                spec_data = json.loads(spec_text)
                with open(spec_path, "w", encoding="utf-8") as f:
                    json.dump(spec_data, f, ensure_ascii=False, indent=2)
                return redirect(url_for("job_detail", job_id=job_id))
            except json.JSONDecodeError as e:
                return render_template("edit_spec.html", job_id=job_id, spec=spec_text, error=str(e))

        if not spec_path.exists():
            abort(404)

        with open(spec_path, "r", encoding="utf-8") as f:
            spec_text = f.read()

        return render_template("edit_spec.html", job_id=job_id, spec=spec_text, error=None)

    @app.route("/job/<job_id>/rerun", methods=["POST"])
    def rerun(job_id: str):
        from_stage = request.form.get("from_stage", "assemble")

        def run_in_background():
            orch.run_pipeline(job_id, from_stage=from_stage)

        thread = threading.Thread(target=run_in_background, daemon=True)
        thread.start()

        return jsonify({"status": "started", "from_stage": from_stage})

    @app.route("/api/job/<job_id>")
    def api_job_status(job_id: str):
        job = orch.get_job(job_id)
        if not job:
            abort(404)
        
        work_dir = orch.get_job_work_dir(job_id)
        try:
            from ..pipeline.agent_bus import AgentBus
            bus = AgentBus(work_dir)
            messages = bus.read_all()
        except Exception:
            messages = []
            
        data = job.model_dump()
        data["messages"] = messages
        return jsonify(data)

    @app.route("/api/upload", methods=["POST"])
    def api_upload():
        file = request.files.get("pdf")
        if not file or not file.filename:
            return jsonify({"error": "No file uploaded"}), 400

        subject = request.form.get("subject", "math")
        grade = int(request.form.get("grade", 4))
        provider = request.form.get("provider", "openai")
        mode = request.form.get("mode", "v5-engine")
        board = request.form.get("board", "CBSE")
        language = request.form.get("language", "en")

        # Save to temp, create job
        import tempfile
        tmp = Path(tempfile.mktemp(suffix=".pdf"))
        file.save(str(tmp))

        # We pass mode, but create_job currently doesn't accept board/language,
        # but we can pass them if they are supported or at least pass mode.
        job_id = orch.create_job(
            pdf_path=tmp,
            subject=subject,
            grade=grade,
            provider=provider,
            mode=mode,
        )

        # Start pipeline in background
        def run_in_background():
            orch.run_pipeline(job_id)

        thread = threading.Thread(target=run_in_background, daemon=True)
        thread.start()

        return jsonify({"job_id": job_id})

    return app
