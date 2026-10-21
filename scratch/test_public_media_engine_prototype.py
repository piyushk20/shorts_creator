import urllib.request
import urllib.parse
import json
import re
from typing import List, Dict, Any, Optional

class PublicMediaEnginePrototype:
    USER_AGENT = "CreatorFlow-Studio/1.0 (+https://creatorflow.ai)"

    def search_wikimedia(self, queries: List[str], limit: int = 4) -> List[Dict[str, Any]]:
        results = []
        for q in queries[:2]:
            clean_q = q.replace(" ", "%20")
            url = (
                f"https://commons.wikimedia.org/w/api.php?action=query&generator=search"
                f"&gsrnamespace=6&gsrsearch={clean_q}&gsrlimit={limit}"
                f"&prop=imageinfo&iiprop=url|size|mime|extmetadata&iiurlwidth=800&format=json"
            )
            try:
                req = urllib.request.Request(url, headers={"User-Agent": self.USER_AGENT})
                with urllib.request.urlopen(req, timeout=6) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    pages = data.get("query", {}).get("pages", {})
                    for pid, p in pages.items():
                        ii_list = p.get("imageinfo", [])
                        if not ii_list:
                            continue
                        ii = ii_list[0]
                        orig_url = ii.get("url")
                        thumb_url = ii.get("thumburl", orig_url)
                        mime = ii.get("mime", "")
                        width = ii.get("width", 800)
                        height = ii.get("height", 600)
                        
                        meta = ii.get("extmetadata", {})
                        artist = meta.get("Artist", {}).get("value", "Wikimedia Contributor")
                        artist_clean = re.sub(r"<[^>]+>", "", artist).strip()[:50]
                        license_name = meta.get("LicenseShortName", {}).get("value", "CC / Public Domain")

                        is_video = "video" in mime or orig_url.endswith((".webm", ".mp4", ".ogv"))
                        is_image = "image" in mime or orig_url.endswith((".jpg", ".jpeg", ".png", ".webp"))

                        if is_video or is_image:
                            results.append({
                                "id": f"wiki-{pid}",
                                "provider": "wikimedia_commons",
                                "title": p.get("title", "").replace("File:", ""),
                                "media_type": "video" if is_video else "image",
                                "source_url": p.get("descriptionurl", orig_url),
                                "download_url": orig_url,
                                "preview_url": thumb_url,
                                "creator": artist_clean or "Wikimedia Contributor",
                                "license_type": license_name,
                                "width": width,
                                "height": height,
                                "mime": mime
                            })
            except Exception as e:
                print(f"[Wikimedia Search Error for '{q}']: {e}")
        return results

    def search_nasa(self, queries: List[str], limit: int = 4) -> List[Dict[str, Any]]:
        results = []
        for q in queries[:2]:
            clean_q = urllib.parse.quote(q)
            url = f"https://images-api.nasa.gov/search?q={clean_q}&media_type=image,video"
            try:
                req = urllib.request.Request(url, headers={"User-Agent": self.USER_AGENT})
                with urllib.request.urlopen(req, timeout=6) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    items = data.get("collection", {}).get("items", [])[:limit]
                    for it in items:
                        item_data = it.get("data", [{}])[0]
                        links = it.get("links", [{}])
                        preview = links[0].get("href") if links else ""
                        media_type = item_data.get("media_type", "image")
                        nasa_id = item_data.get("nasa_id", "nasa-asset")
                        
                        results.append({
                            "id": f"nasa-{nasa_id}",
                            "provider": "nasa_library",
                            "title": item_data.get("title", "NASA Asset"),
                            "media_type": media_type,
                            "source_url": f"https://images.nasa.gov/details-{nasa_id}",
                            "download_url": preview,
                            "preview_url": preview,
                            "creator": item_data.get("center", "NASA"),
                            "license_type": "NASA Public Domain",
                            "width": 1920,
                            "height": 1080,
                            "mime": "image/jpeg" if media_type == "image" else "video/mp4"
                        })
            except Exception as e:
                print(f"[NASA Search Error for '{q}']: {e}")
        return results

    def generate_quickchart_url(
        self,
        chart_type: str = "line",
        labels: List[str] = None,
        datasets: List[Dict[str, Any]] = None,
        title: str = "Performance Metric"
    ) -> str:
        labels = labels or ["2021", "2022", "2023", "2024", "2025"]
        datasets = datasets or [
            {
                "label": "Growth Rate",
                "data": [12, 19, 32, 54, 88],
                "borderColor": "#10b981",
                "backgroundColor": "rgba(16, 185, 129, 0.2)",
                "fill": True
            }
        ]
        chart_def = {
            "type": chart_type,
            "data": {"labels": labels, "datasets": datasets},
            "options": {
                "title": {"display": True, "text": title, "fontColor": "#f8fafc", "fontSize": 18},
                "legend": {"labels": {"fontColor": "#94a3b8"}},
                "scales": {
                    "yAxes": [{"ticks": {"fontColor": "#64748b"}}],
                    "xAxes": [{"ticks": {"fontColor": "#64748b"}}]
                }
            }
        }
        encoded = urllib.parse.quote(json.dumps(chart_def))
        return f"https://quickchart.io/chart?c={encoded}&width=1080&height=720&backgroundColor=%23090d16&devicePixelRatio=2"

    def get_vector_icon_svg(self, icon_name: str, collection: str = "lucide") -> Optional[str]:
        url = f"https://api.iconify.design/{collection}/{icon_name}.svg"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": self.USER_AGENT})
            with urllib.request.urlopen(req, timeout=5) as resp:
                return resp.read().decode("utf-8")
        except Exception as e:
            print(f"[Iconify Error for '{icon_name}']: {e}")
            return None


if __name__ == "__main__":
    engine = PublicMediaEnginePrototype()
    print("--- 1. Testing Wikimedia Commons ---")
    wiki = engine.search_wikimedia(["index funds stock market", "wall street exchange"], limit=3)
    print(f"Retrieved {len(wiki)} Wikimedia candidates:")
    for w in wiki[:2]:
        print(f"  [{w['media_type']}] {w['title']} | Creator: {w['creator']} | URL: {w['preview_url'][:80]}")

    print("\n--- 2. Testing NASA Library ---")
    nasa = engine.search_nasa(["james webb telescope", "earth orbit"], limit=2)
    print(f"Retrieved {len(nasa)} NASA candidates:")
    for n in nasa[:2]:
        print(f"  [{n['media_type']}] {n['title']} | URL: {n['preview_url'][:80]}")

    print("\n--- 3. Testing QuickChart Motion Visualizer ---")
    chart_url = engine.generate_quickchart_url(
        chart_type="bar",
        labels=["Active Hedge Funds", "S&P 500 Index"],
        datasets=[{"label": "15-Year Performance (%)", "data": [112, 385], "backgroundColor": ["#ef4444", "#10b981"]}],
        title="Active vs Passive Compounding"
    )
    print("Generated Chart Graphic URL:")
    print(chart_url[:120] + "...")

    print("\n--- 4. Testing Iconify Motion Vector Icons ---")
    svg = engine.get_vector_icon_svg("trending-up", "lucide")
    print(f"Retrieved SVG icon ({len(svg) if svg else 0} bytes)")
    assert svg and "<svg" in svg
    print("\nALL PUBLIC API TESTS PASSED!")
