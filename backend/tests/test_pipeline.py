import pytest
import os
import asyncio
from backend.app.services.llm_engine import llm_engine
from backend.app.services.audio_engine import audio_engine
from backend.app.services.caption_engine import caption_engine
from backend.app.schemas.scene import SceneSchema

def test_llm_script_generation():
    result = asyncio.run(llm_engine.generate_script(
        topic="How Compounding Interest Works",
        target_duration=30,
        language="en"
    ))
    assert result.title is not None
    assert len(result.hook_options) >= 3
    assert len(result.scenes) >= 3
    assert all(s.narration for s in result.scenes)

def test_audio_synthesis_and_word_tokens():
    test_scene = "test_scene_001"
    text = "The secret to wealth is compound interest."
    path, dur, tokens = asyncio.run(audio_engine.synthesize_scene_narration(
        scene_id=test_scene,
        text=text,
        voice="en-US-ChristopherNeural"
    ))
    assert os.path.exists(path)
    assert dur > 1.0
    assert len(tokens) > 0
    assert tokens[0].word is not None

def test_caption_generation(tmp_path):
    scenes = [
        SceneSchema(
            scene_id="s1",
            order=1,
            role="hook",
            narration="Welcome to CreatorFlow Studio",
            estimated_duration_seconds=3.0,
            visual_description="Test Visual"
        )
    ]
    srt_file = str(tmp_path / "test.srt")
    vtt_file = str(tmp_path / "test.vtt")
    ass_file = str(tmp_path / "test.ass")
    caption_engine.generate_srt(scenes, srt_file)
    caption_engine.generate_vtt(scenes, vtt_file)
    caption_engine.generate_ass_karaoke(scenes, ass_file, position="bottom")
    assert os.path.exists(srt_file)
    assert os.path.exists(vtt_file)
    assert os.path.exists(ass_file)

    # Verify bottom safe zone margin is set in ASS file
    with open(ass_file, "r", encoding="utf-8") as f:
        content = f.read()
        assert "360" in content  # MarginV = 360 for bottom safe zone

def test_bgm_library_tracks():
    tracks = audio_engine.list_bgm_tracks()
    assert len(tracks) >= 3
    track_ids = [t["id"] for t in tracks]
    assert "cinematic_ambient.aac" in track_ids
    assert "upbeat_tech.aac" in track_ids
