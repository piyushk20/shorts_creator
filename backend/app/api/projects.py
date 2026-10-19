import os
import uuid
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from backend.app.core.database import get_db, SessionLocal
from backend.app.core.config import settings
from backend.app.core.security import sanitize_safe_id
from backend.app.models.project import Project, ScriptRevision, Scene, Asset, AssetProvenance, RenderJob, QAReport
from backend.app.schemas.project import ProjectCreateRequest, ProjectResponse, ProjectDetailResponse
from backend.app.schemas.scene import SceneSchema
from backend.app.schemas.render import RenderStartRequest, RenderJobResponse, AssetCandidate
from backend.app.services.llm_engine import llm_engine
from backend.app.services.broll_engine import broll_engine
from backend.app.services.render_engine import render_engine
from backend.app.services.project_storage import project_storage, sanitize_filename

router = APIRouter(prefix="/api", tags=["Projects"])

def validate_id(identifier: str, field_name: str = "ID") -> str:
    cleaned = sanitize_safe_id(identifier)
    if not cleaned or cleaned != identifier:
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}: illegal characters or path traversal attempt")
    return cleaned

@router.get("/projects", response_model=List[ProjectResponse])
def list_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    results = []
    for p in projects:
        sc_count = db.query(Scene).filter(Scene.project_id == p.id).count()
        p_dict = {
            "id": p.id,
            "title": p.title,
            "topic": p.topic,
            "platform": p.platform,
            "aspect_ratio": p.aspect_ratio,
            "width": p.width,
            "height": p.height,
            "fps": p.fps,
            "target_duration": p.target_duration,
            "language": p.language,
            "voice": p.voice,
            "voice_style": p.voice_style,
            "visual_style": p.visual_style,
            "caption_style": p.caption_style,
            "status": p.status,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
            "scenes_count": sc_count
        }
        results.append(ProjectResponse(**p_dict))
    return results

@router.post("/projects", response_model=ProjectDetailResponse)
async def create_project(req: ProjectCreateRequest, db: Session = Depends(get_db)):
    project_id = str(uuid.uuid4())
    
    # Calculate dimensions from aspect ratio
    width, height = 1080, 1920
    if req.aspect_ratio == "16:9":
        width, height = 1920, 1080
    elif req.aspect_ratio == "1:1":
        width, height = 1080, 1080

    # Auto generate script using LLM Engine
    script_data = await llm_engine.generate_script(
        topic=req.topic or "Modern AI Breakthroughs",
        target_duration=req.target_duration,
        language=req.language,
        platform=req.platform,
        visual_style=req.visual_style
    )

    project_title = req.title or script_data.title

    new_project = Project(
        id=project_id,
        title=project_title,
        topic=req.topic,
        platform=req.platform,
        aspect_ratio=req.aspect_ratio,
        width=width,
        height=height,
        fps=30,
        target_duration=req.target_duration,
        language=req.language,
        voice=req.voice,
        voice_style=req.voice_style,
        visual_style=req.visual_style,
        caption_style=req.caption_style,
        status="SCRIPT_REVIEW"
    )
    db.add(new_project)

    # Save initial script revision
    scenes_dict = [s.model_dump() for s in script_data.scenes]
    rev = ScriptRevision(
        id=str(uuid.uuid4()),
        project_id=project_id,
        revision_number=1,
        hook_options_json=json.dumps(script_data.hook_options),
        recommended_hook=script_data.recommended_hook,
        full_script=script_data.full_script,
        scenes_data_json=json.dumps(scenes_dict),
        is_approved=False
    )
    db.add(rev)

    # Save scenes
    db_scenes = []
    for s in script_data.scenes:
        db_s = Scene(
            id=s.scene_id,
            project_id=project_id,
            order=s.order,
            role=s.role,
            narration=s.narration,
            estimated_duration=s.estimated_duration_seconds,
            visual_description=s.visual_description,
            search_queries_json=json.dumps(s.search_queries),
            on_screen_text=s.on_screen_text,
            caption_style=s.caption_style,
            review_status=s.review_status
        )
        db.add(db_s)
        db_scenes.append(s)

    db.commit()

    # Initialize dedicated project folder where final output videos & deliverables are stored
    project_storage.init_project_folder(
        project_id=new_project.id,
        title=new_project.title,
        metadata={"topic": new_project.topic, "platform": new_project.platform, "duration": new_project.target_duration}
    )

    return ProjectDetailResponse(
        id=new_project.id,
        title=new_project.title,
        topic=new_project.topic,
        platform=new_project.platform,
        aspect_ratio=new_project.aspect_ratio,
        width=new_project.width,
        height=new_project.height,
        fps=new_project.fps,
        target_duration=new_project.target_duration,
        language=new_project.language,
        voice=new_project.voice,
        voice_style=new_project.voice_style,
        visual_style=new_project.visual_style,
        caption_style=new_project.caption_style,
        status=new_project.status,
        created_at=new_project.created_at,
        updated_at=new_project.updated_at,
        scenes_count=len(db_scenes),
        scenes=db_scenes,
        recommended_hook=script_data.recommended_hook,
        hook_options=script_data.hook_options,
        full_script=script_data.full_script,
        is_script_approved=False
    )

