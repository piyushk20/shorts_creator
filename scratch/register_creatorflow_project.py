import os
import sys
import json
import uuid
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath("."))
from backend.app.core.database import SessionLocal
from backend.app.models.project import Project, Scene, ScriptRevision, RenderJob

def utcnow():
    return datetime.now(timezone.utc)

def register_project():
    db = SessionLocal()
    try:
        with open("vox_remotion/src/voxData.json", "r", encoding="utf-8") as f:
            vox_data = json.load(f)

        project_id = "proj-vox-index-funds"
        title = "How Index Funds Work"

        # Check if already exists
        existing = db.query(Project).filter(Project.id == project_id).first()
        if existing:
            db.delete(existing)
            db.commit()

        # Create Project
        proj = Project(
            id=project_id,
            title=title,
            topic="How Index Funds Work: The Math of Buying the Haystack",
            platform="youtube_shorts",
            aspect_ratio="9:16",
            width=1080,
            height=1920,
            fps=30,
            target_duration=int(vox_data["total_duration_sec"]),
            language="en",
            voice="en-US-ChristopherNeural",
            voice_style="energetic",
            visual_style="vox_paper_collage",
            caption_style="word_highlight",
            status="APPROVED",
            created_at=utcnow(),
            updated_at=utcnow()
        )
        db.add(proj)

        # Scenes
        for s in vox_data["scenes"]:
            scene_id = f"scene-vox-{s['index']+1}"
            scene = Scene(
                id=scene_id,
                project_id=project_id,
                order=s["index"] + 1,
                role=s["role"],
                narration=s["narration"],
                estimated_duration=s["duration_sec"],
                actual_duration=s["duration_sec"],
                visual_description=f"Vox Paper Collage Beat: {s['headline']} with tactile card cutouts, washi tape, and B-roll",
                search_queries_json=json.dumps([s["query"], "finance", "investing"]),
                selected_asset_id=f"mixkit-asset-{s['index']+1}",
                caption_tokens_json=json.dumps(s["tokens"]),
                audio_path=os.path.abspath(f"vox_remotion/public/{s['audio_file']}"),
                on_screen_text=s["headline"],
                caption_style="word_highlight"
            )
            db.add(scene)

        # Script Revision
        full_script = " ".join([s["narration"] for s in vox_data["scenes"]])
        rev = ScriptRevision(
            id=str(uuid.uuid4()),
            project_id=project_id,
            revision_number=1,
            hook_options_json=json.dumps([vox_data["scenes"][0]["narration"]]),
            recommended_hook=vox_data["scenes"][0]["narration"],
            full_script=full_script,
            scenes_data_json=json.dumps(vox_data["scenes"]),
            is_approved=True,
            created_at=utcnow()
        )
        db.add(rev)

        # Output project folder in storage/projects/
        project_storage_dir = os.path.abspath(f"storage/projects/{project_id}")
        output_dir = os.path.join(project_storage_dir, "output")
        renders_dir = os.path.join(project_storage_dir, "renders")
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(renders_dir, exist_ok=True)

        job_id = "job-vox-render-01"
        final_mp4 = os.path.abspath(f"storage/projects/{project_id}/output/final_video.mp4")
        thumb_jpg = os.path.abspath(f"storage/projects/{project_id}/output/thumbnail.jpg")

        # Copy check_45.png as thumbnail
        if os.path.exists("vox_remotion/out/check_45.png"):
            import shutil
            shutil.copy("vox_remotion/out/check_45.png", thumb_jpg)

        render_job = RenderJob(
            id=job_id,
            project_id=project_id,
            renderer="remotion",
            status="IN_PROGRESS",
            progress=25,
            current_stage="RENDERING",
            output_mp4_path=final_mp4,
            thumbnail_path=thumb_jpg,
            start_time=utcnow()
        )
        db.add(render_job)

        db.commit()
        print(f"Project '{title}' successfully registered in SQLite database with ID: {project_id}")

    finally:
        db.close()

if __name__ == "__main__":
    register_project()
