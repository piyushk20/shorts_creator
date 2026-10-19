from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from backend.app.schemas.scene import SceneSchema

class ProjectCreateRequest(BaseModel):
    title: Optional[str] = None
    topic: Optional[str] = None
    existing_script: Optional[str] = None
    platform: str = "youtube_shorts"  # youtube_shorts, instagram_reels, youtube_video
    aspect_ratio: str = "9:16"        # 9:16, 16:9, 1:1
    target_duration: int = 45         # seconds
    language: str = "en"              # en, hi
    voice: str = "en-US-ChristopherNeural"
    voice_style: str = "energetic"
    visual_style: str = "cinematic"
    caption_style: str = "word_highlight"

class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    topic: Optional[str]
    platform: str
    aspect_ratio: str
    width: int
    height: int
    fps: int
    target_duration: int
    language: str
    voice: str
    voice_style: str
    visual_style: str
    caption_style: str
    status: str
    created_at: datetime
    updated_at: datetime
    scenes_count: int = 0

from backend.app.schemas.render import RenderJobResponse

class ProjectDetailResponse(ProjectResponse):
    scenes: List[SceneSchema] = []
    recommended_hook: Optional[str] = None
    hook_options: List[str] = []
    full_script: Optional[str] = None
    is_script_approved: bool = False
    latest_job: Optional[RenderJobResponse] = None
