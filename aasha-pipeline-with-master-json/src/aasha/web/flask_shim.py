"""Lightweight zero-dependency Flask test/runtime shim for offline sandbox execution."""
from __future__ import annotations
import json
import re
from pathlib import Path
from urllib.parse import parse_qs, urlparse


class _HTTPAbort(Exception):
    def __init__(self, code: int):
        self.code = code


def abort(code: int):
    raise _HTTPAbort(code)


def jsonify(obj):
    return _ShimResponse(json.dumps(obj).encode("utf-8"), 200, "application/json")


def render_template(name: str, **ctx):
    return _ShimResponse(f"<!-- {name} -->".encode("utf-8"), 200, "text/html")


def send_file(path_str: str, as_attachment: bool = False, download_name: str | None = None):
    data = Path(path_str).read_bytes()
    return _ShimResponse(data, 200, "application/octet-stream")


def url_for(endpoint: str, **values):
    return f"/{endpoint}"


def redirect(location: str):
    return _ShimResponse(b"", 302, "text/plain")


class _UploadedFile:
    def __init__(self, stream, filename: str):
        self._stream = stream
        self.filename = filename

    def save(self, dst: str):
        Path(dst).write_bytes(self._stream.read())


class _RequestProxy:
    def __init__(self):
        self.method = "GET"
        self.args = {}
        self.form = {}
        self.files = {}


request = _RequestProxy()


class _ShimResponse:
    def __init__(self, data: bytes, status_code: int = 200, content_type: str = "text/html"):
        self.data = data
        self.status_code = status_code
        self.content_type = content_type

    def get_json(self):
        return json.loads(self.data.decode("utf-8"))


class Flask:
    def __init__(self, name: str, template_folder: str = "templates"):
        self.name = name
        self.config = {}
        self._routes = []

    def route(self, rule: str, methods: list[str] | None = None):
        allowed = methods or ["GET"]
        pattern = "^" + re.sub(r"<(?:\w+:)?(\w+)>", r"(?P<\1>[^/]+)", rule) + "$"
        rx = re.compile(pattern)

        def decorator(fn):
            self._routes.append((rx, allowed, fn))
            return fn

        return decorator

    def test_client(self):
        app = self

        class _Client:
            def get(self, url: str):
                return self._dispatch("GET", url, {})

            def post(self, url: str, data: dict | None = None, content_type: str = ""):
                return self._dispatch("POST", url, data or {})

            def _dispatch(self, method: str, url: str, data: dict):
                parsed = urlparse(url)
                request.method = method
                request.args = {k: v[0] for k, v in parse_qs(parsed.query).items()}
                request.form = {}
                request.files = {}
                for k, v in data.items():
                    if isinstance(v, tuple) and len(v) == 2:
                        request.files[k] = _UploadedFile(v[0], v[1])
                    else:
                        request.form[k] = str(v)
                for rx, allowed, fn in app._routes:
                    m = rx.match(parsed.path)
                    if m and method in allowed:
                        try:
                            res = fn(**m.groupdict())
                            if isinstance(res, tuple):
                                resp, code = res
                                resp.status_code = code
                                return resp
                            return res if isinstance(res, _ShimResponse) else _ShimResponse(str(res).encode("utf-8"))
                        except _HTTPAbort as ab:
                            return _ShimResponse(b"", ab.code)
                return _ShimResponse(b"Not Found", 404)

        return _Client()
