"""
5-Part Prompt Synthesizer for Vox Paper-Collage Explainer Keyframes.
Enforces tactile collage rules, background color blocking, headline banners, and anti-3D/CGI constraints.
"""
from typing import Dict, Any, Optional
from .themes import get_vox_theme, COLLAGE_MECHANICS

def compose_vox_keyframe_prompt(
    scene_description: str,
    headline_text: str,
    theme_id: str = "swiss-modern",
    bg_color_name: str = "warm cream cardstock",
    aspect_ratio: str = "9:16",
    is_detail_shot: bool = False
) -> Dict[str, Any]:
    """
    Composes a 5-part prompt adhering to the Vox Director specification:
    [1] Style Block
    [2] Scene Layers
    [3] Background Color
    [4] Headline Treatment
    [5] Tech Specs / Anti-CGI Guards
    """
    theme = get_vox_theme(theme_id)
    idiom = theme["idiom"]
    palette = theme["palette"]
    type_style = theme["type_style"]
    finish = theme["finish"]

    # 1. Style Block
    style_block = (
        f"{idiom}. Palette: {palette}. "
        f"{COLLAGE_MECHANICS.format(bg=bg_color_name)} "
        f"Print finish: {finish}."
    )

    # 2. Scene Layers
    scene_block = f"SCENE (as layered paper cut-outs): {scene_description}."

    # 3. Background Color
    bg_block = f"Set on a bold flat {bg_color_name} paper background with subtle cardboard drop shadows."

    # 4. Headline Banner
    if not is_detail_shot and headline_text:
        headline_block = (
            f"Include a torn-paper headline banner with big bold cut-out letters "
            f"'{headline_text.upper()}' in {type_style}, plus a small paper stamp or sticker accent. "
            f"Keep the headline crisp and legible."
        )
    else:
        headline_block = "No big headline text in this shot; this is a cut-in detail view of the physical collage pieces."

    # 5. Tech Specs & Anti-3D
    tech_block = (
        f"Aspect ratio {aspect_ratio}, high-contrast editorial photography, "
        f"NOT 3D render, NOT CGI, pure tactile paper craft and screenprint ink."
    )

    full_prompt = f"{style_block} {scene_block} {bg_block} {headline_block} {tech_block}"

    return {
        "full_prompt": full_prompt,
        "style_block": style_block,
        "scene_block": scene_block,
        "bg_block": bg_block,
        "headline_block": headline_block,
        "tech_block": tech_block,
        "theme_id": theme_id,
        "aspect_ratio": aspect_ratio,
        "headline_text": headline_text,
    }
