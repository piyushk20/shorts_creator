# Master Implementation Plan: CreatorFlow AI Studio

## Objectives
Deliver a functioning, production-ready script-to-video studio with real integrations, persistent state, media rendering, error handling, and verified exports.

## Execution Phases

### Phase 0: Workspace & Dependency Audit [COMPLETED]
- Operating System: Windows 11 (pwsh).
- Runtimes verified: Python 3.14.4, Node.js v22.22.2, npm 11.15.0.
- FFmpeg: Version 7.1 located at `C:\Python314\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe`.
- HyperFrames CLI: Verified at version `0.8.174` via npx.
- Edge-TTS: Installed and verified.
- Ports planned: Backend on 8002, Frontend on 5174.

### Phase 1: Foundation & Data Architecture
- Initialize directory structure (`backend`, `frontend`, `storage`, `shared`).
- Setup SQLite database with SQLAlchemy 2.0 ORM:
  - Models: `Project`, `ScriptRevision`, `Scene`, `Asset`, `AssetProvenance`, `RenderJob`, `QAReport`.
- Implement Pydantic V2 schemas: `ProjectCreate`, `SceneSchema`, `TimelineSchema`, `JobStatus`.
- FastAPI application scaffolding with CORS, static mounts, and error handling.

### Phase 2: Provider-Independent Script Engine
- LLM engine service with provider interfaces:
  - OpenAI / Ollama / Gemini / Fallback Rule-Based Generation Engine.
  - Script structure: Hook options (3 variations) -> Setup -> Main points -> Climax/Payoff -> Outro/CTA.
  - Scene JSON schema validation.
  - Scene revision management and user approval locks.

### Phase 3: Intelligent B-Roll Engine & Provenance
- Stock API service:
  - Pexels Video Search API integration.
  - Pixabay Video API integration.
  - Synthetic HD motion B-roll generator for offline/unconfigured environments.
- Relevance ranking algorithm:
  - Multi-query formulation per scene (subject, action, cinematic metaphor).
  - Score = 0.45 semantic + 0.25 visual + 0.15 tech quality + 0.10 duration + 0.05 diversity.
- Asset provenance ledger:
  - Provider, original URL, creator, license terms, attribution strings, rights status.
  - Rights verification and reuse history tracking.

### Phase 4: Audio Engine & Synchronized Captions
- Neural TTS generation (Edge-TTS supporting English and Hindi voices).
- Word-boundary timestamp capture with millisecond accuracy.
- Audio mixing: voiceover normalization, background music bed, dynamic ducking (-14dB).
- Caption engine:
  - Word-level highlighting (Karaoke style).
  - Safe margins for 9:16 vertical (Shorts/Reels UI safety padding).
  - SRT and VTT export generation.

### Phase 5: Rendering Engine & Technical QA Gate
- Modular renderer interface:
  - Frame layout, visual transitions, caption overlays.
  - FFmpeg pipeline: high quality scaling, center crop to 9:16 (1080x1920) or 16:9 (1920x1080), 30fps H.264 + AAC 44.1kHz.
- Technical QA Gate:
  - MP4 readability check.
  - Duration, dimension, framerate, and audio track verification.
  - Safe margin caption bounding check.
  - QA summary report generation.

### Phase 6: Timeline Editor, Export Packaging & Presets
- Full export packaging:
  - Final MP4.
  - High-res cover thumbnail.
  - SRT and VTT subtitle files.
  - `provenance_manifest.json`.
  - Approved script and timeline JSON.
  - QA diagnostic report.
- Platform presets:
  - YouTube Shorts (9:16, 1080x1920, 30fps).
  - Instagram Reels (9:16, 1080x1920, 30fps).
  - YouTube Standard (16:9, 1920x1080, 30fps).

### Phase 7: Frontend Studio Workspace & Verification
- Modern Dark Studio UI built with React + Vite + CSS.
- Screens: Dashboard, Create Wizard, Script Editor & Scene Planner, B-roll Selector, Audio & Caption Settings, Timeline Inspector, Live Render Queue & Progress, Video Player & QA Report, Export Center.
- End-to-end execution and browser verification.

