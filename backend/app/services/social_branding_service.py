"""
CreatorFlow AI Studio - Social Branding & Outro Configuration Service
Persists and manages user social media handles (Twitter, Facebook, Instagram, YouTube, Reddit, TikTok, LinkedIn)
for automated on-screen watermarks and final-frame CTA cards.
"""

import os
import json
from typing import Dict, Any, List, Optional
from backend.app.core.config import settings

DEFAULT_SOCIAL_BRANDING = {
    "active_platform": "facebook",
    "handle": "Shelf Wisdom",
    "cta_text": "follow and like for more",
    "auto_apply_outro": True,
    "position": "bottom_card",  # bottom_card, watermark, top_badge
    "platforms": [
        {
            "id": "facebook",
            "name": "Facebook",
            "handle": "Shelf Wisdom",
            "cta_text": "follow and like for more",
            "color": "#1877F2",
            "accent_bg": "rgba(24, 119, 242, 0.08)",
            "prefix": "facebook : ",
            "placeholder": "e.g. Shelf Wisdom",
            "recommended_cta": "follow and like for more"
        },
        {
            "id": "twitter",
            "name": "Twitter / X",
            "handle": "@ShelfWisdom",
            "cta_text": "follow on X for daily drops",
            "color": "#0F172A",
            "accent_bg": "rgba(15, 23, 42, 0.08)",
            "prefix": "x : ",
            "placeholder": "e.g. @ShelfWisdom",
            "recommended_cta": "follow on X for daily drops"
        },
        {
            "id": "instagram",
            "name": "Instagram",
            "handle": "@shelf.wisdom",
            "cta_text": "follow on Instagram for more reels",
            "color": "#E1306C",
            "accent_bg": "rgba(225, 48, 108, 0.08)",
            "prefix": "insta : ",
            "placeholder": "e.g. @shelf.wisdom",
            "recommended_cta": "follow on Instagram for more reels"
        },
        {
            "id": "youtube",
            "name": "YouTube",
            "handle": "@ShelfWisdom",
            "cta_text": "subscribe for more deep dives",
            "color": "#FF0000",
            "accent_bg": "rgba(255, 0, 0, 0.08)",
            "prefix": "youtube : ",
            "placeholder": "e.g. @ShelfWisdom",
            "recommended_cta": "subscribe for more deep dives"
        },
        {
            "id": "reddit",
            "name": "Reddit",
            "handle": "r/ShelfWisdom",
            "cta_text": "join the discussion on Reddit",
            "color": "#FF4500",
            "accent_bg": "rgba(255, 69, 0, 0.08)",
            "prefix": "reddit : ",
            "placeholder": "e.g. r/ShelfWisdom",
            "recommended_cta": "join the discussion on Reddit"
        },
        {
            "id": "tiktok",
            "name": "TikTok",
            "handle": "@shelf.wisdom",
            "cta_text": "follow on TikTok for quick wisdom",
            "color": "#00F2FE",
            "accent_bg": "rgba(0, 242, 254, 0.08)",
            "prefix": "tiktok : ",
            "placeholder": "e.g. @shelf.wisdom",
            "recommended_cta": "follow on TikTok for quick wisdom"
        },
        {
            "id": "linkedin",
            "name": "LinkedIn",
            "handle": "company/shelf-wisdom",
            "cta_text": "connect on LinkedIn for analysis",
            "color": "#0A66C2",
            "accent_bg": "rgba(10, 102, 194, 0.08)",
            "prefix": "linkedin : ",
            "placeholder": "e.g. company/shelf-wisdom",
            "recommended_cta": "connect on LinkedIn for analysis"
        }
    ]
}


class SocialBrandingService:
    def __init__(self):
        self.settings_dir = os.path.join(settings.STORAGE_DIR, "settings")
        self.config_path = os.path.join(self.settings_dir, "social_branding.json")
        os.makedirs(self.settings_dir, exist_ok=True)
        if not os.path.exists(self.config_path):
            self._save(DEFAULT_SOCIAL_BRANDING)

    def _save(self, data: Dict[str, Any]):
        try:
            with open(self.config_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"[SocialBrandingService] Error saving config: {e}")

    def get_branding(self) -> Dict[str, Any]:
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    # Ensure all platforms exist
                    if "platforms" not in data or not data["platforms"]:
                        data["platforms"] = DEFAULT_SOCIAL_BRANDING["platforms"]
                    return data
            except Exception as e:
                print(f"[SocialBrandingService] Error reading config: {e}")
        return DEFAULT_SOCIAL_BRANDING

    def update_branding(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        current = self.get_branding()
        for key in ["active_platform", "handle", "cta_text", "auto_apply_outro", "position"]:
            if key in payload:
                current[key] = payload[key]

        if "platforms" in payload and isinstance(payload["platforms"], list):
            current["platforms"] = payload["platforms"]

        # Also sync active platform's handle and cta_text into the platforms list
        active_id = current.get("active_platform", "facebook")
        for p in current.get("platforms", []):
            if p.get("id") == active_id:
                if "handle" in payload:
                    p["handle"] = payload["handle"]
                if "cta_text" in payload:
                    p["cta_text"] = payload["cta_text"]

        self._save(current)
        return current


social_branding_service = SocialBrandingService()
