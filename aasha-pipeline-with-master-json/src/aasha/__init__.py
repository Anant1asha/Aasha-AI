"""Aasha Pipeline — Multi-Agent AI Chapter Builder.

Converts NCERT textbook PDFs into gamified HTML chapters using the v5 engine.
"""

__version__ = "1.0.0"
__all__ = ["__version__"]

from pathlib import Path as _Path
_root_aasha_pkg = _Path(__file__).resolve().parents[4] / "src" / "aasha"
if _root_aasha_pkg.exists() and str(_root_aasha_pkg) not in __path__:
    __path__.append(str(_root_aasha_pkg))
