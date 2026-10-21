"""
Vox Explainer Engine package.
"""
from .themes import THEME_PRESETS, get_vox_theme, list_vox_themes
from .arcs import NARRATIVE_ARCS, get_vox_arc, list_vox_arcs
from .prompt_builder import compose_vox_keyframe_prompt
from .generator import VoxExplainerGenerator

__all__ = [
    "THEME_PRESETS",
    "get_vox_theme",
    "list_vox_themes",
    "NARRATIVE_ARCS",
    "get_vox_arc",
    "list_vox_arcs",
    "compose_vox_keyframe_prompt",
    "VoxExplainerGenerator",
]
