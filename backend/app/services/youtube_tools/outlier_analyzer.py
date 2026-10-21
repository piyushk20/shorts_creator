"""Relative Outlier & Swipe Analyzer - Ported & enhanced from youtube-agent-skill.
Ranks niche videos by how far each beat its OWN channel's median view count.
Strikes out vanity view metrics that favor channel size over content quality.
Classifies outlier video titles according to the 21 proven hook formulas.
"""
import os
import re
import statistics
from typing import Dict, List, Optional, Tuple, Any
from backend.app.services.youtube_tools.hook_scorer import classify_formula

def analyze_relative_outliers(
    videos: List[Dict[str, Any]],
    min_multiplier: float = 1.8,
    min_videos_per_channel: int = 4
) -> Dict[str, Any]:
    channels_map: Dict[str, List[Dict[str, Any]]] = {}
    for v in videos:
        ch = v.get("channel") or v.get("channel_title") or "Unknown"
        channels_map.setdefault(ch, []).append(v)
        
    outliers = []
    skipped_thin_channels = []
    
    for ch, vids in channels_map.items():
        if len(vids) < min_videos_per_channel:
            skipped_thin_channels.append({
                "channel": ch,
                "video_count": len(vids),
                "reason": f"Needs at least {min_videos_per_channel} videos to establish a statistically valid median."
            })
            continue
            
        views_list = [float(v.get("views", 0) or v.get("view_count", 0) or 0) for v in vids]
        med = statistics.median(views_list) if views_list else 0.0
        
        for v in vids:
            v_views = float(v.get("views", 0) or v.get("view_count", 0) or 0)
            mult = (v_views / med) if med > 0 else 0.0
            
            title = v.get("title", "")
            formula_name, formula_hits = classify_formula(title)
            
            if mult >= min_multiplier:
                outliers.append({
                    "channel": ch,
                    "title": title,
                    "views": int(v_views),
                    "channel_median": int(med),
                    "multiple": round(mult, 2),
                    "formula": formula_name,
                    "formula_hits": formula_hits,
                    "url": v.get("url", ""),
                    "published_at": v.get("published_at", "")
                })
                
    outliers.sort(key=lambda x: -x["multiple"])
    
    formula_counts: Dict[str, int] = {}
    for o in outliers:
        formula_counts[o["formula"]] = formula_counts.get(o["formula"], 0) + 1
        
    return {
        "total_videos_analyzed": len(videos),
        "total_channels": len(channels_map),
        "threshold_multiplier": min_multiplier,
        "outlier_count": len(outliers),
        "outliers": outliers,
        "formula_distribution": dict(sorted(formula_counts.items(), key=lambda item: -item[1])),
        "skipped_thin_channels": skipped_thin_channels
    }
