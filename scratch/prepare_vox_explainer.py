import os
import sys
import json
import uuid
import asyncio
import subprocess

# Add project root to sys.path
sys.path.insert(0, os.path.abspath("."))

from backend.app.services.audio_engine import audio_engine
from backend.app.services.broll_engine import broll_engine
from backend.app.core.database import SessionLocal
from backend.app.models.project import Project, Scene, ScriptRevision

# Vox Explainer 6-beat script structure
BEATS = [
    {
        "role": "hook",
        "headline": "THE MARKET TRAP",
        "narration": "Most people think beating the stock market means picking the next Apple or Nvidia. But Wall Street's best-kept secret is that almost nobody can.",
        "query": "stock-market",
        "badge": "WALL STREET ILLUSION",
        "accent": "#E11D48",
    },
    {
        "role": "misconception",
        "headline": "92% OF MANAGERS FAIL",
        "narration": "Over ninety-two percent of professional hedge fund managers fail to beat the simple S&P 500 index over a fifteen-year period. Their fees quietly drain your portfolio.",
        "query": "finance",
        "badge": "15-YEAR SPIVA DATA",
        "accent": "#F59E0B",
    },
    {
        "role": "hidden_engine",
        "headline": "BUY THE HAYSTACK",
        "narration": "In 1975, legendary investor John Bogle launched a radical idea: Don't look for the needle in the haystack. Just buy the entire haystack.",
        "query": "money",
        "badge": "VANGUARD 1975",
        "accent": "#2563EB",
    },
    {
        "role": "step_breakdown",
        "headline": "THE 500-COMPANY BASKET",
        "narration": "An index fund automatically buys a proportional slice of all 500 largest profitable American companies in one single, self-cleansing basket.",
        "query": "business",
        "badge": "S&P 500 MECHANISM",
        "accent": "#059669",
    },
    {
        "role": "implication",
        "headline": "THE 1% FEE DESTROYER",
        "narration": "Active funds charge over one percent every year. Index funds charge near zero, saving you hundreds of thousands of dollars in compounding fees.",
        "query": "finance",
        "badge": "COMPOUND MATH",
        "accent": "#DC2626",
    },
    {
        "role": "payoff",
        "headline": "OWN THE MACHINE",
        "narration": "You don't need to predict tomorrow's winners. By owning the whole market, the compounding engine of human innovation works for you.",
        "query": "mountain",
        "badge": "THE FINAL RULE",
        "accent": "#7C3AED",
    }
]

