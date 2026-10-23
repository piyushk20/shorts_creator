"""
CreatorFlow AI Studio - AI Shorts Clips API Router
Provides comprehensive scanning, indexing, categorization, and streaming
for all video clips created by the AI Shorts generator:
- Individual scene segment clips (scaled/cropped/timed to scene narration)
- Final rendered AI shorts (with voiceover, subtitles, music)
- Stock and public media B-roll clips cached for scenes
- Intermediate video composition beds
"""

import os
import re
import math
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.core.security import sanitize_safe_id
from backend.app.models.project import Project, Scene, RenderJob

router = APIRouter(prefix="/api/clips", tags=["Clips"])


def format_bytes(bytes_val: int) -> str:
    if bytes_val < 1024:
        return f"{bytes_val} B"
    elif bytes_val < 1024 * 1024:
        return f"{bytes_val / 1024:.1f} KB"
    elif bytes_val < 1024 * 1024 * 1024:
        return f"{bytes_val / (1024 * 1024):.1f} MB"
    else:
        return f"{bytes_val / (1024 * 1024 * 1024):.2f} GB"


def format_duration(seconds: Optional[float]) -> str:
    if not seconds or math.isnan(seconds) or seconds <= 0:
        return "0:00"
    m = int(seconds // 60)
    s = int(seconds % 60)
    return f"{m}:{s:02d}"


@router.get("")
def list_clips(
    clip_type: Optional[str] = Query("all", description="Filter by type: 'all', 'scene_segment', 'final_short', 'stock_broll', 'video_bed'"),
    project_id: Optional[str] = Query(None, description="Filter by project ID"),
    aspect_ratio: Optional[str] = Query("all", description="Filter by aspect ratio: 'all', '9:16', '16:9', '1:1'"),
    search: Optional[str] = Query(None, description="Search keyword in title, narration, filename, tags"),
    sort_by: Optional[str] = Query("newest", description="'newest', 'duration_desc', 'size_desc', 'scene_order', 'title'"),
    db: Session = Depends(get_db)
):
    """
    Returns indexed list and metrics of all clips created and cached by the AI shorts generator.
    """
    storage_dir = os.path.abspath(settings.STORAGE_DIR)
    if not os.path.exists(storage_dir):
        return {
            "total_clips": 0,
            "clips": [],
            "stats": {
                "total_clips": 0,
                "scene_segments_count": 0,
                "final_shorts_count": 0,
                "stock_broll_count": 0,
                "video_bed_count": 0,
                "total_storage_bytes": 0,
                "total_storage_formatted": "0 MB",
                "projects_count": 0
            }
        }

    # Fetch DB data for fast lookup
    all_projects = {p.id: p for p in db.query(Project).all()}
    scenes_by_proj: Dict[str, List[Scene]] = {}
    for s in db.query(Scene).order_by(Scene.order.asc()).all():
        scenes_by_proj.setdefault(s.project_id, []).append(s)

    all_jobs_by_proj: Dict[str, List[RenderJob]] = {}
    for j in db.query(RenderJob).all():
        all_jobs_by_proj.setdefault(j.project_id, []).append(j)

    collected_clips: List[Dict[str, Any]] = []
    seen_paths = set()

    seen_final_short_projects = set()

    # Walk storage directory
    for root, dirs, files in os.walk(storage_dir):
        for f in sorted(files):
            if not f.lower().endswith((".mp4", ".webm", ".mov")):
                continue

            full_path = os.path.join(root, f)
            norm_full = os.path.abspath(full_path)
            if norm_full in seen_paths:
                continue
            seen_paths.add(norm_full)

            rel_path = os.path.relpath(full_path, storage_dir).replace(os.sep, "/")
            parts = rel_path.split("/")

            # Ignore temporary uncompressed export directories and intermediate composition files
            if "export_package" in parts:
                continue
            if f.endswith(("_video_only.mp4", "_voiceover.aac", "_mixed_audio.aac", "_looped_bgm.aac")):
                continue
            if f.startswith(("scene_comp_", "pipeline_video", "raw_broll_concat", "test_seg", "test-")):
                continue

            try:
                sz = os.path.getsize(full_path)
                mtime = os.path.getmtime(full_path)
                created_iso = datetime.fromtimestamp(mtime).isoformat()
            except OSError:
                continue

            # Determine Associated Project
            proj_id = None
            if "projects" in parts:
                p_idx = parts.index("projects")
                if len(parts) > p_idx + 1:
                    proj_id = parts[p_idx + 1]

            proj = all_projects.get(proj_id) if proj_id else None
            proj_title = proj.title.split("\n")[0].strip() if proj else None

            # Determine clip type, scene order, and role
            c_type = "stock_broll"
            type_label = "Stock & B-Roll"
            scene_order = None
            scene_role = None
            narration = None
            visual_desc = None
            clip_title = f
            duration_sec = 0.0
            clip_aspect_ratio = proj.aspect_ratio if proj else "9:16"
            clip_res = f"{proj.width}x{proj.height}" if proj and proj.width and proj.height else "1080x1920"

            # Parse resolution from filename if embedded
            res_match = re.search(r"(\d{3,4})x(\d{3,4})", f)
            if res_match:
                w, h = int(res_match.group(1)), int(res_match.group(2))
                clip_res = f"{w}x{h}"
                clip_aspect_ratio = "9:16" if h > w else ("16:9" if w > h else "1:1")

            # Match Final Rendered Shorts (single successful clip per project)
            if "output" in parts or f.endswith("_final.mp4") or f == "final_video.mp4":
                # Ensure only ONE final successful clip per project is indexed
                if proj_id and proj_id in seen_final_short_projects:
                    continue
                if proj_id:
                    seen_final_short_projects.add(proj_id)

                c_type = "final_short"
                type_label = "Rendered AI Short"
                clean_name = f.replace("_", " ").replace(".mp4", "")
                if proj_title:
                    clip_title = f"{proj_title} (Full Short)"
                else:
                    clip_title = f"{clean_name} (AI Short)"
                duration_sec = float(proj.target_duration) if proj and proj.target_duration else 30.0

            # Match Scene Segment Clips (individual scene cuts timed for short)
            elif "segment_" in f or "visuals" in parts:
                c_type = "scene_segment"
                type_label = "Scene Visual Clip" if "visuals" in parts else "Scene Segment"
                sm = re.search(r"(?:segment_|scene_)(\d+)", f)
                if sm:
                    idx = int(sm.group(1))
                    # Check if 0-indexed or 1-indexed
                    if "segment_" in f:
                        scene_order = idx + 1
                    else:
                        scene_order = idx
                    scene_idx = scene_order - 1
                    p_scenes = scenes_by_proj.get(proj_id, [])
                    if 0 <= scene_idx < len(p_scenes):
                        sc = p_scenes[scene_idx]
                        scene_role = sc.role or "main"
                        narration = sc.narration
                        visual_desc = sc.visual_description
                        duration_sec = sc.actual_duration or sc.estimated_duration or 5.0
                    clip_title = f"Scene {scene_order}: {scene_role.upper() if scene_role else 'CUT'} Clip"
                else:
                    clip_title = f"Scene Segment ({clip_res})"

            # Stock & B-roll Assets
            elif "stock_library" in parts or "stock" in f or "broll" in f:
                c_type = "stock_broll"
                type_label = "Stock B-Roll Asset"
                clean_name = f.replace("_", " ").replace(".mp4", "")
                if clean_name.startswith("broll"):
                    clip_title = clean_name.replace("broll", "B-Roll:").title()
                else:
                    clip_title = f"B-Roll Asset: {clean_name[:24]}"
                duration_sec = 6.0  # standard stock loop duration

            else:
                continue

            # Fallback duration estimation if not set
            if not duration_sec or duration_sec <= 0:
                duration_sec = max(2.0, min(120.0, sz / (350 * 1024)))

            # Tags for filtering and UI pills
            tags = [clip_aspect_ratio]
            if scene_role:
                tags.append(scene_role.capitalize())
            if c_type == "scene_segment":
                tags.append("Scene Cut")
            elif c_type == "final_short":
                tags.append("Full Short")
            elif c_type == "stock_broll":
                tags.append("B-Roll Asset")

            if proj_title:
                tags.append(proj_title[:20])

            unique_id = f"clip-{abs(hash(rel_path)) % 100000000:08d}"

            collected_clips.append({
                "id": unique_id,
                "filename": f,
                "title": clip_title,
                "clip_type": c_type,
                "clip_type_label": type_label,
                "project_id": proj_id,
                "project_title": proj_title,
                "scene_order": scene_order,
                "scene_role": scene_role,
                "narration": narration,
                "visual_description": visual_desc,
                "aspect_ratio": clip_aspect_ratio,
                "resolution": clip_res,
                "duration_seconds": round(duration_sec, 1),
                "duration_formatted": format_duration(duration_sec),
                "file_size_bytes": sz,
                "file_size_formatted": format_bytes(sz),
                "created_at": created_iso,
                "relative_path": rel_path,
                "stream_url": f"/storage/{rel_path}",
                "download_url": f"/storage/{rel_path}",
                "tags": tags
            })

    # Global Stats across all clips
    total_clips = len(collected_clips)
    scene_segments_count = sum(1 for c in collected_clips if c["clip_type"] == "scene_segment")
    final_shorts_count = sum(1 for c in collected_clips if c["clip_type"] == "final_short")
    stock_broll_count = sum(1 for c in collected_clips if c["clip_type"] == "stock_broll")
    video_bed_count = sum(1 for c in collected_clips if c["clip_type"] == "video_bed")
    total_bytes = sum(c["file_size_bytes"] for c in collected_clips)
    distinct_projects = len(set(c["project_id"] for c in collected_clips if c["project_id"]))

    stats = {
        "total_clips": total_clips,
        "scene_segments_count": scene_segments_count,
        "final_shorts_count": final_shorts_count,
        "stock_broll_count": stock_broll_count,
        "video_bed_count": video_bed_count,
        "total_storage_bytes": total_bytes,
        "total_storage_formatted": format_bytes(total_bytes),
        "projects_count": distinct_projects
    }

    # Apply Filters
    filtered = collected_clips

    if clip_type and clip_type != "all":
        filtered = [c for c in filtered if c["clip_type"] == clip_type]

    if project_id and project_id != "all":
        filtered = [c for c in filtered if c["project_id"] == project_id]

    if aspect_ratio and aspect_ratio != "all":
        filtered = [c for c in filtered if c["aspect_ratio"] == aspect_ratio]

    if search and search.strip():
        q = search.strip().lower()
        filtered = [
            c for c in filtered
            if q in c["title"].lower()
            or q in c["filename"].lower()
            or (c["project_title"] and q in c["project_title"].lower())
            or (c["narration"] and q in c["narration"].lower())
            or (c["scene_role"] and q in c["scene_role"].lower())
            or any(q in t.lower() for t in c["tags"])
        ]

    # Sorting
    if sort_by == "newest":
        filtered.sort(key=lambda x: x["created_at"], reverse=True)
    elif sort_by == "duration_desc":
        filtered.sort(key=lambda x: x["duration_seconds"], reverse=True)
    elif sort_by == "duration_asc":
        filtered.sort(key=lambda x: x["duration_seconds"])
    elif sort_by == "size_desc":
        filtered.sort(key=lambda x: x["file_size_bytes"], reverse=True)
    elif sort_by == "scene_order":
        filtered.sort(key=lambda x: (x["scene_order"] or 999, x["title"]))
    elif sort_by == "title":
        filtered.sort(key=lambda x: x["title"].lower())
    else:
        filtered.sort(key=lambda x: x["created_at"], reverse=True)

    return {
        "total_clips": total_clips,
        "count": len(filtered),
        "stats": stats,
        "clips": filtered
    }


class OpenFolderRequest(BaseModel):
    relative_path: Optional[str] = None


@router.post("/open-folder")
def open_clips_folder(payload: Optional[OpenFolderRequest] = None):
    """
    Opens the storage directory or clip folder directly in Windows Explorer.
    """
    storage_dir = os.path.abspath(settings.STORAGE_DIR)
    target_dir = storage_dir

    if payload and payload.relative_path:
        safe_rel = payload.relative_path.replace("/", os.sep).strip(os.sep)
        full_candidate = os.path.abspath(os.path.join(storage_dir, safe_rel))
        # Ensure path traversal protection
        if full_candidate.startswith(storage_dir):
            if os.path.isfile(full_candidate):
                target_dir = os.path.dirname(full_candidate)
            elif os.path.isdir(full_candidate):
                target_dir = full_candidate

    if not os.path.exists(target_dir):
        raise HTTPException(status_code=404, detail="Target folder does not exist")

    try:
        os.startfile(target_dir)
        return {"success": True, "path": target_dir}
    except Exception as e:
        return {"success": False, "path": target_dir, "error": str(e)}
