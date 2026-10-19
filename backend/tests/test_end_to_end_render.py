import os
import asyncio
import pytest
from backend.app.services.llm_engine import llm_engine
from backend.app.services.render_engine import render_engine
from backend.app.core.config import settings

def test_full_pipeline_render():
    # 1. Generate script
    script = asyncio.run(llm_engine.generate_script(
        topic="3 Habits of High Achievers",
        target_duration=15,
        language="en"
    ))
    assert len(script.scenes) >= 3

    # Use first 3 scenes for fast test render
    test_scenes = script.scenes[:3]
    for s in test_scenes:
        s.estimated_duration_seconds = 3.0

    job_id = "test-e2e-job-001"
    project_id = "test-project-001"

    # 2. Execute render
    asyncio.run(render_engine.execute_render_job(
        job_id=job_id,
        project_id=project_id,
        project_title="3 Habits of High Achievers",
        scenes=test_scenes,
        aspect_ratio="9:16",
        width=1080,
        height=1920,
        fps=30,
        voice="en-US-ChristopherNeural",
        add_music=True,
        burn_subtitles=True
    ))

    status = render_engine.get_job_status(job_id)
    assert status is not None
    print(f"Status result: {status}")
    assert status["status"] == "COMPLETED"
    assert status["output_mp4_path"] is not None
    assert os.path.exists(status["output_mp4_path"])
    assert os.path.getsize(status["output_mp4_path"]) > 10000
    assert status["thumbnail_path"] is not None
    assert os.path.exists(status["thumbnail_path"])
    assert status["zip_package"] is not None
    assert os.path.exists(status["zip_package"])

    qa = status["qa_report"]
    assert qa["passed"] is True
    print("QA GATE PASSED SUCCESSFULLY!")
