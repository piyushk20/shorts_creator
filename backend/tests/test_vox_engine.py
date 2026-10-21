"""
Unit tests for Vox Explainer Paper-Collage Engine.
"""
import pytest
from backend.app.services.vox_engine import (
    list_vox_themes,
    get_vox_theme,
    list_vox_arcs,
    get_vox_arc,
    compose_vox_keyframe_prompt,
    VoxExplainerGenerator
)

def test_vox_themes_catalog():
    themes = list_vox_themes()
    assert len(themes) >= 9
    theme_ids = [t["id"] for t in themes]
    assert "swiss-modern" in theme_ids
    assert "punk-zine" in theme_ids
    assert "american-retro" in theme_ids
    assert "newsprint-editorial" in theme_ids

    swiss = get_vox_theme("swiss-modern")
    assert swiss["accent_color"] == "#E11D48"
    assert "Cabinet Grotesk" in swiss["font_heading"]

def test_vox_arcs_catalog():
    arcs = list_vox_arcs()
    assert len(arcs) >= 6
    arc_ids = [a["id"] for a in arcs]
    assert "how_it_works" in arc_ids
    assert "timeline" in arc_ids
    assert "pas" in arc_ids

    hiw = get_vox_arc("how_it_works")
    assert len(hiw["beats"]) >= 5
    assert hiw["beats"][0]["role"] == "hook"

def test_5part_prompt_composition():
    prompt_meta = compose_vox_keyframe_prompt(
        scene_description="A central cardboard silhouette of a banker with scissors cutting gold ribbon",
        headline_text="THE MONEY MULTIPLIER",
        theme_id="punk-zine",
        bg_color_name="hex #FFE600",
        aspect_ratio="9:16"
    )

    full = prompt_meta["full_prompt"]
    # Verify the 5 parts are present
    assert "Gritty DIY punk zine" in full  # Style
    assert "SCENE (as layered paper cut-outs)" in full  # Scene
    assert "hex #FFE600" in full  # Background
    assert "THE MONEY MULTIPLIER" in full  # Headline
    assert "NOT 3D render, NOT CGI" in full  # Tech specs

def test_vox_project_generation():
    proj = VoxExplainerGenerator.generate_vox_project(
        topic="Artificial Intelligence Capex",
        theme_id="newsprint-editorial",
        arc_id="how_it_works",
        aspect_ratio="9:16"
    )

    assert proj["video_mode"] == "vox_explainer"
    assert len(proj["scenes"]) == 6
    assert proj["scenes"][0]["beat_role"] == "hook"
    assert proj["scenes"][0]["hook_analysis"] is not None
    assert "verdict" in proj["scenes"][0]["hook_analysis"]
    assert proj["scenes"][0]["layout_tokens"]["paper_border"] == "deckled"
    assert proj["scenes"][0]["headline"] != ""

def test_vox_api_endpoints():
    from fastapi.testclient import TestClient
    from backend.app.main import app

    client = TestClient(app)

    # 1. Themes endpoint
    r_themes = client.get("/api/vox/themes")
    assert r_themes.status_code == 200
    themes_data = r_themes.json()
    assert "themes" in themes_data
    assert len(themes_data["themes"]) >= 9

    # 2. Arcs endpoint
    r_arcs = client.get("/api/vox/arcs")
    assert r_arcs.status_code == 200
    arcs_data = r_arcs.json()
    assert "arcs" in arcs_data
    assert len(arcs_data["arcs"]) >= 6

    # 3. Draft project endpoint
    r_draft = client.post("/api/vox/draft-project", json={
        "topic": "The Secret Architecture of Venice",
        "theme_id": "swiss-modern",
        "arc_id": "timeline",
        "aspect_ratio": "16:9"
    })
    assert r_draft.status_code == 200
    draft_data = r_draft.json()
    assert draft_data["video_mode"] == "vox_explainer"
    assert len(draft_data["scenes"]) == 6

    # 4. Create Project with video_mode='vox_explainer'
    r_proj = client.post("/api/projects", json={
        "title": "The Venice Miracle",
        "topic": "The Secret Architecture of Venice",
        "video_mode": "vox_explainer",
        "vox_theme": "swiss-modern",
        "vox_arc": "timeline",
        "aspect_ratio": "16:9",
        "target_duration": 45
    })
    assert r_proj.status_code == 200
    created_proj = r_proj.json()
    assert created_proj["title"] == "The Venice Miracle"
    assert len(created_proj["scenes"][0]["search_queries"]) >= 1
    assert "NOT 3D render, NOT CGI" in created_proj["scenes"][0]["visual_description"]
