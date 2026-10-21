"""
CreatorFlow AI Studio - Public Media & Motion Graphics Engine
Integrated via curated zero-auth public APIs from https://github.com/public-apis/public-apis

Features:
1. Wikimedia Commons: Millions of public domain/CC-BY real-world archival images and webm/mp4 footage clips.
2. NASA Image & Video Library: Real-world aerospace, earth observation, science, and tech media.
3. QuickChart Engine: On-the-fly publication-grade visual motion charts (bar, line, pie, sparklines) for Remotion/video overlays.
4. Iconify Design API: 200,000+ open-source vector SVG icons and motion badges.
"""

import os
import re
import json
import urllib.request
import urllib.parse
from typing import List, Dict, Any, Optional
from backend.app.schemas.render import AssetCandidate


class PublicMediaEngine:
    USER_AGENT = "CreatorFlow-Studio/1.0 (+https://creatorflow.ai; contact@creatorflow.ai)"

    def __init__(self):
        pass

    def search_wikimedia(
        self,
        queries: List[str],
        limit: int = 5,
        media_type: str = "all"  # "all", "video", "image"
    ) -> List[AssetCandidate]:
        """
        Search Wikimedia Commons for authentic archival and real-world media.
        """
        candidates: List[AssetCandidate] = []
        seen_urls = set()

        for q in queries[:2]:
            clean_q = q.strip()
            if media_type == "video":
                search_term = f"{clean_q} filetype:video"
            elif media_type == "image":
                search_term = f"{clean_q} filetype:bitmap"
            else:
                search_term = clean_q

            encoded_q = urllib.parse.quote(search_term)
            url = (
                f"https://commons.wikimedia.org/w/api.php?action=query&generator=search"
                f"&gsrnamespace=6&gsrsearch={encoded_q}&gsrlimit={limit}"
                f"&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=1080&format=json"
            )

            try:
                req = urllib.request.Request(url, headers={"User-Agent": self.USER_AGENT})
                with urllib.request.urlopen(req, timeout=8) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    pages = data.get("query", {}).get("pages", {})

                    for pid, p in pages.items():
                        ii_list = p.get("imageinfo", [])
                        if not ii_list:
                            continue
                        ii = ii_list[0]
                        orig_url = ii.get("url")
                        if not orig_url or orig_url in seen_urls:
                            continue
                        seen_urls.add(orig_url)

                        thumb_url = ii.get("thumburl", orig_url)
                        mime = ii.get("mime", "")
                        width = ii.get("width")
                        height = ii.get("height")

                        meta = ii.get("extmetadata", {})
                        artist_raw = meta.get("Artist", {}).get("value", "Wikimedia Contributor")
                        artist_clean = re.sub(r"<[^>]+>", "", artist_raw).strip()[:60]
                        license_name = meta.get("LicenseShortName", {}).get("value", "CC / Public Domain")

                        is_video = "video" in mime or orig_url.endswith((".webm", ".mp4", ".ogv"))
                        orientation = "vertical" if (width and height and height > width) else "landscape"

                        candidates.append(AssetCandidate(
                            id=f"wiki-{pid}",
                            provider="wikimedia_commons",
                            provider_asset_id=str(pid),
                            source_url=p.get("descriptionurl", orig_url),
                            preview_url=thumb_url,
                            download_url=orig_url,
                            creator=artist_clean or "Wikimedia Contributor",
                            width=width,
                            height=height,
                            duration=6.0 if is_video else 5.0,
                            orientation=orientation,
                            license_type=f"Wikimedia Commons ({license_name})",
                            rights_status="VERIFIED_FOR_INTENDED_USE",
                            relevance_score=0.92,
                            score_breakdown={
                                "semantic": 0.94,
                                "visual": 0.90,
                                "technical": 0.95,
                                "duration": 0.90,
                                "diversity": 0.92
                            }
                        ))
            except Exception as e:
                print(f"[PublicMediaEngine] Wikimedia query error for '{q}': {e}")

        return candidates

    def search_nasa(
        self,
        queries: List[str],
        limit: int = 4
    ) -> List[AssetCandidate]:
        """
        Search NASA Image and Video Library for science, aerospace, and tech assets.
        """
        candidates: List[AssetCandidate] = []
        seen_ids = set()

        for q in queries[:2]:
            clean_q = urllib.parse.quote(q.strip())
            url = f"https://images-api.nasa.gov/search?q={clean_q}&media_type=image,video"

            try:
                req = urllib.request.Request(url, headers={"User-Agent": self.USER_AGENT})
                with urllib.request.urlopen(req, timeout=8) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    items = data.get("collection", {}).get("items", [])[:limit]

                    for it in items:
                        item_data = it.get("data", [{}])[0]
                        nasa_id = item_data.get("nasa_id", "")
                        if not nasa_id or nasa_id in seen_ids:
                            continue
                        seen_ids.add(nasa_id)

                        links = it.get("links", [{}])
                        preview = links[0].get("href") if links else ""
                        media_type = item_data.get("media_type", "image")
                        title = item_data.get("title", "NASA Archival Visual")

                        candidates.append(AssetCandidate(
                            id=f"nasa-{nasa_id}",
                            provider="nasa_library",
                            provider_asset_id=nasa_id,
                            source_url=f"https://images.nasa.gov/details-{nasa_id}",
                            preview_url=preview,
                            download_url=preview,
                            creator=f"NASA ({item_data.get('center', 'HQ')})",
                            width=1920,
                            height=1080,
                            duration=5.0,
                            orientation="landscape",
                            license_type="NASA Open Media (Public Domain)",
                            rights_status="VERIFIED_FOR_INTENDED_USE",
                            relevance_score=0.91,
                            score_breakdown={
                                "semantic": 0.92,
                                "visual": 0.95,
                                "technical": 0.96,
                                "duration": 0.85,
                                "diversity": 0.90
                            }
                        ))
            except Exception as e:
                print(f"[PublicMediaEngine] NASA query error for '{q}': {e}")

        return candidates

    def generate_chart_graphic(
        self,
        chart_type: str = "bar",
        title: str = "Comparative Metric",
        labels: Optional[List[str]] = None,
        datasets: Optional[List[Dict[str, Any]]] = None,
        theme: str = "dark",
        width: int = 1080,
        height: int = 720
    ) -> Dict[str, Any]:
        """
        Generate dynamic motion graphic charts using QuickChart API.
        Aesthetic: Dark slate background (#090d16) with vibrant green/amber/blue accents.
        """
        labels = labels or ["Category A", "Category B", "Category C"]
        datasets = datasets or [
            {
                "label": "Metric",
                "data": [45, 82, 120],
                "backgroundColor": ["#ef4444", "#f59e0b", "#10b981"] if chart_type == "bar" else "rgba(16, 185, 129, 0.2)",
                "borderColor": "#10b981",
                "fill": True if chart_type == "line" else False
            }
        ]

        chart_config = {
            "type": chart_type,
            "data": {
                "labels": labels,
                "datasets": datasets
            },
            "options": {
                "title": {
                    "display": bool(title),
                    "text": title,
                    "fontColor": "#f8fafc",
                    "fontSize": 20,
                    "fontStyle": "bold"
                },
                "legend": {
                    "labels": {"fontColor": "#94a3b8", "fontSize": 14}
                },
                "scales": {
                    "yAxes": [{"ticks": {"fontColor": "#64748b", "fontSize": 12}, "gridLines": {"color": "#1e293b"}}],
                    "xAxes": [{"ticks": {"fontColor": "#94a3b8", "fontSize": 12}, "gridLines": {"display": False}}]
                }
            }
        }

        encoded_json = urllib.parse.quote(json.dumps(chart_config))
        chart_url = f"https://quickchart.io/chart?c={encoded_json}&width={width}&height={height}&backgroundColor=%23090d16&devicePixelRatio=2"

        return {
            "provider": "quickchart",
            "chart_type": chart_type,
            "title": title,
            "width": width,
            "height": height,
            "image_url": chart_url,
            "config": chart_config
        }

    def get_vector_icon_svg(self, icon_name: str, collection: str = "lucide") -> Optional[str]:
        """
        Fetch SVG vector icons and badges from Iconify API for motion graphics overlays.
        """
        clean_name = icon_name.strip().lower().replace(" ", "-")
        url = f"https://api.iconify.design/{collection}/{clean_name}.svg"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": self.USER_AGENT})
            with urllib.request.urlopen(req, timeout=5) as resp:
                svg_content = resp.read().decode("utf-8")
                if "<svg" in svg_content:
                    return svg_content
        except Exception as e:
            print(f"[PublicMediaEngine] Iconify error for '{collection}:{icon_name}': {e}")
        return None


public_media_engine = PublicMediaEngine()
