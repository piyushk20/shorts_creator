# CreatorFlow AI Studio & Content Automation Rules

## 🎯 Topic Discovery & Ideation Protocol (MANDATORY)

Whenever initiating topic exploration, research, or content creation:
1. **Always Surface Top 10 Trending Topics**: Present exactly 10 high-engagement, real-world trending topics from the last 30 days (spanning Reddit, X, YouTube, Polymarket, Hacker News, GitHub, etc.) cleared by cross-platform corroboration and real metrics (views, upvotes, volume, HN points).
2. **Format Requirement**:
   **Trending Topics with High Real Engagement (Last 30 Days)**
   1. [Short 2–6 word topic name] — [1-sentence why it's hot + key engagement signal]
   ...
   10. [Short 2–6 word topic name] — [1-sentence why it's hot + key engagement signal]
3. **User Selection Gate**: Always end with the prompt:
   *"Reply with the number of the topic/domain you want to explore (or type a custom domain). I will then show you the top 5–6 highest-engagement stories/posts inside that domain."*
4. **Never Dive In Automatically**: Wait for the user's explicit selection before generating scripts, deep-dives, or video rendering.

## 🎬 Video Pipeline Stable Baseline
- **Backend Port**: `8002` (`python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8002`)
- **Frontend Port**: `5174` (Vite dev server)
- **Stock Footage Engine**: Mixkit direct CC0 720p stream integration with automated keyword expansion
- **Audio Codec**: Native 48kHz stereo AAC with dynamic -14dB BGM ducking
- **FFmpeg Concat**: Re-encoded with `setpts=PTS-STARTPTS` and `libx264 -preset veryfast -pix_fmt yuv420p -r 30` to prevent player freezing
- **Safe Zone**: 360px bottom safe zone for word-level karaoke subtitles
