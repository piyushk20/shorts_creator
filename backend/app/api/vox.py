"""
FastAPI endpoints for Vox Explainer Studio.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

from backend.app.services.vox_engine import (
    list_vox_themes,
    get_vox_theme,
    list_vox_arcs,
    get_vox_arc,
    VoxExplainerGenerator,
    compose_vox_keyframe_prompt
)

router = APIRouter(prefix="/api/vox", tags=["vox_explainer"])

class DraftBeatsRequest(BaseModel):
    topic: str
    theme_id: Optional[str] = "swiss-modern"
    arc_id: Optional[str] = "how_it_works"
    aspect_ratio: Optional[str] = "9:16"
    existing_script: Optional[str] = None
    target_duration: Optional[int] = 45

class PromptPreviewRequest(BaseModel):
    scene_description: str
    headline_text: str
    theme_id: Optional[str] = "swiss-modern"
    aspect_ratio: Optional[str] = "9:16"

@router.get("/themes")
def get_themes():
    """List all 9 Vox visual theme presets with color swatches & typography."""
    return {"themes": list_vox_themes()}

@router.get("/arcs")
def get_arcs():
    """List all narrative beat arcs (How It Works, Timeline, PAS, Myth Buster, etc.)."""
    return {"arcs": list_vox_arcs()}

@router.post("/draft-project")
def draft_vox_project(req: DraftBeatsRequest):
    """
    Synthesizes a complete Vox Explainer project draft with timed beats,
    5-part collage prompt metadata, and DOM/Remotion layout tokens.
    """
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic is required")

    project_data = VoxExplainerGenerator.generate_vox_project(
        topic=req.topic,
        theme_id=req.theme_id or "swiss-modern",
        arc_id=req.arc_id or "how_it_works",
        aspect_ratio=req.aspect_ratio or "9:16",
        existing_script=req.existing_script,
        target_duration=req.target_duration or 45
    )
    return project_data

@router.post("/preview-prompt")
def preview_prompt(req: PromptPreviewRequest):
    """Previews the 5-part paper-collage prompt for a given scene & headline."""
    prompt_data = compose_vox_keyframe_prompt(
        scene_description=req.scene_description,
        headline_text=req.headline_text,
        theme_id=req.theme_id or "swiss-modern",
        aspect_ratio=req.aspect_ratio or "9:16"
    )
    return prompt_data
