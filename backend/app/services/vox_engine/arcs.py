"""
Vox Explainer Narrative Arcs & Beat Mapping Library.
Ported from vox-director / beat-layer.md.
"""
from typing import Dict, Any, List

NARRATIVE_ARCS: Dict[str, Dict[str, Any]] = {
    "how_it_works": {
        "id": "how_it_works",
        "name": "How It Works (System Explainer)",
        "description": "Explains a complex concept, economic mechanism, or tech architecture step by step.",
        "best_for": ["Economics", "Tech & AI", "Science", "Business Models", "Mechanisms"],
        "beats": [
            {"role": "hook", "name": "The Counter-Intuitive Truth", "target_seconds": 4, "shot_type": "EST_WIDE", "camera": "push_in"},
            {"role": "misconception", "name": "What Everyone Assumes", "target_seconds": 6, "shot_type": "MEDIUM", "camera": "parallax"},
            {"role": "hidden_engine", "name": "The Hidden Mechanism", "target_seconds": 8, "shot_type": "CLOSE", "camera": "element"},
            {"role": "step_breakdown", "name": "Step-by-Step Chain Reaction", "target_seconds": 9, "shot_type": "WIDE", "camera": "pan"},
            {"role": "implication", "name": "The Systemic Consequence", "target_seconds": 7, "shot_type": "MEDIUM", "camera": "tilt"},
            {"role": "payoff", "name": "The Big Takeaway / Warning", "target_seconds": 5, "shot_type": "DETAIL", "camera": "static"},
        ]
    },
    "timeline": {
        "id": "timeline",
        "name": "Timeline & Evolution",
        "description": "Chronological history tracing how an idea or empire evolved from origins to present day.",
        "best_for": ["History", "Company Evolution", "Geopolitics", "Culture", "Inventions"],
        "beats": [
            {"role": "hook", "name": "The Modern Contrast", "target_seconds": 4, "shot_type": "EST_WIDE", "camera": "push_in"},
            {"role": "origin", "name": "The Humblest Beginning", "target_seconds": 6, "shot_type": "MEDIUM", "camera": "pull_out"},
            {"role": "catalyst", "name": "The Inflection Point", "target_seconds": 7, "shot_type": "CLOSE", "camera": "element"},
            {"role": "golden_era", "name": "The Unstoppable Surge", "target_seconds": 8, "shot_type": "WIDE", "camera": "pan"},
            {"role": "crisis", "name": "The Crisis or Turning Point", "target_seconds": 7, "shot_type": "MEDIUM", "camera": "tilt"},
            {"role": "present_day", "name": "Where It Stands Today", "target_seconds": 5, "shot_type": "DETAIL", "camera": "static"},
        ]
    },
    "pas": {
        "id": "pas",
        "name": "Problem - Agitate - Solve",
        "description": "High-urgency problem exposure that agitates the pain before revealing the breakthrough.",
        "best_for": ["Investigative", "Financial Traps", "Health/Productivity", "Systemic Flaws"],
        "beats": [
            {"role": "hook", "name": "The Urgent Problem", "target_seconds": 3, "shot_type": "CLOSE", "camera": "push_in"},
            {"role": "agitate", "name": "Why It's Worse Than You Realize", "target_seconds": 8, "shot_type": "MEDIUM", "camera": "parallax"},
            {"role": "cost", "name": "The Invisible Compounding Cost", "target_seconds": 7, "shot_type": "EST_WIDE", "camera": "tilt"},
            {"role": "solution", "name": "The Counter-Intuitive Fix", "target_seconds": 8, "shot_type": "WIDE", "camera": "element"},
            {"role": "cta", "name": "The Actionable Rule", "target_seconds": 4, "shot_type": "DETAIL", "camera": "static"},
        ]
    },
    "myth_buster": {
        "id": "myth_buster",
        "name": "Myth Buster (Fallacy Breakdown)",
        "description": "Exposes a widely held public misconception with hard empirical data.",
        "best_for": ["Debunking", "Finance & Wealth", "Common Knowledge", "Science Facts"],
        "beats": [
            {"role": "hook", "name": "The Fact You Were Lied To About", "target_seconds": 4, "shot_type": "CLOSE", "camera": "push_in"},
            {"role": "the_myth", "name": "The Popular Lie Everyone Repeats", "target_seconds": 7, "shot_type": "MEDIUM", "camera": "pull_out"},
            {"role": "the_proof", "name": "What The Hard Data Actually Shows", "target_seconds": 8, "shot_type": "WIDE", "camera": "element"},
            {"role": "who_benefits", "name": "Why The Myth Was Created", "target_seconds": 7, "shot_type": "EST_WIDE", "camera": "pan"},
            {"role": "verdict", "name": "The New Reality Rule", "target_seconds": 5, "shot_type": "DETAIL", "camera": "static"},
        ]
    },
    "man_in_hole": {
        "id": "man_in_hole",
        "name": "Man In Hole (Transformation / Crisis)",
        "description": "A classic compelling story arc: things were great, hit rock bottom, climbed back stronger.",
        "best_for": ["Founder Stories", "Market Crashes", "Scandals", "Turnarounds"],
        "beats": [
            {"role": "hook", "name": "The Peak of Success", "target_seconds": 4, "shot_type": "EST_WIDE", "camera": "push_in"},
            {"role": "the_fall", "name": "The Sudden Collapse", "target_seconds": 7, "shot_type": "CLOSE", "camera": "tilt"},
            {"role": "rock_bottom", "name": "Rock Bottom & Disbelief", "target_seconds": 7, "shot_type": "MEDIUM", "camera": "parallax"},
            {"role": "the_pivot", "name": "The Survival Strategy", "target_seconds": 8, "shot_type": "WIDE", "camera": "element"},
            {"role": "the_payoff", "name": "The Reinvented Victor", "target_seconds": 5, "shot_type": "DETAIL", "camera": "static"},
        ]
    },
    "listicle": {
        "id": "listicle",
        "name": "Countdown & Power Rankings",
        "description": "Numbered countdown of factors, rules, or asymmetric advantages.",
        "best_for": ["Top Strategies", "Rules of Wealth", "Key Mistakes", "Essential Principles"],
        "beats": [
            {"role": "hook", "name": "The Framework Promise", "target_seconds": 4, "shot_type": "EST_WIDE", "camera": "push_in"},
            {"role": "item_1", "name": "#3: The Foundation Rule", "target_seconds": 7, "shot_type": "MEDIUM", "camera": "pan"},
            {"role": "item_2", "name": "#2: The Asymmetric Lever", "target_seconds": 8, "shot_type": "CLOSE", "camera": "element"},
            {"role": "item_3", "name": "#1: The Dominant Factor", "target_seconds": 9, "shot_type": "WIDE", "camera": "parallax"},
            {"role": "summary", "name": "The Synthesis Rule", "target_seconds": 5, "shot_type": "DETAIL", "camera": "static"},
        ]
    }
}

DEFAULT_VOX_ARC = "how_it_works"

def get_vox_arc(arc_id: str) -> Dict[str, Any]:
    return NARRATIVE_ARCS.get(arc_id, NARRATIVE_ARCS[DEFAULT_VOX_ARC])

def list_vox_arcs() -> List[Dict[str, Any]]:
    return list(NARRATIVE_ARCS.values())
