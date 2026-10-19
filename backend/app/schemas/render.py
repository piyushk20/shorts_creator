from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AssetCandidate(BaseModel):
    id: str
    provider: str
    provider_asset_id: str
    source_url: str
    preview_url: Optional[str] = None
    download_url: Optional[str] = None
    creator: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None
    duration: Optional[float] = None
    orientation: str = "vertical"
    license_type: str = "Free to Use"
    rights_status: str = "VERIFIED_FOR_INTENDED_USE"
    relevance_score: float = 0.0
    score_breakdown: Dict[str, float] = {}

class RenderStartRequest(BaseModel):
    project_id: str
    renderer: str = "hyperframes"  # hyperframes, ffmpeg
    voice: Optional[str] = None
    voice_style: Optional[str] = None
    add_background_music: bool = True
    bgm_track: Optional[str] = "cinematic_ambient.aac"
    burn_subtitles: bool = True
    caption_position: str = "bottom"  # bottom, center, top

class RenderJobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    renderer: str
    status: str
    progress: int
    current_stage: str
    output_mp4_path: Optional[str]
    thumbnail_path: Optional[str]
    error_message: Optional[str]
    start_time: datetime
    end_time: Optional[datetime]

class QAFinding(BaseModel):
    check: str
    status: str  # PASS, WARNING, FAIL
    message: str

class QAReportResponse(BaseModel):
    job_id: str
    project_id: str
    passed: bool
    duration_match: bool
    audio_detected: bool
    resolution_match: bool
    safe_margins_pass: bool
    findings: List[QAFinding]
