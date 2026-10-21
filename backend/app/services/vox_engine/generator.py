"""
Vox Explainer Project Generator.
Orchestrates narrative arc mapping, 5-part collage prompt synthesis,
and DOM/Remotion scene layout metadata for paper-collage explainers.
"""
from typing import Dict, Any, List, Optional
import random

from .themes import get_vox_theme
from .arcs import get_vox_arc
from .prompt_builder import compose_vox_keyframe_prompt
from backend.app.services.youtube_tools.hook_scorer import score_hook

class VoxExplainerGenerator:
    """
    Transforms user topics, ideas, or scripts into structured Vox paper-collage explainers.
    """

    @classmethod
    def generate_vox_project(
        cls,
        topic: str,
        theme_id: str = "swiss-modern",
        arc_id: str = "how_it_works",
        aspect_ratio: str = "9:16",
        existing_script: Optional[str] = None,
        target_duration: int = 40,
    ) -> Dict[str, Any]:
        theme = get_vox_theme(theme_id)
        arc = get_vox_arc(arc_id)
        bg_colors = theme.get("bg_colors", ["#FFFFFF", "#F4F4F6", "#18181B"])

        # Determine beats from existing script or narrative arc
        if existing_script and len(existing_script.strip()) > 30:
            raw_lines = [s.strip() for s in existing_script.replace('\n', ' ').split('.') if len(s.strip()) > 10]
            # Group into 4-6 beats
            chunk_size = max(1, len(raw_lines) // len(arc["beats"]))
            narrations = []
            for i in range(0, len(raw_lines), max(1, chunk_size)):
                narrations.append(". ".join(raw_lines[i:i+chunk_size]) + ".")
        else:
            narrations = None

        scenes: List[Dict[str, Any]] = []
        total_time = 0.0

        for i, beat_spec in enumerate(arc["beats"]):
            color_idx = i % len(bg_colors)
            bg_color = bg_colors[color_idx]

            # Narration
            if narrations and i < len(narrations):
                narration = narrations[i]
            else:
                # Default scripted beat based on topic and role
                narration = cls._synthesize_beat_narration(topic, beat_spec["role"], i == 0)

            # Headline banner text (2-4 punchy words)
            headline = cls._synthesize_headline(topic, beat_spec["role"], narration)

            # Visual cutouts & scene description
            scene_desc = cls._synthesize_scene_description(topic, beat_spec["role"], theme["name"])

            # 5-Part Prompt synthesis
            prompt_meta = compose_vox_keyframe_prompt(
                scene_description=scene_desc,
                headline_text=headline,
                theme_id=theme_id,
                bg_color_name=f"hex {bg_color}",
                aspect_ratio=aspect_ratio,
                is_detail_shot=(beat_spec["shot_type"] == "DETAIL")
            )

            # Estimate duration based on spoken words (2.4 words/second standard explainer cadence)
            word_count = len(narration.split())
            calc_dur = max(4.0, round(word_count / 2.4, 1))

            # Score opening hook on Beat 1
            hook_analysis = score_hook(narration) if i == 0 else None

            # Layout tokens for Remotion / DOM rendering
            layout_tokens = {
                "theme_id": theme_id,
                "bg_color": bg_color,
                "accent_color": theme["accent_color"],
                "secondary_color": theme["secondary_color"],
                "font_family": theme["font_family"],
                "font_heading": theme["font_heading"],
                "tape_color": theme["tape_color"],
                "paper_border": theme["paper_border"],
                "tape_rotations": [-3.5, 4.0, -2.0],
                "paper_tilt": -1.5 if i % 2 == 0 else 1.8,
                "shot_type": beat_spec["shot_type"],
                "camera_move": beat_spec["camera"],
                "highlight_phrase": cls._extract_highlight_phrase(narration),
            }

            scene = {
                "scene_number": i + 1,
                "beat_role": beat_spec["role"],
                "beat_name": beat_spec["name"],
                "narration": narration,
                "duration": calc_dur,
                "headline": headline,
                "prompt_metadata": prompt_meta,
                "layout_tokens": layout_tokens,
                "hook_analysis": hook_analysis,
                "aspect_ratio": aspect_ratio,
            }
            scenes.append(scene)
            total_time += calc_dur

        return {
            "title": f"The Vox Explainer: {topic}",
            "topic": topic,
            "video_mode": "vox_explainer",
            "theme": theme,
            "arc": arc,
            "aspect_ratio": aspect_ratio,
            "total_estimated_duration": round(total_time, 1),
            "scenes": scenes,
            "audio_config": {
                "bgm_genre": "investigative_minimal_piano",
                "bgm_ducking_db": -14.0,
                "foley_sound_effects": ["paper_slide.wav", "tape_slap.wav", "marker_squeak.wav"],
            }
        }

    @staticmethod
    def _synthesize_beat_narration(topic: str, role: str, is_hook: bool) -> str:
        if is_hook:
            return f"Almost everyone completely misinterprets how {topic} actually works, and the true mechanism is hidden in plain sight."
        if role == "misconception":
            return f"The standard narrative claims it's simple supply and demand. But look closer at the underlying transaction volume."
        if role == "hidden_engine":
            return f"Beneath the surface sits a self-reinforcing flywheel that compounds power away from everyday participants."
        if role == "step_breakdown":
            return f"Step one: leverage creates artificial liquidity. Step two: information asymmetry extracts the margin before anyone notices."
        if role == "implication":
            return f"Once you recognize this structural pattern, you realize modern incentives are entirely aligned around this loop."
        if role == "payoff":
            return f"The lesson is straightforward: don't play the visible game—understand the plumbing that controls the rules."
        return f"This foundational shift fundamentally redefines how we understand {topic} today."

    @staticmethod
    def _synthesize_headline(topic: str, role: str, narration: str) -> str:
        words = narration.replace(',', '').replace('.', '').split()
        if role == "hook":
            return f"THE {topic.upper()[:16]} ILLUSION"
        if role == "misconception":
            return "WHAT THEY TELL YOU"
        if role == "hidden_engine":
            return "THE HIDDEN ENGINE"
        if role == "step_breakdown":
            return "THE 2-STEP LOOP"
        if role == "implication":
            return "WHO CONTROLS IT"
        if role == "payoff":
            return "THE UNTOLD RULE"
        return "CRITICAL TAKEAWAY"

    @staticmethod
    def _synthesize_scene_description(topic: str, role: str, theme_name: str) -> str:
        return (
            f"A central hand-cut cardboard silhouette representing {topic}, surrounded by "
            f"torn archival newspaper columns, stamped arrows showing directional flow, "
            f"and translucent masking tape on the edges in the {theme_name} aesthetic."
        )

    @staticmethod
    def _extract_highlight_phrase(narration: str) -> str:
        words = narration.split()
        if len(words) >= 4:
            # Pick a middle 2-3 word phrase for kinetic highlighter animation
            mid = len(words) // 2
            return " ".join(words[mid:mid+3])
        return words[0] if words else "The Key Insight"
