import os
import re
import json
import uuid
import shutil
import asyncio
import subprocess
from typing import List, Dict, Any, Optional
from backend.app.core.config import settings
from backend.app.core.security import escape_ffmpeg_path, escape_ffmpeg_concat_path, sanitize_safe_id
from backend.app.schemas.scene import SceneSchema
from backend.app.services.audio_engine import audio_engine
from backend.app.services.caption_engine import caption_engine
from backend.app.services.broll_engine import broll_engine
from backend.app.services.qa_gate import qa_gate
from backend.app.services.export_packager import export_packager
from backend.app.services.project_storage import project_storage

class RenderEngine:
    def __init__(self):
        self.jobs: Dict[str, Dict[str, Any]] = {}

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        return self.jobs.get(job_id)

    async def execute_render_job(
        self,
        job_id: str,
        project_id: str,
        project_title: str,
        scenes: List[SceneSchema],
        aspect_ratio: str = "9:16",
        width: int = 1080,
        height: int = 1920,
        fps: int = 30,
        voice: str = "en-US-ChristopherNeural",
        voice_style: str = "energetic",
        add_music: bool = True,
        bgm_track: Optional[str] = "cinematic_ambient.aac",
        burn_subtitles: bool = True,
        caption_position: str = "bottom", # Bottom Safe Zone
        db_callback = None
    ):
        dirs = project_storage.init_project_folder(project_id, project_title)
        project_dir = dirs["project_dir"]
        renders_dir = dirs["renders_dir"]

        self.jobs[job_id] = {
            "id": job_id,
            "project_id": project_id,
            "status": "IN_PROGRESS",
            "progress": 5,
            "current_stage": "INITIALIZING",
            "output_mp4_path": None,
            "thumbnail_path": None,
            "error_message": None
        }

        try:
            # Stage 1: Narration Synthesis & Exact Word Timestamps
            self._update_stage(job_id, "VOICE_GENERATION", 15, "Synthesizing neural voiceover & word timestamps")
            for idx, scene in enumerate(scenes):
                # Ensure narration is sanitized so it only speaks clean sentences
                clean_text = audio_engine.sanitize_narration(scene.narration)
                scene.narration = clean_text

                a_path, a_dur, tokens = await audio_engine.synthesize_scene_narration(
                    scene_id=scene.scene_id,
                    text=clean_text,
                    voice=voice,
                    voice_style=voice_style,
                    output_dir=os.path.join(project_dir, "audio")
                )
                scene.audio_path = a_path
                scene.actual_duration_seconds = a_dur
                scene.caption_tokens = tokens

            # Stage 2: B-Roll Footage Selection & Verification (with cache lookup)
            self._update_stage(job_id, "ASSET_RETRIEVAL", 30, "Retrieving and verifying candidate footage")
            scene_clips = []
            provenance_records = []
            used_asset_ids = set()

            for idx, scene in enumerate(scenes):
                scene_dur = scene.actual_duration_seconds or scene.estimated_duration_seconds
                candidates = await broll_engine.search_candidates(
                    scene_id=scene.scene_id,
                    queries=scene.search_queries or [scene.visual_description],
                    script_context=scene.narration,
                    aspect_ratio=aspect_ratio,
                    min_duration=scene_dur,
                    limit=8
                )
                chosen = None
                if scene.selected_asset_id:
                    chosen = next((c for c in candidates if c.id == scene.selected_asset_id), None)
                if not chosen and candidates:
                    # Pick highest-ranked candidate not already used by an earlier scene
                    for c in candidates:
                        if c.id not in used_asset_ids:
                            chosen = c
                            break
                    if not chosen:
                        chosen = candidates[0]

                if chosen:
                    used_asset_ids.add(chosen.id)

                clip_path = self._resolve_local_asset(chosen, candidates, scene, aspect_ratio, scene_dur, idx)
                scene_clips.append(clip_path)

                provenance_records.append({
                    "asset_id": chosen.id if chosen else f"fallback-{idx}",
                    "scene_id": scene.scene_id,
                    "provider": chosen.provider if chosen else "local_studio",
                    "source_url": chosen.source_url if chosen else "local",
                    "rights_status": chosen.rights_status if chosen else "VERIFIED_FOR_INTENDED_USE",
                    "license_type": chosen.license_type if chosen else "CreatorFlow Free Commercial",
                    "creator": chosen.creator if chosen else "CreatorFlow Studio"
                })

            # Stage 3: Caption Files Generation in Bottom Safe Zone
            self._update_stage(job_id, "CAPTION_BUILD", 45, "Generating synchronized captions in bottom safe zone")
            srt_path = os.path.join(project_dir, "captions.srt")
            vtt_path = os.path.join(project_dir, "captions.vtt")
            ass_path = os.path.join(project_dir, "captions.ass")
            caption_engine.generate_srt(scenes, srt_path)
            caption_engine.generate_vtt(scenes, vtt_path)
            caption_engine.generate_ass_karaoke(
                scenes=scenes,
                output_path=ass_path,
                video_width=width,
                video_height=height,
                position=caption_position
            )

            # Stage 4: Scene Video Composition with Zero-Black-Frame Looping
            self._update_stage(job_id, "TIMELINE_COMPOSITION", 60, "Compositing video tracks with clip duration protection")
            raw_video_path = os.path.join(renders_dir, f"{job_id}_video_only.mp4")
            full_voiceover_path = os.path.join(renders_dir, f"{job_id}_voiceover.aac")

            self._compose_scenes(scene_clips, scenes, width, height, fps, raw_video_path)
            self._concatenate_audio(scenes, full_voiceover_path)

            total_duration = sum([s.actual_duration_seconds or s.estimated_duration_seconds for s in scenes])

            # Stage 5: Audio Bed with Auto-Looping and 1.5s Fade-Out
            self._update_stage(job_id, "AUDIO_MIXING", 75, "Mixing voiceover with looped background music & 1.5s fade-out")
            final_audio_path = full_voiceover_path
            if add_music:
                looped_bgm_path = os.path.join(renders_dir, f"{job_id}_looped_bgm.aac")
                mixed_audio_path = os.path.join(renders_dir, f"{job_id}_mixed_audio.aac")
                audio_engine.prepare_looped_bgm(bgm_track, total_duration, looped_bgm_path)
                audio_engine.mix_audio_with_ducking(
                    voiceover_path=full_voiceover_path,
                    music_path=looped_bgm_path,
                    output_path=mixed_audio_path,
                    total_duration=total_duration,
                    ducking_ratio=0.14
                )
                final_audio_path = mixed_audio_path

            # Stage 6: Final MP4 Packaging with Burned-In Captions
            self._update_stage(job_id, "RENDERING", 85, "Rendering final H.264/AAC MP4 with burned subtitles")
            final_mp4_path = os.path.join(renders_dir, f"{job_id}_final.mp4")
            thumbnail_path = os.path.join(renders_dir, f"{job_id}_thumbnail.jpg")

            self._render_final_mp4(
                video_input=raw_video_path,
                audio_input=final_audio_path,
                ass_subtitles=ass_path if burn_subtitles else None,
                output_mp4=final_mp4_path,
                total_duration=total_duration
            )

            self._generate_thumbnail(final_mp4_path, thumbnail_path)

            # Stage 7: Technical Quality Assurance Gate
            self._update_stage(job_id, "QUALITY_CHECK", 92, "Running automated technical QA verification gate")
            qa_result = qa_gate.evaluate_video(
                job_id=job_id,
                project_id=project_id,
                mp4_path=final_mp4_path,
                expected_width=width,
                expected_height=height,
                expected_fps=fps,
                scenes=scenes,
                has_audio=True
            )

            # Stage 8: Export Packaging & Output Folder Deployment
            self._update_stage(job_id, "PACKAGING", 97, "Creating complete export package & deploying to dedicated output folder")
            scenes_dict_list = [s.model_dump() for s in scenes]
            zip_package = export_packager.create_export_package(
                project_id=project_id,
                project_title=project_title,
                mp4_path=final_mp4_path,
                thumbnail_path=thumbnail_path,
                srt_path=srt_path,
                vtt_path=vtt_path,
                scenes_data=scenes_dict_list,
                provenance_data=provenance_records,
                qa_data=qa_result.model_dump()
            )

            # Deploy deliverables into dedicated project output folder
            deployed = project_storage.deploy_final_output(
                project_id=project_id,
                project_title=project_title,
                mp4_path=final_mp4_path,
                thumbnail_path=thumbnail_path,
                srt_path=srt_path,
                vtt_path=vtt_path,
                zip_path=zip_package
            )

            # Mark Complete
            self.jobs[job_id]["status"] = "COMPLETED"
            self.jobs[job_id]["progress"] = 100
            self.jobs[job_id]["current_stage"] = "READY_FOR_REVIEW"
            self.jobs[job_id]["output_mp4_path"] = final_mp4_path
            self.jobs[job_id]["thumbnail_path"] = thumbnail_path
            self.jobs[job_id]["zip_package"] = zip_package
            self.jobs[job_id]["qa_report"] = qa_result.model_dump()
            self.jobs[job_id]["output_directory"] = deployed["output_dir"]
            self.jobs[job_id]["safe_title"] = deployed["safe_title"]

            if db_callback:
                db_callback(self.jobs[job_id])

        except Exception as e:
            import traceback
            traceback.print_exc()
            self.jobs[job_id]["status"] = "FAILED"
            self.jobs[job_id]["current_stage"] = "FAILED"
            self.jobs[job_id]["error_message"] = str(e)
            if db_callback:
                db_callback(self.jobs[job_id])

    def _update_stage(self, job_id: str, stage: str, progress: int, description: str):
        if job_id in self.jobs:
            self.jobs[job_id]["current_stage"] = stage
            self.jobs[job_id]["progress"] = progress
            self.jobs[job_id]["stage_description"] = description
            print(f"[RenderEngine] Job {job_id}: [{progress}%] {stage} - {description}")

    def _resolve_local_asset(self, candidate, all_candidates, scene, aspect_ratio: str, duration: float, idx: int) -> str:
        if scene and scene.selected_asset_id:
            raw_sel = scene.selected_asset_id.replace("file:///", "").replace("/", os.sep)
            if os.path.exists(raw_sel) and os.path.getsize(raw_sel) > 1024:
                return os.path.abspath(raw_sel)

        candidates_to_try = [candidate] if candidate else []
        if all_candidates:
            for c in all_candidates:
                if c not in candidates_to_try:
                    candidates_to_try.append(c)

        for cand in candidates_to_try:
            if cand and cand.download_url:
                if cand.download_url.startswith("file:///"):
                    raw_path = cand.download_url.replace("file:///", "").replace("/", os.sep)
                    abs_path = os.path.abspath(raw_path)
                    storage_abs = os.path.abspath(settings.STORAGE_DIR)
                    if abs_path.startswith(storage_abs) and os.path.exists(abs_path) and os.path.getsize(abs_path) > 1024:
                        return abs_path
                elif cand.download_url.startswith(("http://", "https://")):
                    downloaded = broll_engine.download_asset_on_demand(cand.download_url)
                    if downloaded and os.path.exists(downloaded) and os.path.getsize(downloaded) > 1024:
                        return downloaded

        # If online retrieval didn't return a candidate, prioritize real cached B-roll footage
        cache_dir = os.path.join(settings.STORAGE_DIR, "stock_library", "cache")
        if os.path.exists(cache_dir):
            cached_files = [
                os.path.join(cache_dir, f) for f in os.listdir(cache_dir)
                if f.endswith(".mp4") and not f.endswith(".tmp") and os.path.getsize(os.path.join(cache_dir, f)) > 1024 * 1024
            ]
            if cached_files:
                return cached_files[idx % len(cached_files)]

        # If all candidates fail and no cache available, fall back to synthesized HD clip
        w = 1080 if aspect_ratio == "9:16" else 1920
        h = 1920 if aspect_ratio == "9:16" else 1080
        fallback_path = os.path.join(settings.STORAGE_DIR, "stock_library", f"scene_{scene.scene_id}_{w}x{h}.mp4")

        if not os.path.exists(fallback_path):
            color_presets = ["0x0f172a", "0x1e293b", "0x3b0764", "0x1e1b4b", "0x14532d", "0x1c1917"]
            c = color_presets[idx % len(color_presets)]
            broll_engine._render_synthetic_clip(
                output_path=fallback_path,
                width=w,
                height=h,
                duration=duration + 1.0,
                color1=c,
                color2="0x0284c7",
                accent="0x38bdf8",
                label=scene.role.upper()
            )
        return fallback_path

    def _compose_scenes(
        self,
        clip_paths: List[str],
        scenes: List[SceneSchema],
        width: int,
        height: int,
        fps: int,
        output_path: str
    ):
        """
        Composites each scene's clip with frame-accurate duration,
        continuous presentation timestamps (setpts=PTS-STARTPTS),
        and seamless re-encoded concatenation to prevent freezing or desync.
        """
        temp_dir = os.path.dirname(output_path)
        processed_clips = []

        for idx, (clip, scene) in enumerate(zip(clip_paths, scenes)):
            dur = scene.actual_duration_seconds or scene.estimated_duration_seconds
            p_clip = os.path.join(temp_dir, f"segment_{idx}_{width}x{height}.mp4")

            vf = (
                f"scale={width}:{height}:force_original_aspect_ratio=increase,"
                f"crop={width}:{height},"
                f"fps={fps},"
                f"setpts=PTS-STARTPTS,"
                f"format=yuv420p"
            )
            # Use stream_loop -1 to guarantee loop without freezing
            cmd = [
                settings.FFMPEG_PATH,
                "-y",
                "-stream_loop", "-1",
                "-i", clip,
                "-t", str(dur),
                "-vf", vf,
                "-c:v", "libx264",
                "-preset", "veryfast",
                "-pix_fmt", "yuv420p",
                "-r", str(fps),
                "-an",
                p_clip
            ]
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            processed_clips.append(p_clip)

        concat_txt = os.path.join(temp_dir, "concat_list.txt")
        with open(concat_txt, "w", encoding="utf-8") as f:
            for p in processed_clips:
                clean_p = escape_ffmpeg_concat_path(p)
                f.write(f"file '{clean_p}'\n")

        # Concat with libx264 re-encoding to guarantee continuous monotonic PTS across all scenes
        cmd_concat = [
            settings.FFMPEG_PATH,
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_txt,
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-pix_fmt", "yuv420p",
            "-r", str(fps),
            output_path
        ]
        subprocess.run(cmd_concat, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

    def _concatenate_audio(self, scenes: List[SceneSchema], output_path: str):
        temp_dir = os.path.dirname(output_path)
        concat_txt = os.path.join(temp_dir, "audio_concat.txt")
        with open(concat_txt, "w", encoding="utf-8") as f:
            for s in scenes:
                if s.audio_path and os.path.exists(s.audio_path):
                    clean_p = escape_ffmpeg_concat_path(s.audio_path)
                    f.write(f"file '{clean_p}'\n")

        cmd = [
            settings.FFMPEG_PATH,
            "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_txt,
            "-c:a", "aac",
            "-b:a", "192k",
            "-ar", "48000",
            "-ac", "2",
            output_path
        ]
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

    def _render_final_mp4(
        self,
        video_input: str,
        audio_input: str,
        ass_subtitles: Optional[str],
        output_mp4: str,
        total_duration: float
    ):
        cmd = [
            settings.FFMPEG_PATH,
            "-y",
            "-i", video_input,
            "-i", audio_input
        ]

        if ass_subtitles and os.path.exists(ass_subtitles):
            clean_sub = escape_ffmpeg_path(ass_subtitles)
            vf = f"ass='{clean_sub}'"
            cmd.extend(["-vf", vf])

        cmd.extend([
            "-c:v", "libx264",
            "-preset", "medium",
            "-crf", "20",
            "-pix_fmt", "yuv420p",
            "-r", "30",
            "-c:a", "aac",
            "-b:a", "192k",
            "-ar", "48000",
            "-ac", "2",
            "-shortest",
            "-t", str(total_duration),
            "-movflags", "+faststart",
            output_mp4
        ])
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

    def _generate_thumbnail(self, video_path: str, thumbnail_path: str):
        cmd = [
            settings.FFMPEG_PATH,
            "-y",
            "-ss", "00:00:01.500",
            "-i", video_path,
            "-vframes", "1",
            "-q:v", "2",
            thumbnail_path
        ]
        try:
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        except Exception as e:
            print(f"[RenderEngine] Thumbnail error: {e}")

render_engine = RenderEngine()
