"""API Router for YouTube Agent Skill Tools.
Exposes endpoints for hook scoring, package linting, dead-air EDL, chapters, retention diagnostics, and outlier analysis.
"""
from typing import Dict, List, Optional, Any
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field

from backend.app.services.youtube_tools import (
    score_hook, rank_hooks,
    lint_package,
    generate_edl, load_cues_from_string,
    extract_chapters,
    analyze_relative_outliers,
    analyze_retention
)

router = APIRouter(prefix="/api/tools", tags=["YouTube Tools"])

class HookScoreRequest(BaseModel):
    hook: Optional[str] = None
    hooks: Optional[List[str]] = None

class PackageLintRequest(BaseModel):
    title: str
    thumbnail_text: Optional[str] = None

class DeadAirRequest(BaseModel):
    transcript_text: str
    format: str = "srt" # srt, vtt, json
    dead_floor: float = 0.45

class ChaptersRequest(BaseModel):
    transcript_text: str
    format: str = "srt"
    target_count: int = 7
    min_chapter_duration: float = 10.0

class RelativeOutliersRequest(BaseModel):
    videos: List[Dict[str, Any]]
    min_multiplier: float = 1.8
    min_videos_per_channel: int = 4

class RetentionRequest(BaseModel):
    csv_content: str
    transcript_text: Optional[str] = None
    transcript_format: str = "srt"
    video_duration_seconds: Optional[float] = None
    axis_type: str = "auto"

@router.post("/hook-score")
def api_score_hook(req: HookScoreRequest):
    if req.hook:
        return score_hook(req.hook)
    elif req.hooks:
        return {
            "count": len(req.hooks),
            "ranked_hooks": rank_hooks(req.hooks)
        }
    raise HTTPException(status_code=400, detail="Must provide either 'hook' or 'hooks'.")

@router.post("/package-lint")
def api_lint_package(req: PackageLintRequest):
    if not req.title.strip():
        raise HTTPException(status_code=400, detail="Title cannot be empty.")
    return lint_package(req.title, req.thumbnail_text)

@router.post("/deadair-edl")
def api_deadair_edl(req: DeadAirRequest):
    cues = load_cues_from_string(req.transcript_text, req.format)
    if not cues:
        raise HTTPException(status_code=400, detail="Could not parse any cues from transcript.")
    return generate_edl(cues, dead_floor=req.dead_floor)

@router.post("/chapters")
def api_extract_chapters(req: ChaptersRequest):
    cues = load_cues_from_string(req.transcript_text, req.format)
    if not cues:
        raise HTTPException(status_code=400, detail="Could not parse any cues from transcript.")
    return extract_chapters(cues, target_count=req.target_count, min_chapter_duration=req.min_chapter_duration)

@router.post("/relative-outliers")
def api_relative_outliers(req: RelativeOutliersRequest):
    return analyze_relative_outliers(
        videos=req.videos,
        min_multiplier=req.min_multiplier,
        min_videos_per_channel=req.min_videos_per_channel
    )

@router.post("/retention-audit")
def api_retention_audit(req: RetentionRequest):
    cues = None
    if req.transcript_text:
        cues = load_cues_from_string(req.transcript_text, req.transcript_format)
    return analyze_retention(
        csv_content=req.csv_content,
        transcript_cues=cues,
        video_duration_seconds=req.video_duration_seconds,
        axis_type=req.axis_type
    )


from backend.app.services.social_branding_service import social_branding_service

@router.get("/social-branding")
def get_social_branding():
    """Retrieve configured social media handles and outro CTA settings."""
    return social_branding_service.get_branding()


@router.post("/social-branding")
def update_social_branding(payload: Dict[str, Any]):
    """Save or update social media handles and outro CTA settings."""
    return social_branding_service.update_branding(payload)

