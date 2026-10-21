import os
import uuid
import subprocess
import requests
import hashlib
from typing import List, Dict, Any, Optional
from backend.app.core.config import settings
from backend.app.schemas.render import AssetCandidate
from backend.app.services.scrapling_crawler import scrapling_crawler

from backend.app.core.security import is_safe_url, sanitize_safe_id

class BRollEngine:
    MAX_DOWNLOAD_BYTES = 150 * 1024 * 1024  # 150 MB safety cap

    def __init__(self):
        self.stock_dir = os.path.join(settings.STORAGE_DIR, "stock_library")
        self.cache_dir = os.path.join(self.stock_dir, "cache")
        os.makedirs(self.stock_dir, exist_ok=True)
        os.makedirs(self.cache_dir, exist_ok=True)

    def get_cached_asset_path(self, url: str) -> Optional[str]:
        url_hash = hashlib.md5(url.encode("utf-8")).hexdigest()
        cache_path = os.path.join(self.cache_dir, f"{url_hash}.mp4")
        if os.path.exists(cache_path) and os.path.getsize(cache_path) > 1024:
            return cache_path
        return None

    def download_asset_on_demand(self, url: str) -> str:
        """
        Lazy downloader: Downloads the full MP4 ONLY when the scene is approved
        or rendering starts. Checks local MD5 cache first.
        Hardened against SSRF and excessive resource consumption.
        """
        if not url:
            return ""

        # Validate URL safety to prevent SSRF
        if not is_safe_url(url):
            print(f"[BRollEngine SECURITY] Blocked potentially unsafe or internal URL: {url}")
            return ""

        cached_path = self.get_cached_asset_path(url)
        if cached_path:
            return cached_path

        url_hash = hashlib.md5(url.encode("utf-8")).hexdigest()
        dest_path = os.path.join(self.cache_dir, f"{url_hash}.mp4")
        temp_dest = os.path.join(self.cache_dir, f"{url_hash}.tmp")

        try:
            import urllib.parse
            print(f"[BRollEngine] Downloading approved asset: {url}")
            current_url = url
            max_redirects = 5
            redirect_count = 0
            session = requests.Session()
            session.headers.update({"User-Agent": "CreatorFlow-Studio/1.0 (+https://creatorflow.studio)"})

            r = None
            while redirect_count <= max_redirects:
                if not is_safe_url(current_url):
                    print(f"[BRollEngine SECURITY] Blocked redirect to unsafe URL: {current_url}")
                    return ""

                r = session.get(current_url, stream=True, timeout=25, allow_redirects=False)
                if r.is_redirect or r.status_code in (301, 302, 303, 307, 308):
                    location = r.headers.get("Location")
                    if not location:
                        return ""
                    current_url = urllib.parse.urljoin(current_url, location)
                    redirect_count += 1
                    continue
                break

            if not r:
                return ""
            r.raise_for_status()

            # Check Content-Length header if available
            content_length = r.headers.get("content-length")
            if content_length and int(content_length) > self.MAX_DOWNLOAD_BYTES:
                print(f"[BRollEngine SECURITY] Download exceeds size limit of {self.MAX_DOWNLOAD_BYTES} bytes: {content_length}")
                return ""

            downloaded_bytes = 0
            with open(temp_dest, "wb") as f:
                for chunk in r.iter_content(chunk_size=65536):
                    if chunk:
                        downloaded_bytes += len(chunk)
                        if downloaded_bytes > self.MAX_DOWNLOAD_BYTES:
                            print(f"[BRollEngine SECURITY] Download exceeded size limit mid-stream: {downloaded_bytes} bytes")
                            f.close()
                            if os.path.exists(temp_dest):
                                os.remove(temp_dest)
                            return ""
                        f.write(chunk)

            if os.path.exists(temp_dest) and os.path.getsize(temp_dest) > 1024:
                if os.path.exists(dest_path):
                    os.remove(dest_path)
                os.rename(temp_dest, dest_path)
                return dest_path
        except Exception as e:
            print(f"[BRollEngine] Error downloading asset '{url}': {e}")
            if os.path.exists(temp_dest):
                try:
                    os.remove(temp_dest)
                except Exception:
                    pass

        return ""

    async def search_candidates(
        self,
        scene_id: str,
        queries: List[str],
        script_context: str = "",
        aspect_ratio: str = "9:16",
        min_duration: float = 4.0,
        limit: int = 8
    ) -> List[AssetCandidate]:
        candidates: List[AssetCandidate] = []

        # 1. Pexels API (if configured)
        if settings.PEXELS_API_KEY:
            try:
                pexels_results = self._search_pexels(queries, aspect_ratio)
                candidates.extend(pexels_results)
            except Exception as e:
                print(f"[BRollEngine] Pexels search failed: {e}")

        # 2. Pixabay API (if configured)
        if settings.PIXABAY_API_KEY:
            try:
                pixabay_results = self._search_pixabay(queries, aspect_ratio)
                candidates.extend(pixabay_results)
            except Exception as e:
                print(f"[BRollEngine] Pixabay search failed: {e}")

        # 3. Scrapling Crawler (Mixkit verified copyright-free footage with streamable thumbnails)
        try:
            crawled_results = scrapling_crawler.search_best_candidates(
                queries=queries,
                script_context=script_context,
                limit=limit
            )
            candidates.extend(crawled_results)
        except Exception as e:
            print(f"[BRollEngine] Scrapling crawler search failed: {e}")

        # 4. Fallback to local verified synthetic HD clips if needed
        if len(candidates) < 2:
            local_candidates = self._generate_or_get_local_candidates(queries, aspect_ratio, min_duration)
            candidates.extend(local_candidates)

        # 5. Rank and score candidates
        ranked_candidates = self._rank_candidates(candidates, queries, min_duration)
        return ranked_candidates[:limit]

    def _rank_candidates(self, candidates: List[AssetCandidate], queries: List[str], min_duration: float) -> List[AssetCandidate]:
        scored = []
        for idx, c in enumerate(candidates):
            semantic = 0.95 if any(q.lower() in c.source_url.lower() for q in queries) else 0.85
            visual = 0.90 if c.orientation == "vertical" else 0.80
            technical = 0.95 if (c.width and c.width >= 1080) else 0.85
            duration_score = 0.95 if (c.duration and c.duration >= min_duration) else 0.80
            diversity = max(0.5, 1.0 - (idx * 0.08))

            total_score = (
                0.45 * semantic +
                0.25 * visual +
                0.15 * technical +
                0.10 * duration_score +
                0.05 * diversity
            )
            c.relevance_score = round(total_score, 3)
            c.score_breakdown = {
                "semantic": round(semantic, 2),
                "visual": round(visual, 2),
                "technical": round(technical, 2),
                "duration": round(duration_score, 2),
                "diversity": round(diversity, 2)
            }
            scored.append(c)

        scored.sort(key=lambda x: x.relevance_score, reverse=True)
        return scored

    def _search_pexels(self, queries: List[str], aspect_ratio: str) -> List[AssetCandidate]:
        results = []
        headers = {"Authorization": settings.PEXELS_API_KEY}
        orientation = "portrait" if aspect_ratio == "9:16" else "landscape"
        
        for q in queries[:2]:
            url = f"https://api.pexels.com/videos/search?query={q}&orientation={orientation}&per_page=3"
            res = requests.get(url, headers=headers, timeout=10)
            if res.status_code == 200:
                data = res.json()
                for v in data.get("videos", []):
                    files = v.get("video_files", [])
                    best_file = next((f for f in files if f.get("quality") == "hd"), files[0] if files else None)
                    if best_file:
                        results.append(AssetCandidate(
                            id=f"pexels-{v['id']}",
                            provider="pexels",
                            provider_asset_id=str(v["id"]),
                            source_url=v.get("url", f"https://www.pexels.com/video/{v['id']}"),
                            preview_url=v.get("image"),
                            download_url=best_file.get("link"),
                            creator=v.get("user", {}).get("name", "Pexels Creator"),
                            width=best_file.get("width"),
                            height=best_file.get("height"),
                            duration=float(v.get("duration", 5.0)),
                            orientation="vertical" if aspect_ratio == "9:16" else "landscape",
                            license_type="Pexels License (Free Commercial Use)",
                            rights_status="VERIFIED_FOR_INTENDED_USE"
                        ))
        return results

    def _search_pixabay(self, queries: List[str], aspect_ratio: str) -> List[AssetCandidate]:
        results = []
        for q in queries[:2]:
            url = f"https://pixabay.com/api/videos/?key={settings.PIXABAY_API_KEY}&q={q}&per_page=3"
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                data = res.json()
                for hit in data.get("hits", []):
                    videos = hit.get("videos", {})
                    v_info = videos.get("medium") or videos.get("large") or videos.get("small")
                    if v_info:
                        results.append(AssetCandidate(
                            id=f"pixabay-{hit['id']}",
                            provider="pixabay",
                            provider_asset_id=str(hit["id"]),
                            source_url=hit.get("pageURL", "https://pixabay.com"),
                            preview_url=hit.get("userImageURL"),
                            download_url=v_info.get("url"),
                            creator=hit.get("user", "Pixabay Contributor"),
                            width=v_info.get("width"),
                            height=v_info.get("height"),
                            duration=float(hit.get("duration", 5.0)),
                            orientation="landscape",
                            license_type="Pixabay Content License",
                            rights_status="VERIFIED_FOR_INTENDED_USE"
                        ))
        return results

    def _generate_or_get_local_candidates(
        self,
        queries: List[str],
        aspect_ratio: str,
        duration: float = 6.0
    ) -> List[AssetCandidate]:
        candidates = []
        width = 1080 if aspect_ratio == "9:16" else 1920
        height = 1920 if aspect_ratio == "9:16" else 1080

        presets = [
            ("cinematic_dark", "0x0f172a", "0x1e293b", "0x38bdf8"),
            ("golden_hour", "0x1c1917", "0x451a03", "0xf59e0b"),
            ("electric_violet", "0x09090b", "0x3b0764", "0xa855f7")
        ]

        for idx, (theme_name, c1, c2, c3) in enumerate(presets):
            asset_filename = f"broll_{theme_name}_{aspect_ratio.replace(':', 'x')}.mp4"
            asset_path = os.path.join(self.stock_dir, asset_filename)

            if not os.path.exists(asset_path):
                self._render_synthetic_clip(asset_path, width, height, duration, c1, c2, c3, queries[0] if queries else "STUDIO")

            if os.path.exists(asset_path):
                candidates.append(AssetCandidate(
                    id=f"local-{theme_name}-{idx}",
                    provider="local_studio",
                    provider_asset_id=f"stock-{theme_name}",
                    source_url=f"file:///{asset_path.replace(os.sep, '/')}",
                    download_url=f"file:///{asset_path.replace(os.sep, '/')}",
                    creator="CreatorFlow Studio Media Engine",
                    width=width,
                    height=height,
                    duration=duration,
                    orientation="vertical" if aspect_ratio == "9:16" else "landscape",
                    license_type="CreatorFlow Studio Creative Commons CC0",
                    rights_status="VERIFIED_FOR_INTENDED_USE"
                ))

        return candidates

    def _render_synthetic_clip(
        self,
        output_path: str,
        width: int,
        height: int,
        duration: float,
        color1: str,
        color2: str,
        accent: str,
        label: str
    ):
        ffmpeg_bin = settings.FFMPEG_PATH
        filter_str = (
            f"color=c={color1}:s={width}x{height}:d={duration}:r=30,"
            f"geq=r='(sin(2*PI*(X/W+T/5))+1)*60':"
            f"g='(cos(2*PI*(Y/H+T/4))+1)*40':"
            f"b='(sin(2*PI*(X/W+Y/H+T/3))+1)*80',"
            f"format=yuv420p"
        )
        cmd = [
            ffmpeg_bin,
            "-y",
            "-f", "lavfi",
            "-i", filter_str,
            "-t", str(duration),
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-preset", "veryfast",
            output_path
        ]
        try:
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        except Exception as e:
            print(f"[BRollEngine] Error generating synthetic clip: {e}")

broll_engine = BRollEngine()
