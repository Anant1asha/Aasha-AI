"""Offline Base64 Asset Bundler for AASHA AIOS Plugins & Phase-3 Visual Mechanics."""
import base64
import hashlib
import os
from pathlib import Path
from typing import Optional

class OfflineAssetBundler:
    def __init__(self, cache_dir: Optional[str] = None, phase3_dir: Optional[str] = None):
        self.cache_dir = Path(cache_dir or ".plugin_cache")
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self.phase3_dir = Path(phase3_dir) if phase3_dir else None

    def encode_js_to_data_uri(self, js_code: str, cache_key: str) -> str:
        b64 = base64.b64encode(js_code.encode("utf-8")).decode("ascii")
        cache_file = self.cache_dir / f"{cache_key}.b64"
        cache_file.write_text(b64, encoding="utf-8")
        return f"<script src=\"data:text/javascript;base64,{b64}\"></script>"

    def load_avr_mechanic(self, resource_id: str) -> Optional[str]:
        if not self.phase3_dir:
            return None
        js_file = self.phase3_dir / "tests" / f"{resource_id}.js"
        if js_file.is_file():
            return js_file.read_text(encoding="utf-8")
        return None
