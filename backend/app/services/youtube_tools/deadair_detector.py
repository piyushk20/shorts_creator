"""Dead Air & Speech Tightener Engine - Ported & enhanced from youtube-agent-skill.
Parses transcripts (SRT, VTT, Whisper JSON, or in-memory cues) into an Edit Decision List (EDL).
Detects:
- DEAD: gaps between spoken phrases exceeding threshold (default 0.45s)
- FILLER: cues containing purely hesitation sounds ("um", "uh", "basically", "so yeah")
- REPEAT: false starts and restart sentences (skipping over intervening hesitation tokens)
"""
import json
import os
import re
from typing import Dict, List, Optional, Tuple, Any

FILLER_ONLY = re.compile(
    r"^[\s,.-]*((um+|uh+|er+|ah+|so|okay|ok|right|yeah|like|anyway|basically|"
    r"actually|you know|i mean|let me see|hold on)[\s,.-]*)+$",
    re.I
)

def parse_timestamp(ts: str) -> float:
    ts = ts.strip().replace(",", ".")
    parts = ts.split(":")
    if len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    return int(parts[0]) * 60 + float(parts[1])

def load_cues_from_string(content: str, format_type: str = "srt") -> List[Tuple[float, float, str]]:
    if format_type == "json" or content.strip().startswith("{") or content.strip().startswith("["):
        try:
            data = json.loads(content)
            segs = data.get("segments", data if isinstance(data, list) else [])
            return [(float(s["start"]), float(s["end"]), (s.get("text") or "").strip()) for s in segs]
        except Exception:
            pass
            
    cues = []
    cur = None
    for line in content.splitlines():
        m = re.match(r"\s*(\d[\d:.,]+)\s*-->\s*(\d[\d:.,]+)", line)
        if m:
            cur = [parse_timestamp(m.group(1)), parse_timestamp(m.group(2)), []]
            cues.append(cur)
        elif cur is not None and line.strip() and not line.strip().isdigit():
            cur[2].append(line.strip())
            
    return [(a, b, " ".join(t)) for a, b, t in cues if t]

def load_cues_from_file(file_path: str) -> List[Tuple[float, float, str]]:
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Transcript file not found: {file_path}")
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        raw = f.read()
    fmt = "json" if file_path.endswith(".json") else "srt"
    return load_cues_from_string(raw, fmt)

def normalize_text(text: str) -> List[str]:
    return re.sub(r"[^a-z ]", "", text.lower()).split()

def generate_edl(
    cues: List[Tuple[float, float, str]],
    dead_floor: float = 0.45,
    source_name: str = "transcript"
) -> Dict[str, Any]:
    if not cues:
        return {
            "source": source_name,
            "duration": 0.0,
            "cuts": [],
            "removed_seconds": 0.0,
            "out_seconds": 0.0,
            "percent_shortened": 0.0
        }
        
    total_duration = cues[-1][1]
    cuts = []
    
    for i, (start_t, end_t, text) in enumerate(cues):
        # 1. Pure filler cues
        if FILLER_ONLY.match(text):
            cuts.append({
                "kind": "FILLER",
                "start": round(start_t, 3),
                "end": round(end_t, 3),
                "duration": round(end_t - start_t, 3),
                "reason": f'Filler cue: "{text.strip()[:48]}"'
            })
            
        # 2. Dead air gaps
        if i > 0:
            prev_end = cues[i - 1][1]
            gap = start_t - prev_end
            if gap > dead_floor:
                keep_padding = dead_floor / 2.0
                cut_start = round(prev_end + keep_padding, 3)
                cut_end = round(start_t - keep_padding, 3)
                if cut_end > cut_start:
                    cuts.append({
                        "kind": "DEAD",
                        "start": cut_start,
                        "end": cut_end,
                        "duration": round(cut_end - cut_start, 3),
                        "reason": f"Dead air pause of {gap:.2f}s"
                    })
                    
        # 3. Sentence restarts (comparing against last cue that was actual speech)
        if text.strip() and not FILLER_ONLY.match(text):
            j = i - 1
            while j >= 0 and (FILLER_ONLY.match(cues[j][2]) or not cues[j][2].strip()):
                j -= 1
            if j >= 0:
                prev_tokens = normalize_text(cues[j][2])[:5]
                cur_tokens = normalize_text(text)[:5]
                if len(prev_tokens) >= 3 and prev_tokens == cur_tokens:
                    cuts.append({
                        "kind": "REPEAT",
                        "start": round(cues[j][0], 3),
                        "end": round(cues[j][1], 3),
                        "duration": round(cues[j][1] - cues[j][0], 3),
                        "reason": f'Restarted take: "{" ".join(prev_tokens)}"'
                    })
                    
    # Filter and sort cuts chronologically
    cuts = [c for c in cuts if c["end"] > c["start"]]
    cuts.sort(key=lambda c: c["start"])
    
    # Merge overlapping cuts if any
    merged_cuts = []
    for c in cuts:
        if not merged_cuts:
            merged_cuts.append(c)
        else:
            prev = merged_cuts[-1]
            if c["start"] <= prev["end"]:
                prev["end"] = max(prev["end"], c["end"])
                prev["duration"] = round(prev["end"] - prev["start"], 3)
                prev["reason"] += f" + {c['reason']}"
            else:
                merged_cuts.append(c)
                
    removed = sum(c["duration"] for c in merged_cuts)
    out_duration = max(0.0, total_duration - removed)
    pct = (removed / total_duration * 100.0) if total_duration > 0 else 0.0
    
    return {
        "source": source_name,
        "input_duration": round(total_duration, 2),
        "cuts_count": len(merged_cuts),
        "cuts": merged_cuts,
        "removed_seconds": round(removed, 2),
        "out_seconds": round(out_duration, 2),
        "percent_shortened": round(pct, 1)
    }
