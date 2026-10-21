import os
import sys
import json
import shutil
import zipfile
import subprocess
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath("."))
from backend.app.core.database import SessionLocal
from backend.app.models.project import Project, RenderJob

def utcnow():
    return datetime.now(timezone.utc)

def finalize():
    src_mp4 = os.path.abspath("vox_remotion/out/index_funds_vox_explainer.mp4")
    if not os.path.exists(src_mp4) or os.path.getsize(src_mp4) < 1000:
        print(f"Error: {src_mp4} does not exist or is too small.")
        return False

    project_id = "proj-vox-index-funds"
    out_dir = os.path.abspath(f"storage/projects/{project_id}/output")
    frames_dir = os.path.join(out_dir, "frames")
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(frames_dir, exist_ok=True)

    dest_mp4 = os.path.join(out_dir, "final_video.mp4")
    shutil.copy(src_mp4, dest_mp4)
    print(f"Copied final MP4 to {dest_mp4} ({os.path.getsize(dest_mp4)} bytes)")

    # Extract key verification frames including the final social CTA frame
    check_times = [1.5, 11.0, 20.0, 30.0, 40.0, 52.5]
    for i, t in enumerate(check_times):
        f_path = os.path.join(frames_dir, f"beat_{i+1}_check.jpg")
        subprocess.run([
            "ffmpeg", "-y", "-ss", str(t), "-i", dest_mp4,
            "-vframes", "1", "-q:v", "2", f_path
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(f"Extracted verification frame for beat {i+1}: {f_path}")

    # Extract explicit last-second frame
    last_frame_path = os.path.join(frames_dir, "final_frame_cta.jpg")
    subprocess.run([
        "ffmpeg", "-y", "-sseof", "-1", "-i", dest_mp4,
        "-vframes", "1", "-q:v", "2", last_frame_path
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    print(f"Extracted final second CTA frame: {last_frame_path}")

    # Generate thumbnail
    dest_thumb = os.path.join(out_dir, "thumbnail.jpg")
    if os.path.exists(os.path.join(frames_dir, "beat_1_check.jpg")):
        shutil.copy(os.path.join(frames_dir, "beat_1_check.jpg"), dest_thumb)

    # Generate SRT and VTT from voxData.json tokens
    with open("vox_remotion/src/voxData.json", "r", encoding="utf-8") as f:
        vox_data = json.load(f)

    srt_path = os.path.join(out_dir, "captions.srt")
    vtt_path = os.path.join(out_dir, "captions.vtt")

    # Format timestamp to HH:MM:SS,mmm
    def format_srt_time(seconds):
        hrs = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int(round((seconds - int(seconds)) * 1000))
        return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"

    def format_vtt_time(seconds):
        return format_srt_time(seconds).replace(",", ".")

    all_tokens = []
    for s in vox_data["scenes"]:
        offset = s["start_frame"] / 30.0
        for t in s["tokens"]:
            all_tokens.append({
                "word": t["word"],
                "start": round(offset + t["start"], 3),
                "end": round(offset + t["end"], 3)
            })

    # Chunk into 4-word subtitles
    sub_chunks = []
    chunk_size = 4
    for i in range(0, len(all_tokens), chunk_size):
        chunk = all_tokens[i:i+chunk_size]
        sub_chunks.append({
            "start": chunk[0]["start"],
            "end": chunk[-1]["end"],
            "text": " ".join([c["word"] for c in chunk])
        })

    with open(srt_path, "w", encoding="utf-8") as f:
        for idx, sub in enumerate(sub_chunks, 1):
            f.write(f"{idx}\n{format_srt_time(sub['start'])} --> {format_srt_time(sub['end'])}\n{sub['text']}\n\n")

    with open(vtt_path, "w", encoding="utf-8") as f:
        f.write("WEBVTT\n\n")
        for idx, sub in enumerate(sub_chunks, 1):
            f.write(f"{idx}\n{format_vtt_time(sub['start'])} --> {format_vtt_time(sub['end'])}\n{sub['text']}\n\n")

    # Create Distribution ZIP package
    zip_path = os.path.join(out_dir, f"{project_id}_export_bundle.zip")
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.write(dest_mp4, arcname="final_video.mp4")
        z.write(dest_thumb, arcname="thumbnail.jpg")
        z.write(srt_path, arcname="captions.srt")
        z.write(vtt_path, arcname="captions.vtt")
        for i in range(len(check_times)):
            frame_file = os.path.join(frames_dir, f"beat_{i+1}_check.jpg")
            if os.path.exists(frame_file):
                z.write(frame_file, arcname=f"frames/beat_{i+1}_check.jpg")

    print(f"Created complete ZIP bundle: {zip_path}")

    # Update SQLite database
    db = SessionLocal()
    try:
        job = db.query(RenderJob).filter(RenderJob.project_id == project_id).first()
        if job:
            job.status = "COMPLETED"
            job.progress = 100
            job.current_stage = "DELIVERED"
            job.output_mp4_path = dest_mp4
            job.thumbnail_path = dest_thumb
            job.end_time = utcnow()
        
        proj = db.query(Project).filter(Project.id == project_id).first()
        if proj:
            proj.status = "COMPLETED"

        db.commit()
        print("Updated RenderJob and Project status to COMPLETED in database!")
    finally:
        db.close()

    return True

if __name__ == "__main__":
    finalize()
