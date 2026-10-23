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

    def generate_outro_card_png(
        self,
        output_path: str,
        width: int = 1080,
        height: int = 1920
    ) -> Optional[str]:
        """
        Renders a transparent RGBA PNG image containing the user's active social branding card
        positioned safely above subtitles for automated outro burning in the last frames.
        """
        try:
            from PIL import Image, ImageDraw, ImageFont

            branding = self.get_branding()
            if not branding.get("auto_apply_outro", True):
                return None

            active_id = branding.get("active_platform", "twitter").lower()
            handle = branding.get("handle") or "@piyushk20"
            cta_raw = branding.get("cta_text") or "follow and like for more"

            # Clean CTA: strip unsupported unicode and uppercase
            clean_cta = "".join([c for c in cta_raw if ord(c) < 128]).strip().upper()
            if not clean_cta:
                clean_cta = "FOLLOW AND LIKE FOR MORE"

            # Match active platform configuration
            platform_meta = {
                "twitter": {"prefix": "x : ", "color": (15, 23, 42, 255), "symbol": "X"},
                "facebook": {"prefix": "facebook : ", "color": (24, 119, 242, 255), "symbol": "f"},
                "instagram": {"prefix": "insta : ", "color": (225, 48, 108, 255), "symbol": "IG"},
                "youtube": {"prefix": "youtube : ", "color": (255, 0, 0, 255), "symbol": "PLAY"},
                "reddit": {"prefix": "reddit : ", "color": (255, 69, 0, 255), "symbol": "r/"},
                "tiktok": {"prefix": "tiktok : ", "color": (15, 23, 42, 255), "symbol": "TIK"},
                "linkedin": {"prefix": "linkedin : ", "color": (10, 102, 194, 255), "symbol": "in"}
            }
            meta = platform_meta.get(active_id, platform_meta["twitter"])
            prefix = meta["prefix"]
            badge_color = meta["color"]
            symbol = meta["symbol"]

            # Canvas setup
            img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)

            # Proportional sizing
            is_vertical = height > width
            if is_vertical:
                card_w = min(int(width * 0.88), 940)
                card_h = 230
                card_x = (width - card_w) // 2
                # Sit above the bottom 360px safe zone and subtitles
                card_y = int(height * 0.60)
            else:
                card_w = min(int(width * 0.55), 900)
                card_h = 200
                card_x = (width - card_w) // 2
                card_y = int(height * 0.70)

            # Drop shadow
            draw.rounded_rectangle(
                [card_x + 10, card_y + 12, card_x + card_w + 10, card_y + card_h + 12],
                radius=18,
                fill=(0, 0, 0, 110)
            )

            # Card main white background with tactile dark slate border
            draw.rounded_rectangle(
                [card_x, card_y, card_x + card_w, card_y + card_h],
                radius=18,
                fill=(255, 255, 255, 255),
                outline=(15, 23, 42, 255),
                width=5
            )

            # Washi tape accents
            tape_color = (238, 232, 218, 240)
            draw.rectangle([card_x + 40, card_y - 12, card_x + 160, card_y + 12], fill=tape_color)
            draw.rectangle([card_x + card_w - 160, card_y - 12, card_x + card_w - 40, card_y + 12], fill=tape_color)

            # Platform circle badge
            badge_size = 114
            badge_x = card_x + 36
            badge_y = card_y + (card_h - badge_size) // 2
            draw.ellipse([badge_x, badge_y, badge_x + badge_size, badge_y + badge_size], fill=badge_color)

            # Fonts
            try:
                font_large = ImageFont.truetype("arialbd.ttf", 50)
                font_cta = ImageFont.truetype("arialbd.ttf", 30)
                font_logo = ImageFont.truetype("arialbd.ttf", 64 if len(symbol) <= 2 else 40)
            except Exception:
                font_large = font_cta = font_logo = ImageFont.load_default()

            # Center symbol in badge
            s_bbox = draw.textbbox((0, 0), symbol, font=font_logo)
            s_w = s_bbox[2] - s_bbox[0]
            s_h = s_bbox[3] - s_bbox[1]
            draw.text((badge_x + (badge_size - s_w) // 2, badge_y + (badge_size - s_h) // 2 - 4), symbol, fill=(255, 255, 255, 255), font=font_logo)

            # CTA text (crimson / rose vibrant accent)
            draw.text((card_x + 180, card_y + 36), clean_cta, fill=(225, 29, 72, 255), font=font_cta)

            # Prefix
            draw.text((card_x + 180, card_y + 108), prefix, fill=(15, 23, 42, 255), font=font_large)

            # Pill badge for handle with clean contrast
            prefix_bbox = draw.textbbox((card_x + 180, card_y + 108), prefix, font=font_large)
            handle_bbox = draw.textbbox((0, 0), handle, font=font_large)
            handle_w = handle_bbox[2] - handle_bbox[0]

            pill_x1 = prefix_bbox[2] + 12
            pill_y1 = card_y + 98
            pill_x2 = min(pill_x1 + handle_w + 36, card_x + card_w - 20)
            pill_y2 = pill_y1 + 72

            draw.rounded_rectangle([pill_x1, pill_y1, pill_x2, pill_y2], radius=14, fill=(241, 245, 249, 255), outline=(203, 213, 225, 255), width=3)
            draw.text((pill_x1 + 18, card_y + 108), handle, fill=(15, 23, 42, 255), font=font_large)

            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            img.save(output_path, "PNG")
            return output_path

        except Exception as e:
            print(f"[SocialBrandingService] Error generating outro card: {e}")
            return None


social_branding_service = SocialBrandingService()

