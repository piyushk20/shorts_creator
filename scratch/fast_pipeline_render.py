import os
import sys
import json
import subprocess
import shutil

sys.path.insert(0, os.path.abspath("."))

def fast_pipeline_render():
    project_id = "proj-vox-index-funds"
    out_dir = os.path.abspath(f"storage/projects/{project_id}/output")
    os.makedirs(out_dir, exist_ok=True)

    with open("vox_remotion/src/voxData.json", "r", encoding="utf-8") as f:
        vox_data = json.load(f)

    scenes = vox_data["scenes"]
    concat_list = os.path.join(out_dir, "clips_concat.txt")

    with open(concat_list, "w", encoding="utf-8") as f:
        for s in scenes:
            clip_path = os.path.abspath(f"vox_remotion/public/{s['broll_video']}")
            f.write(f"file '{clip_path.replace('\\', '/')}'\n")

    # Concatenate B-roll clips
    raw_video = os.path.join(out_dir, "raw_broll_concat.mp4")
    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", concat_list,
        "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-r", "30",
        "-an", raw_video
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Multiplex with master ducked audio
    audio_path = os.path.abspath("vox_remotion/public/audio/master_audio.aac")
    output_mp4 = os.path.join(out_dir, "pipeline_video.mp4")
    final_mp4 = os.path.join(out_dir, "final_video.mp4")

    subprocess.run([
        "ffmpeg", "-y",
        "-i", raw_video,
        "-i", audio_path,
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        output_mp4
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    if not os.path.exists(final_mp4):
        shutil.copy(output_mp4, final_mp4)

    # Copy thumbnail
    if os.path.exists("vox_remotion/out/check_45.png"):
        shutil.copy("vox_remotion/out/check_45.png", os.path.join(out_dir, "thumbnail.jpg"))

    print(f"Fast pipeline render completed: {output_mp4}")

if __name__ == "__main__":
    fast_pipeline_render()
