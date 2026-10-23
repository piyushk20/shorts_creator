import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.core.config import settings
from backend.app.core.database import engine, Base
from backend.app.api.projects import router as projects_router
from backend.app.api.trends import router as trends_router
from backend.app.api.tools import router as tools_router
from backend.app.api.vox import router as vox_router
from backend.app.api.media import router as media_router
from backend.app.api.clips import router as clips_router

# Auto create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="AI-Powered Video Automation Studio for YouTube Shorts, Instagram Reels & Landscape Videos"
)

# CORS Configuration - Restricted to Local Development Studio
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://localhost:8002",
        "http://127.0.0.1:8002"
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)

# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Mount media storage for browser streaming & thumbnail display
app.mount("/storage", StaticFiles(directory=settings.STORAGE_DIR), name="storage")

# Mount API
app.include_router(projects_router)
app.include_router(trends_router)
app.include_router(tools_router)
app.include_router(vox_router)
app.include_router(media_router)
app.include_router(clips_router)

@app.get("/health")
def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "renderer": settings.RENDERER_BACKEND,
        "tts": settings.TTS_PROVIDER,
        "llm": settings.LLM_PROVIDER
    }

# If frontend build exists, mount it
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "frontend", "dist")
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
