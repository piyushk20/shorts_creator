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
5. **Always Update Trending Topics Before Every Search**: Ensure trending topics, metrics (views, upvotes, volume, HN points), and viral signals across platforms are refreshed before initiating every new search or ideation session.


## 🎬 Video Pipeline Stable Baseline
- **Backend Port**: `8002` (`python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8002`)
- **Frontend Port**: `5174` (Vite dev server)
- **Stock Footage Engine**: Mixkit direct CC0 720p stream integration with automated keyword expansion
- **Audio Codec**: Native 48kHz stereo AAC with dynamic -14dB BGM ducking
- **FFmpeg Concat**: Re-encoded with `setpts=PTS-STARTPTS` and `libx264 -preset veryfast -pix_fmt yuv420p -r 30` to prevent player freezing
- **Safe Zone**: 360px bottom safe zone for word-level karaoke subtitles

## 🎨 Vox-Style Video Creation Protocol (MANDATORY)

Whenever asked to create a **Vox-style video** or explainer:
1. **Engine Requirement**: Always use **Remotion** (`remotion-motion-graphics`, `remotion-markup`, `remotion-render`) for composition and animation.
2. **Motion Graphics First (Tactile Vox Aesthetic)**:
   - Construct the authentic 5-layer Vox visual stack: *Background paper/kraft mesh → B-Roll/Archival assets → Layered torn paper collage & type → Color grade → Halftone print grain & vignette*.
   - Use spring-based animations (`spring()`, never linear `interpolate()`), multi-property entrances (opacity + translateY + scale), and staggered 3–6 frame offsets.
   - Include tactile paper cut-outs, drop shadows, translucent masking tape corners, stamped arrows, and bold Swiss/grotesque typographic callouts.
   - Apply Ken Burns pan/zoom to still elements and loop idle motion.
3. **Plan & Details Review Gate**:
   - Present a comprehensive, structured plan before rendering:
     - **Visual Theme & Palette**: Colors, typography, paper grain texture.
     - **Story Arc & Beat Breakdown**: Timed scenes, narration lines, on-screen text.
     - **Remotion Composition Layout**: Component tree, spring presets, transitions.
     - **B-Roll & Graphic Assets**: Planned footage, archival clips, collage elements.
4. **User Confirmation Gate**:
   - Explicitly ask for user confirmation/approval:
     *"Here is the detailed Vox-style Remotion plan. Please confirm if this looks good or let me know if you'd like any adjustments before I generate the video output."*
   - **Never render or execute the final video output automatically without user confirmation.**
5. **Execute on Confirmation**:
   - Once confirmed, build the Remotion composition, verify frames, render the output MP4, and deliver the streaming/download links.

