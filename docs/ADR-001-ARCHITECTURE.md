# Architecture Decision Record (ADR-001)
## System: CreatorFlow AI Studio

### Status
Accepted

### Context
CreatorFlow AI Studio is an enterprise-grade, autonomous video automation platform that converts user topics, ideas, scripts, or media inputs into vertical (9:16) Shorts/Reels and landscape (16:9) YouTube videos.
Key requirements:
- Deterministic job state machine with checkpoint resumption.
- Provider-agnostic LLM script engine with structured JSON scene schema validation.
- Intelligent B-roll search with multi-query generation, relevance scoring, and rights provenance tracking.
- High-fidelity voiceover synthesis with exact word-level timestamp alignment.
- Word-highlighted dynamic captions with safe margin checking.
- Dual-mode video rendering: HTML/CSS composition with HyperFrames + FFmpeg audio-video compositing, scale/crop, ducking, and H.264/AAC encoding.
- Automated technical Quality Assurance (QA) gate before review and export.
- Complete export packaging (MP4, thumbnail, SRT/VTT, provenance manifest, JSON timeline).

### Key Architectural Decisions

1. **Backend Framework: FastAPI (Python 3.14 on Windows)**
   - Asynchronous I/O for API endpoints and background job processing.
   - Pydantic v2 schemas for strict contract validation between pipeline stages.
   - SQLite with SQLAlchemy for local development persistence; zero external database setup required, easy to port to PostgreSQL.
   - Port assigned: `8002` (leaving port 8000 and Saraswati 8001 untouched).

2. **Rendering Engine: HyperFrames + FFmpeg 7.1 Composite Pipeline**
   - HyperFrames (`npx hyperframes`) provides modern HTML/CSS motion graphics, typography, and visual templates.
   - FFmpeg 7.1 (integrated via verified binary `C:\Python314\Lib\site-packages\imageio_ffmpeg\binaries\ffmpeg-win-x86_64-v7.1.exe`) handles hardware-accelerated video scaling (Lanczos/bicubic), smart center/subject cropping (9:16 vertical and 16:9 landscape), audio ducking (-14dB background duck under voiceover), and H.264 / AAC MP4 packaging.
   - A modular `Renderer` abstraction interface (`validate_composition`, `prepare_assets`, `render_composition`, `get_status`) decouples scene definition from the underlying rendering mechanism.

3. **Narration & Timestamp Alignment: Edge-TTS Neural + Alignment Engine**
   - Microsoft Edge Neural TTS provides natural English and Hindi voices (`en-US-ChristopherNeural`, `en-US-AriaNeural`, `hi-IN-MadhurNeural`, `hi-IN-SwaraNeural`) with zero API cost and 100% reliability.
   - Exact word-boundary metadata (timestamped to millisecond precision) is collected during synthesis, guaranteeing perfect word-level caption synchronization without GPU dependency.
   - Uploaded voiceover audio is supported via duration detection and transcription alignment.

4. **Stock Footage & Rights Provenance: Provider-Agnostic Engine**
   - Official Pexels API and Pixabay API integrations with query expansion.
   - Normalized asset records with rights status: `VERIFIED_FOR_INTENDED_USE`, `REQUIRES_REVIEW`, `ATTRIBUTION_REQUIRED`, `RESTRICTED`, `UNKNOWN`.
   - Local fallback media generator ensures the platform is 100% operable even when external stock API keys are not yet configured.
   - Automated export of `provenance_manifest.json` with every rendered project.

5. **Frontend: Modern React + TypeScript + Vite + Premium Studio Theme**
   - Port: `5174` (or served statically via FastAPI `8002`).
   - Dark studio aesthetic with glassmorphism, responsive timeline controls, scene editor, audio mixer, real-time job logs, video preview player, and QA gate reports.
