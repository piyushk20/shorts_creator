from typing import List, Optional, Any
from pydantic import BaseModel, Field

class CaptionWordToken(BaseModel):
    word: str
    start: float  # seconds
    end: float    # seconds
    confidence: Optional[float] = 1.0

class SceneSchema(BaseModel):
    scene_id: str
    order: int
    role: str = "main"  # hook, setup, main, climax, payoff, outro
    narration: str
    estimated_duration_seconds: float = 5.0
    actual_duration_seconds: Optional[float] = None
    visual_description: str
    search_queries: List[str] = Field(default_factory=list)
    on_screen_text: Optional[str] = None
    transition_in: str = "fade"
    transition_out: str = "cut"
    selected_asset_id: Optional[str] = None
    asset_in_point_seconds: float = 0.0
    asset_out_point_seconds: Optional[float] = None
    audio_path: Optional[str] = None
    caption_style: str = "word_highlight"
    caption_tokens: List[CaptionWordToken] = Field(default_factory=list)
    review_status: str = "pending" # pending, approved, locked

class ScriptGenerationOutput(BaseModel):
    title: str
    hook_options: List[str]
    recommended_hook: str
    full_script: str
    target_duration_seconds: int
    scenes: List[SceneSchema]
