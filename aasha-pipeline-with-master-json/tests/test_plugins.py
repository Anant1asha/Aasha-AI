"""Tests for the plugin system."""

import pytest

from aasha.plugins import (
    create_default_registry,
    InteractionRequest,
    PluginRegistry,
)


@pytest.fixture
def registry():
    return create_default_registry()


def test_registry_has_13_plugins(registry):
    plugins = registry.list_plugins()
    assert len(plugins) == 13


def test_registry_has_fallback(registry):
    """Fallback should always be available."""
    req = InteractionRequest(concept="unknown_concept", subject="math", grade=4)
    best = registry.find_best(req)
    assert best is not None
    assert best.metadata.name == "v5-canvas"


def test_jsxgraph_handles_geometry(registry):
    req = InteractionRequest(concept="geometry", subject="math", grade=8, interaction_type="geometry")
    best = registry.find_best(req)
    assert best is not None
    step = best.render_step(req)
    assert step["t"] in ("jsxgraph", "mafs")  # Either could match


def test_phet_handles_physics(registry):
    req = InteractionRequest(concept="motion", subject="science", grade=9, interaction_type="simulation")
    best = registry.find_best(req)
    assert best is not None
    step = best.render_step(req)
    assert step["t"] == "phet"


def test_timeline_handles_history(registry):
    req = InteractionRequest(concept="history", subject="social_studies", grade=6, interaction_type="timeline")
    best = registry.find_best(req)
    assert best is not None
    assert best.metadata.name == "timeline"


def test_phonics_handles_english_k3(registry):
    req = InteractionRequest(concept="phonics", subject="english", grade=2, interaction_type="phonics_card")
    best = registry.find_best(req)
    assert best is not None
    assert best.metadata.name == "phonics"


def test_fabric_handles_anatomy(registry):
    req = InteractionRequest(concept="anatomy", subject="science", grade=7, interaction_type="labeling")
    best = registry.find_best(req)
    assert best is not None
    assert best.metadata.name == "fabric"


def test_scilab_handles_matrices(registry):
    req = InteractionRequest(concept="matrices", subject="math", grade=11, interaction_type="numerical_computation")
    best = registry.find_best(req)
    assert best is not None
    assert best.metadata.name == "scilab"


def test_vlab_handles_science_lab(registry):
    req = InteractionRequest(concept="titration", subject="science", grade=10, interaction_type="lab")
    best = registry.find_best(req)
    assert best is not None
    # Both vlab and phet can handle chemistry labs — either is acceptable
    assert best.metadata.name in ("vlab", "phet")


def test_plugins_provide_embed_assets(registry):
    """Each plugin should provide CSS/JS assets for embedding."""
    plugins = registry.list_plugins()
    for p_meta in plugins:
        plugin = registry.get(p_meta.name)
        if plugin and p_meta.name != "v5-canvas":
            assets = plugin.embed_assets()
            assert isinstance(assets, dict)


def test_all_step_types_are_strings(registry):
    """render_step should always return a dict with 't' field."""
    test_cases = [
        ("geometry", "math", 8, "geometry"),
        ("motion", "science", 9, "simulation"),
        ("history", "social_studies", 6, "timeline"),
        ("phonics", "english", 2, "phonics_card"),
        ("anatomy", "science", 7, "labeling"),
        ("fractions", "math", 4, "interactive_visual"),
        ("matrices", "math", 11, "numerical_computation"),
    ]
    for concept, subject, grade, itype in test_cases:
        req = InteractionRequest(concept=concept, subject=subject, grade=grade, interaction_type=itype)
        best = registry.find_best(req)
        assert best is not None, f"No plugin for {concept}"
        step = best.render_step(req)
        assert "t" in step, f"Step for {concept} missing 't' field"
        assert isinstance(step["t"], str)
