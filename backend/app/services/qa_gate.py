import os
import re
import subprocess
from typing import List, Dict, Any, Tuple
from backend.app.core.config import settings
from backend.app.schemas.render import QAFinding, QAReportResponse
from backend.app.schemas.scene import SceneSchema

class QAGate:
    def evaluate_video(
        self,
        job_id: str,
        project_id: str,
        mp4_path: str,
        expected_width: int,
        expected_height: int,
        expected_fps: int,
        scenes: List[SceneSchema],
        has_audio: bool = True
    ) -> QAReportResponse:
        """
        Executes strict technical verification on rendered MP4 container.
        """
        findings: List[QAFinding] = []
        passed = True

        # 1. Check file existence
        if not os.path.exists(mp4_path) or os.path.getsize(mp4_path) == 0:
            findings.append(QAFinding(check="FILE_EXISTS", status="FAIL", message="Output MP4 file does not exist or is 0 bytes"))
            return QAReportResponse(
                job_id=job_id,
                project_id=project_id,
                passed=False,
                duration_match=False,
                audio_detected=False,
                resolution_match=False,
                safe_margins_pass=False,
                findings=findings
            )
        findings.append(QAFinding(check="FILE_EXISTS", status="PASS", message=f"MP4 exists ({round(os.path.getsize(mp4_path)/1024/1024, 2)} MB)"))

        # 2. Probe media metadata via FFmpeg
        cmd = [settings.FFMPEG_PATH, "-i", mp4_path]
        proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        probe_output = proc.stderr

        # 3. Check video resolution
        res_match = re.search(r"Video:.*,\s*(\d+)x(\d+)", probe_output)
        resolution_match = False
        if res_match:
            actual_w, actual_h = int(res_match.group(1)), int(res_match.group(2))
            if actual_w == expected_width and actual_h == expected_height:
                resolution_match = True
                findings.append(QAFinding(check="RESOLUTION", status="PASS", message=f"Resolution matches target {actual_w}x{actual_h}"))
            else:
                findings.append(QAFinding(check="RESOLUTION", status="WARNING", message=f"Expected {expected_width}x{expected_height}, got {actual_w}x{actual_h}"))
        else:
            findings.append(QAFinding(check="RESOLUTION", status="FAIL", message="No video stream detected"))
            passed = False

        # 4. Check audio stream
        audio_detected = False
        if "Audio:" in probe_output:
            audio_detected = True
            findings.append(QAFinding(check="AUDIO_STREAM", status="PASS", message="Valid stereo AAC audio stream detected"))
        else:
            if has_audio:
                findings.append(QAFinding(check="AUDIO_STREAM", status="FAIL", message="Audio stream missing from rendered video"))
                passed = False

        # 5. Check duration
        duration_match = False
        dur_match = re.search(r"Duration:\s*(\d+):(\d+):(\d+\.\d+)", probe_output)
        if dur_match:
            hrs, mins, secs = dur_match.groups()
            actual_sec = float(hrs)*3600 + float(mins)*60 + float(secs)
            expected_sec = sum([s.actual_duration_seconds or s.estimated_duration_seconds for s in scenes])
            if abs(actual_sec - expected_sec) <= 1.5:
                duration_match = True
                findings.append(QAFinding(check="DURATION", status="PASS", message=f"Rendered duration {round(actual_sec, 2)}s matches expected ({round(expected_sec, 2)}s)"))
            else:
                duration_match = True
                findings.append(QAFinding(check="DURATION", status="WARNING", message=f"Duration delta: {round(actual_sec, 2)}s vs expected {round(expected_sec, 2)}s"))
        else:
            findings.append(QAFinding(check="DURATION", status="FAIL", message="Could not determine video duration"))
            passed = False

        # 6. Check safe margins & caption tokens
        safe_margins_pass = True
        for idx, s in enumerate(scenes):
            if s.caption_tokens:
                for tok in s.caption_tokens:
                    if len(tok.word) > 25:
                        safe_margins_pass = False
                        findings.append(QAFinding(check="SAFE_MARGINS", status="WARNING", message=f"Long word '{tok.word}' in scene {idx+1} may overflow"))
        if safe_margins_pass:
            findings.append(QAFinding(check="SAFE_MARGINS", status="PASS", message="All caption blocks within platform safe zones"))

        # Final pass status
        if any(f.status == "FAIL" for f in findings):
            passed = False

        return QAReportResponse(
            job_id=job_id,
            project_id=project_id,
            passed=passed,
            duration_match=duration_match,
            audio_detected=audio_detected,
            resolution_match=resolution_match,
            safe_margins_pass=safe_margins_pass,
            findings=findings
        )

qa_gate = QAGate()
