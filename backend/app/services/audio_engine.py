import os
import re
import json
import asyncio
import subprocess
from typing import Dict, Any, List, Tuple, Optional
import edge_tts
from backend.app.core.config import settings
from backend.app.schemas.scene import CaptionWordToken

VOICE_STYLES: Dict[str, Dict[str, str]] = {
    "energetic": {
        "id": "energetic",
        "name": "Energetic & Viral",
        "rate": "+12%",
        "pitch": "+2Hz",
        "description": "High-energy, fast-paced cadence for TikTok and Shorts retention"
    },
    "documentary": {
        "id": "documentary",
        "name": "Authoritative & Documentary",
        "rate": "+0%",
        "pitch": "-1Hz",
        "description": "Clear, measured documentary cadence with crisp articulation"
    },
    "dramatic": {
        "id": "dramatic",
        "name": "Dramatic & Storyteller",
        "rate": "-6%",
        "pitch": "-3Hz",
        "description": "Deep, moody, suspenseful delivery with dramatic pauses"
    },
    "urgent": {
        "id": "urgent",
        "name": "Urgent & Breaking News",
        "rate": "+16%",
        "pitch": "+3Hz",
        "description": "Rapid, high-impact delivery for breaking revelations"
    }
}

def sanitize_narration_for_speech(text: str) -> str:
    """
    Cleans narration text so the TTS engine ONLY speaks pure human sentences.
    Strips out structural metadata labels, cues, prefixes, brackets, and markdown.
    Ensures phrases like 'Angle:', 'Hook:', 'Scene 1 - Hook:', 'Narrator:', etc. are never spoken.
    """
    if not text:
        return "..."

    s = text.strip()

    # 1. Strip common script/prompt prefix tags (case-insensitive, greedy)
    pattern_prefix = r"^(?:(?:scene\s*\d*|hook|angle|narration|narrator|voiceover|vo|visual|video|audio|intro|outro|payoff|climax|setup)\s*[:\-\–\—\.]*\s*)+"
    s = re.sub(pattern_prefix, "", s, flags=re.IGNORECASE).strip()
    s = re.sub(pattern_prefix, "", s, flags=re.IGNORECASE).strip()

    # 2. Remove stage directions in brackets or parentheses
    s = re.sub(r"\[(?:sfx|sound|music|pause|visual|fx|cut|beat)[^\]]*\]", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\((?:sfx|sound|music|pause|visual|fx|whispering|smiling|laughing|dramatic|beat)[^\)]*\)", "", s, flags=re.IGNORECASE)
    s = re.sub(r"\[.*?\]", "", s)

    # 3. Strip inline "Angle:" or "Hook:" if embedded inside the sentence
    s = re.sub(r"\b(?:angle|hook|narration)\s*:\s*", "", s, flags=re.IGNORECASE)

    # 4. Remove markdown formatting
    s = re.sub(r"[\*\_]{1,3}", "", s)
    s = re.sub(r"^#+\s*", "", s)
    s = re.sub(r"`[^`]*`", "", s)

    # 5. Strip enclosing quotes
    s = s.strip()
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        s = s[1:-1].strip()

    # 6. Normalize whitespace
    s = re.sub(r"\s+", " ", s).strip()

    return s if s else "..."

