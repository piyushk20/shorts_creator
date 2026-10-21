"""
CreatorFlow AI Studio - Public Media & Motion Graphics API Router
Provides endpoints to search authentic archival/real-world B-Rolls,
generate custom motion graphic charts, and fetch vector SVG icons
from zero-auth public APIs (Wikimedia Commons, NASA, QuickChart, Iconify).
"""

from fastapi import APIRouter, Query, HTTPException, Response
from typing import Optional, List, Dict, Any
from pydantic import BaseModel

from backend.app.services.public_media_engine import public_media_engine
from backend.app.schemas.render import AssetCandidate

router = APIRouter(prefix="/api/media", tags=["media"])


class ChartGraphicRequest(BaseModel):
    chart_type: str = "bar"  # bar, line, pie, doughnut, radar
    title: str = "Performance Comparison"
    labels: Optional[List[str]] = None
    datasets: Optional[List[Dict[str, Any]]] = None
    theme: str = "dark"
    width: int = 1080
    height: int = 720


@router.get("/sources")
def get_media_sources():
    """Return list of integrated public media and motion graphics providers."""
    return {
        "providers": [
            {
                "name": "Wikimedia Commons",
                "type": "B-Roll & Archival Footage",
                "auth": "None (Zero-Auth)",
                "license": "Public Domain / Creative Commons (CC-BY / CC-BY-SA)",
                "description": "Millions of historical, political, scientific, and cultural photos & video footage clips."
            },
            {
                "name": "NASA Image & Video Library",
                "type": "Space & Science Footage",
                "auth": "None (Zero-Auth)",
                "license": "NASA Public Domain",
                "description": "High-definition space exploration, earth observation, and aerospace engineering footage."
            },
            {
                "name": "QuickChart Engine",
                "type": "Motion Graphics & Data Charts",
                "auth": "None (Zero-Auth)",
                "license": "Open Source",
                "description": "Dynamic animated and high-res vector charts (bar, line, candlestick, sparkline) for video explainers."
            },
            {
                "name": "Iconify Vector Graphics",
                "type": "Motion Design & Vector Assets",
                "auth": "None (Zero-Auth)",
                "license": "Open Source (MIT / Apache)",
                "description": "200,000+ vector SVG icons (Lucide, Material, Phosphor, FontAwesome, Carbon)."
            },
            {
                "name": "Mixkit Direct CC0 Stream",
                "type": "Cinematic Stock Footage",
                "auth": "None (Zero-Auth)",
                "license": "Mixkit CC0 Free Commercial License",
                "description": "Direct 720p/1080p MP4 stock video streams."
            }
        ]
    }


@router.get("/search-public")
def search_public_media(
    query: str = Query(..., description="Search keyword for B-roll or imagery"),
    provider: str = Query("all", description="Provider filter: 'all', 'wikimedia', 'nasa'"),
    media_type: str = Query("all", description="Media type: 'all', 'video', 'image'"),
    limit: int = Query(6, ge=1, le=20, description="Max candidates per provider")
):
    """
    Search across Wikimedia Commons and NASA Library for authentic B-rolls and archival visuals.
    """
    candidates: List[AssetCandidate] = []
    queries = [query]

    if provider in ("all", "wikimedia"):
        wiki_results = public_media_engine.search_wikimedia(queries, limit=limit, media_type=media_type)
        candidates.extend(wiki_results)

    if provider in ("all", "nasa"):
        nasa_results = public_media_engine.search_nasa(queries, limit=limit)
        candidates.extend(nasa_results)

    return {
        "query": query,
        "count": len(candidates),
        "candidates": candidates
    }


@router.post("/chart-graphic")
def generate_chart_graphic(payload: ChartGraphicRequest):
    """
    Generate a bespoke motion graphic chart for Remotion compositions or explainer scenes.
    """
    result = public_media_engine.generate_chart_graphic(
        chart_type=payload.chart_type,
        title=payload.title,
        labels=payload.labels,
        datasets=payload.datasets,
        theme=payload.theme,
        width=payload.width,
        height=payload.height
    )
    return result


@router.get("/icon")
def get_vector_icon(
    name: str = Query(..., description="Icon name (e.g. 'trending-up', 'cpu', 'shield')"),
    collection: str = Query("lucide", description="Icon set: 'lucide', 'material-symbols', 'carbon', 'mdi'")
):
    """
    Fetch an SVG vector icon directly from Iconify for motion graphics elements.
    """
    svg = public_media_engine.get_vector_icon_svg(name, collection=collection)
    if not svg:
        raise HTTPException(status_code=404, detail=f"Icon '{name}' not found in collection '{collection}'")
    return Response(content=svg, media_type="image/svg+xml")
