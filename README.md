# CreatorFlow AI Studio 🎬
> Autonomous AI-Powered Video Automation Studio for YouTube Shorts, Instagram Reels & Landscape Videos

CreatorFlow AI Studio is a production-oriented platform that transforms user topics, ideas, or scripts into fully rendered, captioned, audio-mixed, and quality-verified 9:16 vertical Shorts/Reels or 16:9 standard videos.

---

## 🌟 Architecture & Core Capabilities

- **Provider-Independent Script Generation**: Formulates structured scene plans (Hook -> Setup -> Main Content -> Climax/Payoff -> Outro) with 3 viral hook variations, estimated durations, on-screen text, and search queries. Strict Pydantic V2 JSON schema validation.
- **Neural Voiceover & Word-Level Timestamps**: Microsoft Edge Neural TTS integration supporting natural voices across English and Hindi (`en-US-ChristopherNeural`, `en-US-AriaNeural`, `hi-IN-MadhurNeural`, `hi-IN-SwaraNeural`) with sub-second word boundary capture.
- **Dynamic Word-Highlighted Captions**: Karaoke-style active word highlighting (yellow active word, bold font, black outline) positioned safely away from platform UI elements (Shorts/Reels action buttons and sound titles). Generates `.srt`, `.vtt`, and `.ass` subtitles.
- **Intelligent B-Roll & Rights Provenance**: Multi-query search via Pexels and Pixabay APIs, weighted relevance scoring (`0.45 * semantic + 0.25 * visual + 0.15 * technical + 0.10 * duration + 0.05 * diversity`), license provenance manifest (`provenance_manifest.json`), and verified local HD motion video generation.
- **Composite Rendering Engine**: FFmpeg 7.1 compositing with aspect-ratio conformance (smart center crop to 1080×1920 or 1920×1080), 30fps H.264 video, burned subtitles, and dynamic audio ducking (-14dB background attenuation under narration).
- **Automated Technical QA Gate**: Objective verification of container readability, target resolution, stereo AAC audio streams, duration delta matching, and safe margin bounds before marking `READY_FOR_REVIEW`.
- **Complete Export Packaging**: One-click download of the final MP4, high-res cover thumbnail, `.srt` captions, `.vtt` captions, `timeline.json`, and `provenance_manifest.json` bundled in a production `.zip` package.

---

## 🚀 Quick Start (Windows PowerShell)

### 1. Prerequisites
- **Python**: 3.11+ (Python 3.14 verified)
- **Node.js**: v18+ (Node v22 verified)
- **FFmpeg**: Bundled and auto-detected via `imageio-ffmpeg`

### 2. Backend Setup & Launch
```powershell
# Navigate to project directory
cd c:\Users\HP\shortscreator

# Install Python requirements
python -m pip install fastapi uvicorn sqlalchemy pydantic pydantic-settings edge-tts requests pillow pytest

# Start Backend Server (runs on Port 8002)
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8002 --reload
```
*Health Check*: `http://127.0.0.1:8002/health` returns `{ "status": "ok", "app": "CreatorFlow AI Studio" }`

### 3. Frontend Setup & Launch
```powershell
# Navigate to frontend directory
cd c:\Users\HP\shortscreator\frontend

# Install dependencies (first time only)
npm install

# Option A: Start Vite Dev Server (Port 5174 with hot-reload)
npm run dev

# Option B: Or open the unified production app at http://127.0.0.1:8002/
npm run build
```

---

## 🧪 Automated Test Suite

Run the verified test suite verifying the script engine, neural audio synthesis, word-level token capture, and captions:

```powershell
# Run unit & integration tests
python -m pytest backend/tests/test_pipeline.py -v

# Run full end-to-end rendering pipeline test (renders real 1080x1920 MP4 & runs QA gate)
python -m pytest backend/tests/test_end_to_end_render.py -s -v
```

### Verified Test Results
```text
backend/tests/test_pipeline.py::test_llm_script_generation PASSED        [ 33%]
backend/tests/test_pipeline.py::test_audio_synthesis_and_word_tokens PASSED [ 66%]
backend/tests/test_pipeline.py::test_caption_generation PASSED           [100%]
backend/tests/test_end_to_end_render.py::test_full_pipeline_render PASSED [100%]
```

---

## ⚙️ Configuration (.env)

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend listening port | `8002` |
| `LLM_PROVIDER` | LLM backend (`openai`, `gemini`, `ollama`, `fallback`) | `fallback` |
| `OPENAI_API_KEY` | OpenAI API key (optional) | `""` |
| `PEXELS_API_KEY` | Pexels video search API key (optional) | `""` |
| `PIXABAY_API_KEY` | Pixabay video search API key (optional) | `""` |
| `TTS_PROVIDER` | Voice engine (`edge`, `openai`) | `edge` |
| `DEFAULT_VOICE_EN`| English neural voice | `en-US-ChristopherNeural` |
| `DEFAULT_VOICE_HI`| Hindi neural voice | `hi-IN-MadhurNeural` |
| `RENDERER_BACKEND`| Composition backend (`hyperframes`, `ffmpeg`) | `hyperframes` |

---

## 📦 Export Package Contents
Each completed production generates:
1. `final_video.mp4` — High-definition 1080×1920 30fps H.264/AAC.
2. `cover_thumbnail.jpg` — High-resolution frame capture.
3. `captions.srt` — Standard timestamped subtitles.
4. `captions.vtt` — WebVTT subtitles.
5. `timeline.json` — Scene-by-scene timing and asset mappings.
6. `provenance_manifest.json` — Rights, licenses, source URLs, and author attribution.
7. `qa_report.json` — Technical validation findings (resolution, audio, safe margins).
8. `<Title>_export.zip` — Complete self-contained production bundle.

---

## 🛡️ License & Provenance Policy
Assets retrieved via Pexels or Pixabay are tagged with their respective content licenses. Synthetic motion clips generated by CreatorFlow Studio are designated **Creative Commons CC0**. No unlicensed copyrighted material is bundled or used.