async def main():
    print("=== Step 1: Synthesizing Audio for 6 Beats ===")
    out_audio_dir = os.path.abspath("vox_remotion/public/audio")
    out_assets_dir = os.path.abspath("vox_remotion/public/assets")
    os.makedirs(out_audio_dir, exist_ok=True)
    os.makedirs(out_assets_dir, exist_ok=True)

    scenes_data = []
    fps = 30
    total_frames = 0
    start_frame = 0

    scene_audio_paths = []

    for i, beat in enumerate(BEATS):
        scene_id = f"beat_{i+1}"
        print(f"Synthesizing beat {i+1}: {beat['headline']}")
        audio_path, dur, tokens = await audio_engine.synthesize_scene_narration(
            scene_id=scene_id,
            text=beat["narration"],
            voice="en-US-ChristopherNeural",
            voice_style="energetic",
            output_dir=out_audio_dir
        )
        scene_audio_paths.append(audio_path)
        
        # Calculate frame counts (pad by 0.4s buffer at the end of each scene for breathing room)
        scene_duration_sec = dur + 0.4
        frame_count = int(round(scene_duration_sec * fps))

        token_list = [
            {
                "word": t.word,
                "start": t.start,
                "end": t.end,
                "start_frame": int(round(t.start * fps)),
                "end_frame": int(round(t.end * fps))
            }
            for t in tokens
        ]

        scenes_data.append({
            "index": i,
            "scene_id": scene_id,
            "role": beat["role"],
            "headline": beat["headline"],
            "narration": beat["narration"],
            "badge": beat["badge"],
            "accent": beat["accent"],
            "duration_sec": scene_duration_sec,
            "frame_count": frame_count,
            "start_frame": start_frame,
            "end_frame": start_frame + frame_count,
            "audio_file": f"audio/{scene_id}_narration.mp3",
            "tokens": token_list,
            "query": beat["query"]
        })

        start_frame += frame_count
        total_frames += frame_count

    print(f"Total Composition Duration: {total_frames} frames ({total_frames / fps:.2f}s)")

    # Concatenate voiceover tracks
    concat_list_file = os.path.join(out_audio_dir, "concat_list.txt")
    full_vo_path = os.path.join(out_audio_dir, "full_voiceover.aac")
    with open(concat_list_file, "w", encoding="utf-8") as f:
        for p in scene_audio_paths:
            f.write(f"file '{p.replace('\\', '/')}'\n")

    subprocess.run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0",
        "-i", concat_list_file,
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
        full_vo_path
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Mix with BGM with -14dB ducking
    total_sec = total_frames / fps
    bgm_in = os.path.abspath("storage/audio_library/bgm/cinematic_ambient.aac")
    looped_bgm = os.path.join(out_audio_dir, "looped_bgm.aac")
    audio_engine.prepare_looped_bgm(bgm_in, total_sec, looped_bgm)

    mixed_audio_path = os.path.join(out_audio_dir, "master_audio.aac")
    audio_engine.mix_audio_with_ducking(
        voiceover_path=full_vo_path,
        music_path=looped_bgm,
        output_path=mixed_audio_path,
        total_duration=total_sec,
        ducking_ratio=0.14
    )
    print("Master mixed audio created with dynamic ducking!")

    # Step 2: Fetch / Crop matching B-roll footage for each beat
    print("=== Step 2: Preparing B-Roll Footage for each scene ===")
    for i, s in enumerate(scenes_data):
        cands = await broll_engine.search_candidates(
            scene_id=s["scene_id"],
            queries=[s["query"], "finance", "business"],
            script_context=s["narration"],
            aspect_ratio="9:16",
            min_duration=s["duration_sec"],
            limit=4
        )
        clip_src = None
        for c in cands:
            p = broll_engine.get_cached_asset_path(c.source_url)
            if p and os.path.exists(p) and os.path.getsize(p) > 100000:
                clip_src = p
                break
            # Or download
            dp = broll_engine.download_asset_on_demand(c.download_url or c.source_url)
            if dp and os.path.exists(dp) and os.path.getsize(dp) > 100000:
                clip_src = dp
                break

        # Fallback to local stock library cache if candidate not downloaded
        if not clip_src:
            cache_files = [os.path.join("storage/stock_library/cache", f) for f in os.listdir("storage/stock_library/cache") if f.endswith(".mp4")]
            clip_src = cache_files[i % len(cache_files)]

        # Transcode/crop to clean 1080x1920 clip for Remotion
        out_broll = os.path.join(out_assets_dir, f"broll_{i+1}.mp4")
        subprocess.run([
            "ffmpeg", "-y", "-i", clip_src,
            "-t", str(s["duration_sec"] + 1.0),
            "-vf", "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920",
            "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", "-r", "30",
            "-an", out_broll
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Extract a preview frame
        out_thumb = os.path.join(out_assets_dir, f"broll_{i+1}.jpg")
        subprocess.run([
            "ffmpeg", "-y", "-ss", "1.0", "-i", out_broll,
            "-vframes", "1", "-q:v", "2", out_thumb
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        s["broll_video"] = f"assets/broll_{i+1}.mp4"
        s["broll_thumb"] = f"assets/broll_{i+1}.jpg"
        print(f"Prepared B-roll for scene {i+1}: {out_broll}")

    # Step 3: Write scenesData.json for Remotion
    metadata = {
        "title": "How Index Funds Work",
        "subtitle": "The Math of Buying the Haystack",
        "fps": fps,
        "width": 1080,
        "height": 1920,
        "total_frames": total_frames,
        "total_duration_sec": total_sec,
        "audio_src": "audio/master_audio.aac",
        "scenes": scenes_data
    }

    with open("vox_remotion/src/voxData.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print("voxData.json exported to vox_remotion/src/voxData.json")

if __name__ == "__main__":
    asyncio.run(main())
