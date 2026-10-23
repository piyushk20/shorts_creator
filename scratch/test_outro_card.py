import os
import subprocess
from backend.app.core.config import settings
from backend.app.core.security import escape_ffmpeg_path

ffmpeg = settings.FFMPEG_PATH
video = r'storage/projects/f49a45ab-a869-4457-992e-e8201f79ec96/renders/job-e692abe0_video_only.mp4'
audio = r'storage/projects/f49a45ab-a869-4457-992e-e8201f79ec96/renders/job-e692abe0_mixed_audio.aac'
ass = r'storage/projects/f49a45ab-a869-4457-992e-e8201f79ec96/captions.ass'
card = r'storage/test/outro_card_test.png'
out = r'storage/test/test_final_with_outro.mp4'

clean_ass = escape_ffmpeg_path(ass)
total_dur = 40.57
start_t = max(0.0, total_dur - 4.5)

filter_complex = (
    f"[2:v]format=rgba,fade=t=in:st={start_t:.2f}:d=0.35:alpha=1[card];"
    f"[0:v][card]overlay=0:0:enable='gte(t,{start_t:.2f})'[v1];"
    f"[v1]ass='{clean_ass}'[v_out]"
)

cmd = [
    ffmpeg, '-y',
    '-i', video,
    '-i', audio,
    '-loop', '1',
    '-i', card,
    '-filter_complex', filter_complex,
    '-map', '[v_out]',
    '-map', '1:a',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '48000',
    '-ac', '2',
    '-shortest',
    '-t', str(total_dur),
    '-movflags', '+faststart',
    out
]

print("Running test overlay...")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Exit code:", res.returncode)
if res.returncode != 0:
    print("Stderr:", res.stderr[-500:])
else:
    print("Success! File size:", os.path.getsize(out))
