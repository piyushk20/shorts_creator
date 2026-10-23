import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "CreatorFlow AI Studio"
    APP_ENV: str = "development"
    PORT: int = 8002
    HOST: str = "127.0.0.1"
    DEBUG: bool = True

    STORAGE_DIR: str = str(Path(__file__).resolve().parent.parent.parent.parent / "storage")
    FFMPEG_PATH: str = "C:/Python314/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe"

    LLM_PROVIDER: str = "fallback"  # openai, gemini, ollama, fallback
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o-mini"
    GEMINI_API_KEY: str = ""
    OLLAMA_BASE_URL: str = "http://127.0.0.1:11434"
    OLLAMA_MODEL: str = "llama3.2"

    PEXELS_API_KEY: str = ""
    PIXABAY_API_KEY: str = ""

    TTS_PROVIDER: str = "edge"
    DEFAULT_VOICE_EN: str = "en-US-ChristopherNeural"
    DEFAULT_VOICE_HI: str = "hi-IN-MadhurNeural"

    RENDERER_BACKEND: str = "hyperframes"
    MAX_CONCURRENT_RENDERS: int = 2

    # Cloudflare Workers AI Settings
    CLOUDFLARE_ACCOUNT_ID: str = ""
    CLOUDFLARE_API_TOKEN: str = ""
    CLOUDFLARE_ALT_TOKEN: str = ""

    model_config = {
        "env_file": ".env",
        "extra": "ignore"
    }

settings = Settings()

# Ensure directories exist
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "projects"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "stock_library"), exist_ok=True)
os.makedirs(os.path.join(settings.STORAGE_DIR, "audio_library"), exist_ok=True)