class AudioEngine:
    def __init__(self):
        self.audio_dir = os.path.join(settings.STORAGE_DIR, "audio_library")
        self.bgm_dir = os.path.join(self.audio_dir, "bgm")
        os.makedirs(self.audio_dir, exist_ok=True)
        os.makedirs(self.bgm_dir, exist_ok=True)

    def list_voice_styles(self) -> List[Dict[str, str]]:
        """Return available voice narration styles."""
        return list(VOICE_STYLES.values())

    def list_bgm_tracks(self) -> List[Dict[str, str]]:
        """
        Lists available bundled background music tracks across genre groups.
        """
        tracks = []
        if os.path.exists(self.bgm_dir):
            for file in os.listdir(self.bgm_dir):
                if file.endswith((".aac", ".mp3", ".wav")):
                    name = file.rsplit(".", 1)[0].replace("_", " ").title()
                    tracks.append({
                        "id": file,
                        "name": name,
                        "path": os.path.join(self.bgm_dir, file)
                    })
        return tracks

    def sanitize_narration(self, text: str) -> str:
        return sanitize_narration_for_speech(text)

    async def synthesize_scene_narration(
        self,
        scene_id: str,
        text: str,
        voice: str = "en-US-ChristopherNeural",
        voice_style: str = "energetic",
        rate: Optional[str] = None,
        pitch: Optional[str] = None,
        output_dir: Optional[str] = None
    ) -> Tuple[str, float, List[CaptionWordToken]]:
        target_dir = output_dir or self.audio_dir
        os.makedirs(target_dir, exist_ok=True)
        audio_path = os.path.join(target_dir, f"{scene_id}_narration.mp3")

        # Sanitize narration so it only speaks clean sentences
        clean_text = sanitize_narration_for_speech(text)

        # Apply voice style preset
        style_config = VOICE_STYLES.get(voice_style.lower(), VOICE_STYLES["energetic"])
        effective_rate = rate or style_config.get("rate", "+12%")
        effective_pitch = pitch or style_config.get("pitch", "+2Hz")

        communicate = edge_tts.Communicate(clean_text, voice=voice, rate=effective_rate, pitch=effective_pitch)

        word_tokens: List[CaptionWordToken] = []
        raw_audio_chunks = []

        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                raw_audio_chunks.append(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                offset_s = chunk["offset"] / 10_000_000.0
                duration_s = chunk["duration"] / 10_000_000.0
                word = chunk["text"]
                word_tokens.append(CaptionWordToken(
                    word=word,
                    start=round(offset_s, 3),
                    end=round(offset_s + duration_s, 3),
                    confidence=1.0
                ))

        with open(audio_path, "wb") as f:
            for c in raw_audio_chunks:
                f.write(c)

        duration = self.get_audio_duration(audio_path)

        if not word_tokens and clean_text:
            words = clean_text.split()
            word_dur = duration / max(len(words), 1)
            cur = 0.0
            for w in words:
                word_tokens.append(CaptionWordToken(
                    word=w,
                    start=round(cur, 3),
                    end=round(cur + word_dur, 3),
                    confidence=0.85
                ))
                cur += word_dur

        return audio_path, duration, word_tokens

    def get_audio_duration(self, audio_path: str) -> float:
        cmd = [settings.FFMPEG_PATH, "-i", audio_path]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", proc.stderr)
        if match:
            hours, minutes, seconds = match.groups()
            return float(hours) * 3600 + float(minutes) * 60 + float(seconds)
        return 5.0

    def prepare_looped_bgm(self, bgm_track: Optional[str], total_duration: float, output_path: str):
        """
        Loops background music track if total_duration > track duration,
        and applies a smooth 1.5s volume fade-out at the end of the video.
        """
        selected_bgm = None
        if bgm_track:
            safe_name = os.path.basename(bgm_track)
            candidate = os.path.join(self.bgm_dir, safe_name)
            if os.path.exists(candidate) and os.path.isfile(candidate):
                selected_bgm = candidate

        if not selected_bgm:
            # Fallback to first available genre track or generate
            available = self.list_bgm_tracks()
            if available:
                selected_bgm = available[0]["path"]

        fade_start = max(0.0, total_duration - 1.5)
        fade_filter = f"aloop=loop=-1:size=2e+09,afade=t=out:st={fade_start}:d=1.5"

        if selected_bgm and os.path.exists(selected_bgm):
            cmd = [
                settings.FFMPEG_PATH,
                "-y",
                "-stream_loop", "-1",
                "-i", selected_bgm,
                "-af", f"afade=t=out:st={fade_start}:d=1.5",
                "-t", str(total_duration),
                "-c:a", "aac",
                output_path
            ]
        else:
            # Generate synth bed fallback
            cmd = [
                settings.FFMPEG_PATH,
                "-y",
                "-f", "lavfi",
                "-i", f"sine=frequency=220:duration={total_duration}",
                "-af", f"volume=0.1,lowpass=f=400,afade=t=out:st={fade_start}:d=1.5",
                "-t", str(total_duration),
                "-c:a", "aac",
                output_path
            ]
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

    def mix_audio_with_ducking(
        self,
        voiceover_path: str,
        music_path: str,
        output_path: str,
        total_duration: float,
        ducking_ratio: float = 0.15
    ):
        """
        Mixes voiceover narration with background music bed,
        attenuating music under narration and capping at exact total duration.
        """
        filter_str = (
            f"[1:a]volume={ducking_ratio}[bg];"
            f"[0:a]volume=1.0[vo];"
            f"[vo][bg]amix=inputs=2:duration=first:dropout_transition=2[out]"
        )
        cmd = [
            settings.FFMPEG_PATH,
            "-y",
            "-i", voiceover_path,
            "-i", music_path,
            "-filter_complex", filter_str,
            "-map", "[out]",
            "-t", str(total_duration),
            "-c:a", "aac",
            "-b:a", "192k",
            "-ar", "48000",
            "-ac", "2",
            output_path
        ]
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)

audio_engine = AudioEngine()
