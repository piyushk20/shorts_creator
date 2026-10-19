import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Project(Base):
    __tablename__ = "projects"

    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    topic = Column(Text, nullable=True)
    platform = Column(String(50), default="youtube_shorts")  # youtube_shorts, instagram_reels, youtube_video
    aspect_ratio = Column(String(20), default="9:16")        # 9:16, 16:9, 1:1
    width = Column(Integer, default=1080)
    height = Column(Integer, default=1920)
    fps = Column(Integer, default=30)
    target_duration = Column(Integer, default=45)
    language = Column(String(10), default="en")
    voice = Column(String(100), default="en-US-ChristopherNeural")
    voice_style = Column(String(50), default="energetic")
    visual_style = Column(String(50), default="cinematic")
    caption_style = Column(String(50), default="word_highlight") # word_highlight, clean_minimal, bold_creator
    status = Column(String(50), default="DRAFT") 
    # DRAFT, SCRIPTING, SCRIPT_REVIEW, ASSET_RETRIEVAL, VOICE_GENERATION, TIMELINE_BUILD, RENDERING, QUALITY_CHECK, READY_FOR_REVIEW, APPROVED, PUBLISHED, FAILED
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    # Relationships
    script_revisions = relationship("ScriptRevision", back_populates="project", cascade="all, delete-orphan")
    scenes = relationship("Scene", back_populates="project", cascade="all, delete-orphan")
    render_jobs = relationship("RenderJob", back_populates="project", cascade="all, delete-orphan")
    provenance_records = relationship("AssetProvenance", back_populates="project", cascade="all, delete-orphan")


class ScriptRevision(Base):
    __tablename__ = "script_revisions"

    id = Column(String(36), primary_key=True, index=True)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    revision_number = Column(Integer, default=1)
    hook_options_json = Column(Text, default="[]")
    recommended_hook = Column(Text, nullable=True)
    full_script = Column(Text, nullable=True)
    scenes_data_json = Column(Text, default="[]")
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utcnow)

    project = relationship("Project", back_populates="script_revisions")


class Scene(Base):
    __tablename__ = "scenes"

    id = Column(String(36), primary_key=True, index=True)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    order = Column(Integer, default=1)
    role = Column(String(50), default="main")  # hook, setup, main, climax, payoff, outro
    narration = Column(Text, nullable=False)
    estimated_duration = Column(Float, default=5.0)
    actual_duration = Column(Float, nullable=True)
    visual_description = Column(Text, nullable=True)
    search_queries_json = Column(Text, default="[]")
    on_screen_text = Column(String(255), nullable=True)
    selected_asset_id = Column(String(36), nullable=True)
    in_point = Column(Float, default=0.0)
    out_point = Column(Float, nullable=True)
    audio_path = Column(String(500), nullable=True)
    caption_tokens_json = Column(Text, default="[]")  # Word-level timestamp tokens
    caption_style = Column(String(50), default="word_highlight")
    review_status = Column(String(50), default="pending")  # pending, approved, locked
    created_at = Column(DateTime, default=utcnow)

    project = relationship("Project", back_populates="scenes")


class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(36), primary_key=True, index=True)
    provider = Column(String(50), nullable=False)  # pexels, pixabay, local, synthetic
    provider_asset_id = Column(String(100), nullable=True)
    source_url = Column(String(500), nullable=True)
    local_path = Column(String(500), nullable=False)
    file_hash = Column(String(64), nullable=True)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    duration = Column(Float, nullable=True)
    orientation = Column(String(20), default="vertical")
    mime_type = Column(String(50), default="video/mp4")
    created_at = Column(DateTime, default=utcnow)


class AssetProvenance(Base):
    __tablename__ = "asset_provenance"

    id = Column(String(36), primary_key=True, index=True)
    asset_id = Column(String(36), ForeignKey("assets.id"), nullable=False)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    scene_id = Column(String(36), nullable=True)
    rights_status = Column(String(50), default="VERIFIED_FOR_INTENDED_USE")
    # VERIFIED_FOR_INTENDED_USE, REQUIRES_REVIEW, ATTRIBUTION_REQUIRED, RESTRICTED, UNKNOWN, REJECTED
    creator = Column(String(255), nullable=True)
    license_type = Column(String(100), default="Creative Commons / Free Commercial")
    license_url = Column(String(500), nullable=True)
    attribution_text = Column(Text, nullable=True)
    retrieved_at = Column(DateTime, default=utcnow)

    project = relationship("Project", back_populates="provenance_records")


class RenderJob(Base):
    __tablename__ = "render_jobs"

    id = Column(String(36), primary_key=True, index=True)
    project_id = Column(String(36), ForeignKey("projects.id"), nullable=False)
    renderer = Column(String(50), default="hyperframes") # hyperframes, ffmpeg
    status = Column(String(50), default="PENDING") 
    # PENDING, IN_PROGRESS, COMPLETED, FAILED, CANCELLED
    progress = Column(Integer, default=0)
    current_stage = Column(String(100), default="INITIALIZING")
    stage_details_json = Column(Text, default="{}")
    output_mp4_path = Column(String(500), nullable=True)
    thumbnail_path = Column(String(500), nullable=True)
    error_message = Column(Text, nullable=True)
    start_time = Column(DateTime, default=utcnow)
    end_time = Column(DateTime, nullable=True)

    project = relationship("Project", back_populates="render_jobs")
    qa_reports = relationship("QAReport", back_populates="job", cascade="all, delete-orphan")


class QAReport(Base):
    __tablename__ = "qa_reports"

    id = Column(String(36), primary_key=True, index=True)
    job_id = Column(String(36), ForeignKey("render_jobs.id"), nullable=False)
    project_id = Column(String(36), nullable=False)
    passed = Column(Boolean, default=False)
    duration_match = Column(Boolean, default=False)
    audio_detected = Column(Boolean, default=False)
    resolution_match = Column(Boolean, default=False)
    safe_margins_pass = Column(Boolean, default=False)
    findings_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=utcnow)

    job = relationship("RenderJob", back_populates="qa_reports")
