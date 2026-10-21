"""
CreatorFlow AI Studio - Trend Discovery API Router
Provides endpoints to fetch trending categories and discover top 5-6 verified trending topics
with cross-source corroboration and real engagement metrics.
"""

from fastapi import APIRouter, Query, HTTPException, Depends
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import json
import uuid

from backend.app.core.database import get_db
from backend.app.services.trend_discovery import trend_discovery_service
from backend.app.models.project import Project, ScriptRevision, Scene
from backend.app.services.llm_engine import llm_engine
from backend.app.services.project_storage import project_storage

router = APIRouter(prefix="/api/trends", tags=["trends"])


@router.get("/categories")
def get_categories():
    """Return all supported topic categories (AI, Sports, Literature, Politics, War, Tech, Finance, Crypto, Books, etc.)."""
    return trend_discovery_service.get_categories()


@router.get("/discover")
def discover_trends(
    category: str = Query("all", description="Category ID to search (ai, sports, literature, politics, war, etc.)"),
    query: Optional[str] = Query(None, description="Optional custom search query within the domain"),
    refresh: bool = Query(True, description="Whether to force-refresh trending topics before searching")
):
    """
    Return the top 5-6 highest-engagement stories/topics in the selected category.
    Updates trending topics dynamically before returning results on every new search.
    Ranked strictly by verified real engagement (upvotes, HN points, Polymarket volume, YouTube views).
    """
    # Always refresh on any new search query or when refresh flag is set
    should_refresh = True if query or refresh else False
    topics = trend_discovery_service.update_and_get_trending_topics(
        category=category,
        custom_query=query,
        force_refresh=should_refresh
    )
    return {
        "category": category,
        "query": query,
        "refreshed": True,
        "count": len(topics),
        "topics": topics
    }



@router.post("/launch-project")
async def launch_project_from_trend(
    payload: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Directly initialize a project and generate a tailored production script from a selected trending card.
    """
    topic_id = payload.get("topic_id")
    category = payload.get("category", "all")
    
    # Locate topic metadata
    topics = trend_discovery_service.get_trending_topics(category=category)
    selected = next((t for t in topics if t.get("id") == topic_id), None)
    if not selected:
        all_topics = trend_discovery_service.get_trending_topics(category="all")
        selected = next((t for t in all_topics if t.get("id") == topic_id), None)

    title = payload.get("title") or (selected["title"] if selected else "Trending Video Production")
    suggested_hook = payload.get("suggested_hook") or (selected["suggested_hook"] if selected else "")
    suggested_angle = payload.get("suggested_angle") or (selected["suggested_angle"] if selected else "")
    platform = payload.get("platform", "youtube_shorts")
    aspect_ratio = payload.get("aspect_ratio", "9:16")
    target_duration = payload.get("target_duration", 45)
    voice = payload.get("voice", "en-US-ChristopherNeural")
    voice_style = payload.get("voice_style", "energetic")
    visual_style = payload.get("visual_style", "cinematic")
    caption_style = payload.get("caption_style", "word_highlight")
    language = payload.get("language", "en")

    width, height = 1080, 1920
    if aspect_ratio == "16:9":
        width, height = 1920, 1080
    elif aspect_ratio == "1:1":
        width, height = 1080, 1080

    clean_brief = f"{title} — {suggested_angle}" if suggested_angle else title
    prompt_topic = f"{title}. Angle: {suggested_angle}. Hook: {suggested_hook}" if suggested_hook else title

    # Generate script using LLM Engine
    script_data = await llm_engine.generate_script(
        topic=prompt_topic,
        target_duration=target_duration,
        language=language,
        platform=platform,
        visual_style=visual_style
    )

    project_id = str(uuid.uuid4())
    new_project = Project(
        id=project_id,
        title=title,
        topic=clean_brief,
        platform=platform,
        aspect_ratio=aspect_ratio,
        width=width,
        height=height,
        fps=30,
        target_duration=target_duration,
        language=language,
        voice=voice,
        voice_style=voice_style,
        visual_style=visual_style,
        caption_style=caption_style,
        status="SCRIPT_REVIEW"
    )
    db.add(new_project)

    scenes_dict = [s.model_dump() for s in script_data.scenes]
    rev = ScriptRevision(
        id=str(uuid.uuid4()),
        project_id=project_id,
        revision_number=1,
        hook_options_json=json.dumps(script_data.hook_options),
        recommended_hook=script_data.recommended_hook or suggested_hook,
        full_script=script_data.full_script,
        scenes_data_json=json.dumps(scenes_dict),
        is_approved=False
    )
    db.add(rev)

    db_scenes = []
    for s in script_data.scenes:
        db_s = Scene(
            id=s.scene_id,
            project_id=project_id,
            order=s.order,
            role=s.role,
            narration=s.narration,
            estimated_duration=s.estimated_duration_seconds,
            visual_description=s.visual_description,
            search_queries_json=json.dumps(s.search_queries),
            on_screen_text=s.on_screen_text,
            caption_style=s.caption_style,
            review_status=s.review_status
        )
        db.add(db_s)
        db_scenes.append(s)

    db.commit()

    # Initialize dedicated project folder where final output videos & deliverables are stored
    storage_info = project_storage.init_project_folder(
        project_id=new_project.id,
        title=new_project.title,
        metadata={"topic": clean_brief, "platform": platform, "duration": target_duration}
    )

    return {
        "success": True,
        "project_id": new_project.id,
        "output_directory": storage_info["output_dir"],
        "project": {
            "id": new_project.id,
            "title": new_project.title,
            "topic": new_project.topic,
            "platform": new_project.platform,
            "aspect_ratio": new_project.aspect_ratio,
            "status": new_project.status,
            "scenes_count": len(db_scenes)
        }
    }