@router.get("/projects/{project_id}", response_model=ProjectDetailResponse)
def get_project_details(project_id: str, db: Session = Depends(get_db)):
    project_id = validate_id(project_id, "project_id")
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    rev = db.query(ScriptRevision).filter(ScriptRevision.project_id == project_id).order_by(ScriptRevision.created_at.desc()).first()
    db_scenes = db.query(Scene).filter(Scene.project_id == project_id).order_by(Scene.order.asc()).all()

    scenes = []
    for s in db_scenes:
        scenes.append(SceneSchema(
            scene_id=s.id,
            order=s.order,
            role=s.role,
            narration=s.narration,
            estimated_duration_seconds=s.estimated_duration,
            actual_duration_seconds=s.actual_duration,
            visual_description=s.visual_description or "",
            search_queries=json.loads(s.search_queries_json or "[]"),
            on_screen_text=s.on_screen_text,
            selected_asset_id=s.selected_asset_id,
            caption_style=s.caption_style or "word_highlight",
            caption_tokens=json.loads(s.caption_tokens_json or "[]"),
            review_status=s.review_status or "pending"
        ))

    last_job = db.query(RenderJob).filter(RenderJob.project_id == project_id).order_by(RenderJob.start_time.desc()).first()
    job_resp = None
    if last_job:
        job_resp = RenderJobResponse(
            id=last_job.id,
            project_id=last_job.project_id,
            renderer=last_job.renderer,
            status=last_job.status,
            progress=last_job.progress,
            current_stage=last_job.current_stage,
            output_mp4_path=last_job.output_mp4_path,
            thumbnail_path=last_job.thumbnail_path,
            error_message=last_job.error_message,
            start_time=last_job.start_time,
            end_time=last_job.end_time
        )

    return ProjectDetailResponse(
        id=project.id,
        title=project.title,
        topic=project.topic,
        platform=project.platform,
        aspect_ratio=project.aspect_ratio,
        width=project.width,
        height=project.height,
        fps=project.fps,
        target_duration=project.target_duration,
        language=project.language,
        voice=project.voice,
        voice_style=project.voice_style,
        visual_style=project.visual_style,
        caption_style=project.caption_style,
        status=project.status,
        created_at=project.created_at,
        updated_at=project.updated_at,
        scenes_count=len(scenes),
        scenes=scenes,
        recommended_hook=rev.recommended_hook if rev else None,
        hook_options=json.loads(rev.hook_options_json or "[]") if rev else [],
        full_script=rev.full_script if rev else None,
        is_script_approved=rev.is_approved if rev else False,
        latest_job=job_resp
    )

@router.put("/projects/{project_id}/script")
def update_project_script(project_id: str, data: Dict[str, Any], db: Session = Depends(get_db)):
    project_id = validate_id(project_id, "project_id")
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    scenes_input = data.get("scenes", [])
    is_approved = data.get("is_approved", True)

    # Delete existing scenes and recreate
    db.query(Scene).filter(Scene.project_id == project_id).delete()

    for idx, s in enumerate(scenes_input):
        new_s = Scene(
            id=s.get("scene_id") or str(uuid.uuid4()),
            project_id=project_id,
            order=idx + 1,
            role=s.get("role", "main"),
            narration=s.get("narration", ""),
            estimated_duration=float(s.get("estimated_duration_seconds", 5.0)),
            visual_description=s.get("visual_description", ""),
            search_queries_json=json.dumps(s.get("search_queries", [])),
            on_screen_text=s.get("on_screen_text"),
            selected_asset_id=s.get("selected_asset_id"),
            caption_style=s.get("caption_style", "word_highlight"),
            review_status="approved" if is_approved else "pending"
        )
        db.add(new_s)

    # Save new revision
    rev = ScriptRevision(
        id=str(uuid.uuid4()),
        project_id=project_id,
        recommended_hook=data.get("recommended_hook"),
        full_script=" ".join([s.get("narration", "") for s in scenes_input]),
        scenes_data_json=json.dumps(scenes_input),
        is_approved=is_approved
    )
    db.add(rev)

    if is_approved:
        project.status = "APPROVED"

    db.commit()
    return {"message": "Script updated successfully", "is_approved": is_approved}

