"""Chapter Extractor Engine - Ported & enhanced from youtube-agent-skill.
Extracts YouTube-compliant video chapters from transcript cues.
Enforces YouTube's strict parsing rules:
- Starts at 00:00 (mandatory)
- At least 3 chapters
- Each chapter at least 10 seconds long
"""
import re
from typing import Dict, List, Optional, Tuple, Any
from backend.app.services.youtube_tools.deadair_detector import load_cues_from_string, load_cues_from_file

STOP_WORDS = set(
    "the a an of for to in on and or is are was were be been with this that it as at by from "
    "you your i my we our they them he she but so if then than there here what which who how "
    "when where why not no yes do does did just really very like about into over out up down "
    "can could will would should have has had get got make made go going went one two".split()
)

def extract_keywords(text: str) -> set:
    return {w for w in re.findall(r"[a-z']{4,}", text.lower()) if w not in STOP_WORDS}

def format_timestamp(seconds: float) -> str:
    t = int(seconds)
    h, m, s = t // 3600, (t % 3600) // 60, t % 60
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"

def extract_chapters(
    cues: List[Tuple[float, float, str]],
    target_count: int = 7,
    min_chapter_duration: float = 10.0
) -> Dict[str, Any]:
    if len(cues) < 6:
        return {
            "valid": False,
            "error": "Too few spoken cues to generate meaningful chapters.",
            "chapters": [],
            "description_block": ""
        }
        
    duration = cues[-1][1]
    candidates = []
    
    for i in range(1, len(cues)):
        gap = cues[i][0] - cues[i - 1][1]
        before = " ".join(c[2] for c in cues[max(0, i - 12):i])
        after = " ".join(c[2] for c in cues[i:i + 12])
        kb, ka = extract_keywords(before), extract_keywords(after)
        shift = 1.0 - (len(kb & ka) / len(kb | ka)) if (kb | ka) else 0.0
        boundary_score = (gap * 1.6) + (shift * 3.2)
        candidates.append((boundary_score, cues[i][0], i))
        
    candidates.sort(reverse=True)
    picked = [0.0]  # YouTube strictly requires chapter 1 to start at 00:00
    
    for _, t, _ in candidates:
        if len(picked) >= target_count:
            break
        if all(abs(t - p) >= min_chapter_duration for p in picked) and (duration - t) >= min_chapter_duration:
            picked.append(t)
            
    picked.sort()
    chapters = []
    
    for idx, t in enumerate(picked):
        end_t = picked[idx + 1] if idx + 1 < len(picked) else duration
        section_text = " ".join(c[2] for c in cues if c[0] >= t and c[1] <= end_t)
        kw = list(extract_keywords(section_text))
        kw.sort(key=lambda w: -section_text.lower().count(w))
        title = " ".join(w.capitalize() for w in kw[:3]) or ("Introduction" if idx == 0 else f"Part {idx + 1}")
        
        chapters.append({
            "order": idx + 1,
            "start_seconds": round(t, 2),
            "end_seconds": round(end_t, 2),
            "timestamp_label": format_timestamp(t),
            "draft_title": title,
            "duration_seconds": round(end_t - t, 2)
        })
        
    is_valid = (
        len(chapters) >= 3 and
        chapters[0]["start_seconds"] == 0.0 and
        all(c["duration_seconds"] >= min_chapter_duration for c in chapters)
    )
    
    description_lines = [f"{c['timestamp_label']} {c['draft_title']}" for c in chapters]
    description_block = "\n".join(description_lines)
    
    return {
        "valid": is_valid,
        "chapter_count": len(chapters),
        "chapters": chapters,
        "description_block": description_block,
        "rule_checks": {
            "starts_at_zero": chapters[0]["start_seconds"] == 0.0,
            "at_least_three_chapters": len(chapters) >= 3,
            "all_above_min_duration": all(c["duration_seconds"] >= min_chapter_duration for c in chapters)
        }
    }
