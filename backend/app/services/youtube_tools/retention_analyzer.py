"""Retention Analyzer Engine - Ported & enhanced from youtube-agent-skill.
Parses YouTube Studio audience retention CSV exports and correlates drops with transcript cues.
Diagnoses 3 distinct retention failure modes:
1. HOOK LEAK: Viewers lost within the first 30 seconds (<25% is healthy).
2. CLIFFS: Single steep drops (>0.8% loss) mapped directly to what was said at that exact timestamp.
3. SLIDE: Steady bleed rate across the flat middle section (pacing issue, not content flaw).
"""
import csv
import io
import os
from typing import Dict, List, Optional, Tuple, Any
from backend.app.services.youtube_tools.deadair_detector import load_cues_from_string, load_cues_from_file

def parse_retention_csv_content(content: str) -> List[Tuple[float, float]]:
    rows = []
    reader = csv.reader(io.StringIO(content))
    for r in reader:
        nums = []
        for cell in r:
            cleaned = cell.strip().replace("%", "").replace(",", "")
            try:
                nums.append(float(cleaned))
            except ValueError:
                nums.append(None)
        valid = [n for n in nums if n is not None]
        if len(valid) >= 2:
            rows.append((valid[0], valid[1]))
    return rows

def analyze_retention(
    csv_content: str,
    transcript_cues: Optional[List[Tuple[float, float, str]]] = None,
    video_duration_seconds: Optional[float] = None,
    axis_type: str = "auto"
) -> Dict[str, Any]:
    rows = parse_retention_csv_content(csv_content)
    if len(rows) < 8:
        return {
            "valid": False,
            "error": "Could not extract at least 8 data points from retention CSV.",
            "data_points": len(rows)
        }
        
    xs = [r[0] for r in rows]
    ys = [r[1] for r in rows]
    
    first_line = csv_content.splitlines()[0].lower() if csv_content.splitlines() else ""
    if axis_type == "seconds":
        pct_axis = False
    elif axis_type == "percent":
        pct_axis = True
    else:
        if "second" in first_line or "time" in first_line:
            pct_axis = False
        elif "percent" in first_line or "%" in first_line:
            pct_axis = True
        elif video_duration_seconds and max(xs) <= video_duration_seconds:
            # If values match video duration in seconds (e.g. 0 to 50s)
            pct_axis = False
        else:
            pct_axis = max(xs) <= 100.5
            
    dur = video_duration_seconds
    
    def to_seconds(x_val: float) -> Optional[float]:
        if pct_axis and dur:
            return round((x_val / 100.0) * dur, 1)
        elif not pct_axis:
            return round(x_val, 1)
        return None

    start_retention = ys[0] if ys else 100.0
    cutoff = 30.0 if not pct_axis else (30.0 / dur * 100.0 if dur else 10.0)
    hook_points = [y for x, y in rows if x <= cutoff]
    hook_end = min(hook_points) if hook_points else start_retention
    hook_leak = max(0.0, start_retention - hook_end)
    
    drops = []
    for i in range(1, len(rows)):
        delta = ys[i - 1] - ys[i]
        span = xs[i] - xs[i - 1] or 1.0
        drops.append((delta / span, xs[i - 1], xs[i], delta))
        
    drops.sort(reverse=True)
    
    cliffs = []
    for _, x0, x1, d in drops[:5]:
        if d > 0.8:
            sec_at = to_seconds(x0)
            phrase = ""
            if transcript_cues and sec_at is not None:
                near_cues = [
                    c[2] for c in transcript_cues
                    if c[0] <= (sec_at + 4.0) and c[1] >= (sec_at - 4.0)
                ]
                phrase = " ".join(near_cues)[:160]
                
            cliffs.append({
                "from_point": round(x0, 2),
                "to_point": round(x1, 2),
                "lost_percent": round(d, 2),
                "timestamp_seconds": sec_at,
                "spoken_phrase_at_cliff": phrase
            })
            
    mid_drops = [d for _, x0, _, d in drops if x0 > cutoff]
    slide = sum(mid_drops) / len(mid_drops) if mid_drops else 0.0
    
    hook_health = "healthy" if hook_leak < 25.0 else "leaking" if hook_leak < 40.0 else "severe"
    
    actionable_prescriptions = []
    if hook_health != "healthy":
        actionable_prescriptions.append(
            f"Hook Leak ({hook_leak:.1f}%): Opening is leaking before 30s. "
            "Eliminate preamble, greetings, or intro animations. Deliver the title promise in line 1."
        )
    if cliffs:
        actionable_prescriptions.append(
            f"Cliff Alert ({len(cliffs)} sharp drop-offs): Audience left at specific phrases. "
            "Review flagged timestamps in the script for boring tangents or broken expectations."
        )
    if slide > 0.15:
        actionable_prescriptions.append(
            f"Slide Velocity ({slide:.3f}%/unit): Pacing is bleeding across the middle. "
            "Do not rewrite the topic—tighten the edit, cut dead air pauses, and accelerate B-roll cuts."
        )
        
    return {
        "valid": True,
        "data_points": len(rows),
        "initial_retention": round(start_retention, 1),
        "final_retention": round(ys[-1], 1),
        "hook_leak": {
            "percent_lost": round(hook_leak, 2),
            "status": hook_health,
            "benchmark": "Under 25% lost in first 30 seconds is healthy for short/mid-form."
        },
        "cliffs": cliffs,
        "slide_per_unit": round(slide, 3),
        "actionable_prescriptions": actionable_prescriptions
    }