@router.get("/projects/{project_id}/broll/{scene_id}", response_model=List[AssetCandidate])
async def get_broll_candidates(
    project_id: str, 
    scene_id: str, 
    query: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    project_id = validate_id(project_id, "project_id")
    scene_id = validate_id(scene_id, "scene_id")
    scene = db.query(Scene).filter(Scene.id == scene_id, Scene.project_id == project_id).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    project = db.query(Project).filter(Project.id == project_id).first()
    if query and query.strip():
        queries = [query.strip()]
    else:
        queries = json.loads(scene.search_queries_json or "[]")
        if not queries and scene.visual_description:
            queries = [scene.visual_description]

    candidates = await broll_engine.search_candidates(
        scene_id=scene_id,
        queries=queries,
        script_context=scene.narration or "",
        aspect_ratio=project.aspect_ratio,
        min_duration=scene.estimated_duration,
        limit=10
    )
    return candidates

@router.put("/projects/{project_id}/scenes/{scene_id}/asset")
def select_scene_asset(project_id: str, scene_id: str, data: Dict[str, Any], db: Session = Depends(get_db)):
    project_id = validate_id(project_id, "project_id")
    scene_id = validate_id(scene_id, "scene_id")

    scene = db.query(Scene).filter(Scene.id == scene_id, Scene.project_id == project_id).first()
    if not scene:
        raise HTTPException(status_code=404, detail="Scene not found")

    asset_id = data.get("asset_id")
    download_url = data.get("download_url")

    scene.selected_asset_id = asset_id
    db.commit()

    # Pre-cache asset on demand
    cached_path = ""
    if download_url and download_url.startswith(("http://", "https://")):
        from backend.app.core.security import is_safe_url
        if not is_safe_url(download_url):
            raise HTTPException(status_code=400, detail="Invalid or unsafe download URL (SSRF protection)")
        cached_path = broll_engine.download_asset_on_demand(download_url)

    return {
        "scene_id": scene_id,
        "selected_asset_id": asset_id,
        "is_cached": bool(cached_path and os.path.exists(cached_path))
    }

@router.get("/audio/bgm")
def list_bgm_tracks():
    from backend.app.services.audio_engine import audio_engine
    return audio_engine.list_bgm_tracks()

@router.get("/audio/voice-styles")
def list_voice_styles():
    from backend.app.services.audio_engine import audio_engine
    return audio_engine.list_voice_styles()

@router.post("/projects/{project_id}/render", response_model=RenderJobResponse)
def start_render_job(req: RenderStartRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    validate_id(req.project_id, "project_id")
    project = db.query(Project).filter(Project.id == req.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    db_scenes = db.query(Scene).filter(Scene.project_id == req.project_id).order_by(Scene.order.asc()).all()
    if not db_scenes:
        raise HTTPException(status_code=400, detail="Cannot render a project with no scenes")

    job_id = f"job-{uuid.uuid4().hex[:8]}"

    # Update project voice and voice style if provided in request
    chosen_voice = req.voice or project.voice or "en-US-ChristopherNeural"
    chosen_voice_style = req.voice_style or project.voice_style or "energetic"
    project.voice = chosen_voice
    project.voice_style = chosen_voice_style

    new_job = RenderJob(
        id=job_id,
        project_id=project.id,
        renderer=req.renderer,
        status="IN_PROGRESS",
        progress=5,
        current_stage="INITIALIZING",
        start_time=datetime.now(timezone.utc)
    )
    db.add(new_job)
    project.status = "RENDERING"
    db.commit()

    # Prepare scene schemas
    scenes = []
    for s in db_scenes:
        scenes.append(SceneSchema(
            scene_id=s.id,
            order=s.order,
            role=s.role,
            narration=s.narration,
            estimated_duration_seconds=s.estimated_duration,
            actual_duration_seconds=s.actual_duration,
            visual_description=s.visual_description or "",
            search_queries=json.loads(s.search_queries_json or "[]"),
            on_screen_text=s.on_screen_text,
            selected_asset_id=s.selected_asset_id,
            caption_style=s.caption_style or "word_highlight"
        ))

    def on_complete(job_data: Dict[str, Any]):
        db_inner = SessionLocal()
        try:
            j = db_inner.query(RenderJob).filter(RenderJob.id == job_id).first()
            p = db_inner.query(Project).filter(Project.id == req.project_id).first()
            if j:
                j.status = job_data.get("status", "COMPLETED")
                j.progress = job_data.get("progress", 100)
                j.current_stage = job_data.get("current_stage", "READY_FOR_REVIEW")
                j.output_mp4_path = job_data.get("output_mp4_path")
                j.thumbnail_path = job_data.get("thumbnail_path")
                j.error_message = job_data.get("error_message")
                j.end_time = datetime.now(timezone.utc)
            if p:
                p.status = "READY_FOR_REVIEW" if job_data.get("status") == "COMPLETED" else "FAILED"
            db_inner.commit()
        finally:
            db_inner.close()

    # Launch render background task with sanitized BGM, Voice Style and Bottom Safe Zone parameters
    safe_bgm = os.path.basename(req.bgm_track) if req.bgm_track else None
    safe_caption_pos = req.caption_position if req.caption_position in ["bottom", "top", "center"] else "bottom"

    background_tasks.add_task(
        render_engine.execute_render_job,
        job_id=job_id,
        project_id=project.id,
        project_title=project.title,
        scenes=scenes,
        aspect_ratio=project.aspect_ratio,
        width=project.width,
        height=project.height,
        fps=project.fps,
        voice=chosen_voice,
        voice_style=chosen_voice_style,
        add_music=req.add_background_music,
        bgm_track=safe_bgm,
        burn_subtitles=req.burn_subtitles,
        caption_position=safe_caption_pos,
        db_callback=on_complete
    )

    return RenderJobResponse(
        id=new_job.id,
        project_id=new_job.project_id,
        renderer=new_job.renderer,
        status=new_job.status,
        progress=new_job.progress,
        current_stage=new_job.current_stage,
        output_mp4_path=new_job.output_mp4_path,
        thumbnail_path=new_job.thumbnail_path,
        error_message=new_job.error_message,
        start_time=new_job.start_time,
        end_time=new_job.end_time
    )

@router.get("/jobs/{job_id}")
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    job_id = validate_id(job_id, "job_id")
    # Check live memory state first
    live_status = render_engine.get_job_status(job_id)
    if live_status:
        return live_status

    job = db.query(RenderJob).filter(RenderJob.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return {
        "id": job.id,
        "project_id": job.project_id,
        "renderer": job.renderer,
        "status": job.status,
        "progress": job.progress,
        "current_stage": job.current_stage,
        "output_mp4_path": job.output_mp4_path,
        "thumbnail_path": job.thumbnail_path,
        "error_message": job.error_message,
        "start_time": job.start_time,
        "end_time": job.end_time
    }

@router.get("/settings")
def get_studio_settings():
    return {
        "app_name": settings.APP_NAME,
        "llm_provider": settings.LLM_PROVIDER,
        "has_openai": bool(settings.OPENAI_API_KEY),
        "has_gemini": bool(settings.GEMINI_API_KEY),
        "has_pexels": bool(settings.PEXELS_API_KEY),
        "has_pixabay": bool(settings.PIXABAY_API_KEY),
        "tts_provider": settings.TTS_PROVIDER,
        "default_voice_en": settings.DEFAULT_VOICE_EN,
        "default_voice_hi": settings.DEFAULT_VOICE_HI,
        "renderer_backend": settings.RENDERER_BACKEND
    }

# ============================================================================
# PROJECT OUTPUT FOLDER & DELIVERABLES DOWNLOAD APIS
# ============================================================================

@router.get("/projects/{project_id}/output")
def get_project_output_info(project_id: str, db: Session = Depends(get_db)):
    """
    Returns files and status from the project's dedicated output folder.
    """
    project_id = validate_id(project_id, "project_id")
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    summary = project_storage.get_output_summary(project_id, project.title)
    return summary

@router.get("/projects/{project_id}/download/video")
def download_final_video(project_id: str, db: Session = Depends(get_db)):
    """
    Directly downloads the rendered final video MP4 with a clean, project-titled filename.
    """
    project_id = validate_id(project_id, "project_id")
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    safe_title = sanitize_filename(project.title)
    output_dir = project_storage.get_output_dir(project_id)

    # 1. Check canonical output/final_video.mp4 or named copy
    candidates = [
        os.path.join(output_dir, "final_video.mp4"),
        os.path.join(output_dir, f"{safe_title}.mp4")
    ]
    for c in candidates:
        if os.path.exists(c):
            return FileResponse(
                path=c,
                filename=f"{safe_title}.mp4",
                media_type="video/mp4"
            )

    # 2. Check latest render job
    last_job = db.query(RenderJob).filter(RenderJob.project_id == project_id).order_by(RenderJob.start_time.desc()).first()
    if last_job and last_job.output_mp4_path and os.path.exists(last_job.output_mp4_path):
        return FileResponse(
            path=last_job.output_mp4_path,
            filename=f"{safe_title}.mp4",
            media_type="video/mp4"
        )

    # 3. Check renders folder
    renders_dir = os.path.join(settings.STORAGE_DIR, "projects", project_id, "renders")
    if os.path.exists(renders_dir):
        for f in os.listdir(renders_dir):
            if f.endswith("_final.mp4"):
                p = os.path.join(renders_dir, f)
                return FileResponse(
                    path=p,
                    filename=f"{safe_title}.mp4",
                    media_type="video/mp4"
                )

    raise HTTPException(status_code=404, detail="Final output video has not been rendered yet")

@router.get("/projects/{project_id}/download/zip")
def download_export_zip(project_id: str, db: Session = Depends(get_db)):
    """
    Directly downloads the complete project package (video, thumbnail, subtitles, manifest).
    """
    project_id = validate_id(project_id, "project_id")
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    safe_title = sanitize_filename(project.title)
    output_dir = project_storage.get_output_dir(project_id)
    project_dir = project_storage.get_project_dir(project_id)

    candidates = [
        os.path.join(output_dir, f"{safe_title}_export.zip"),
        os.path.join(output_dir, "export_package.zip"),
        os.path.join(project_dir, f"{safe_title}_export.zip"),
        os.path.join(project_dir, f"{project.title.replace(' ', '_')}_export.zip")
    ]
    for c in candidates:
        if os.path.exists(c):
            return FileResponse(
                path=c,
                filename=f"{safe_title}_export.zip",
                media_type="application/zip"
            )

    raise HTTPException(status_code=404, detail="Export package ZIP has not been generated yet")

@router.get("/projects/{project_id}/download/subtitles/{fmt}")
def download_subtitles(project_id: str, fmt: str, db: Session = Depends(get_db)):
    """
    Directly downloads subtitle files (SRT or VTT).
    """
    project_id = validate_id(project_id, "project_id")
    fmt = fmt.lower()
    if fmt not in ["srt", "vtt"]:
        raise HTTPException(status_code=400, detail="Only 'srt' and 'vtt' formats are supported")

    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    safe_title = sanitize_filename(project.title)
    output_dir = project_storage.get_output_dir(project_id)
    project_dir = project_storage.get_project_dir(project_id)

    candidates = [
        os.path.join(output_dir, f"captions.{fmt}"),
        os.path.join(output_dir, f"{safe_title}.{fmt}"),
        os.path.join(project_dir, f"captions.{fmt}")
    ]
    for c in candidates:
        if os.path.exists(c):
            media_type = "application/x-subrip" if fmt == "srt" else "text/vtt"
            return FileResponse(
                path=c,
                filename=f"{safe_title}.{fmt}",
                media_type=media_type
            )

    raise HTTPException(status_code=404, detail=f"Captions file in {fmt.upper()} not found")

@router.get("/projects/{project_id}/download/file/{filename}")
def download_output_file(project_id: str, filename: str, db: Session = Depends(get_db)):
    """
    Downloads any specific deliverable file stored in the project's dedicated output folder.
    """
    project_id = validate_id(project_id, "project_id")
    # Prevent path traversal and hidden files
    safe_name = os.path.basename(filename)
    if not safe_name or safe_name != filename or safe_name.startswith("."):
        raise HTTPException(status_code=400, detail="Invalid filename")

    output_dir = project_storage.get_output_dir(project_id)
    file_path = os.path.abspath(os.path.join(output_dir, safe_name))

    # Verify path is strictly within project's output_dir
    if not file_path.startswith(os.path.abspath(output_dir)):
        raise HTTPException(status_code=400, detail="Access denied")

    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="Requested deliverable file not found")

    return FileResponse(
        path=file_path,
        filename=safe_name
    )

@router.post("/projects/{project_id}/open-folder")
def open_project_folder(project_id: str, db: Session = Depends(get_db)):
    """
    Opens the project's dedicated output folder directly in the OS file explorer (Windows Explorer).
    """
    project_id = validate_id(project_id, "project_id")
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    res = project_storage.open_folder_in_os(project_id)
    return res

