"""
CreatorFlow AI Studio - Cloudflare Workers AI FLUX.1-Schnell Engine
Generates visually cohesive, matching scene images using Cloudflare Workers AI
and turns static outputs into dynamic, frame-accurate 9:16 or 16:9 video clips
via Ken Burns motion effects.
"""

import os
import base64
import hashlib
import requests
import subprocess
from io import BytesIO
from typing import Dict, Any, List, Optional
from PIL import Image

from backend.app.core.config import settings


class CloudflareFluxImageEngine:
    MODEL = "@cf/black-forest-labs/flux-1-schnell"

    STYLE_PRESETS = {
        "cinematic": (
            "cinematic photorealistic film still, 35mm photograph, soft volumetric film lighting, "
            "realistic textures, highly detailed, 8k, sharp focus, cinematic color grading"
        ),
        "vox_paper_collage": (
            "editorial visual essay illustration, textured paper collage, bold Swiss graphic design, "
            "vintage risograph halftone print, muted duotone palette, tactile paper cutouts"
        ),
        "minimalist": (
            "clean minimalist studio photography, high contrast lighting, elegant geometry, "
            "architectural framing, sophisticated neutral palette, modern aesthetic"
        ),
        "cyberpunk": (
            "cyberpunk aesthetic, vibrant neon reflections, volumetric atmospheric haze, "
            "futuristic technology accents, deep cinematic contrast, 8k octane render"
        ),
        "documentary": (
            "authentic photojournalism documentary style, natural ambient lighting, candid realism, "
            "rich detail, authentic archival film look, high dynamic range"
        ),
        "anime": (
            "modern anime illustration, Makoto Shinkai style, luminous sky, highly detailed scenery, "
            "vibrant studio anime lighting, beautiful color harmony"
        )
    }

    def __init__(self):
        self.account_id = settings.CLOUDFLARE_ACCOUNT_ID
        self.api_token = settings.CLOUDFLARE_API_TOKEN
        self.alt_token = settings.CLOUDFLARE_ALT_TOKEN

    @property
    def is_configured(self) -> bool:
        return bool(self.account_id and (self.api_token or self.alt_token))

    def build_consistent_prompt(
        self,
        scene_description: str,
        visual_style: str = "cinematic",
        style_keywords: Optional[str] = None
    ) -> str:
        """
        Builds a coherent prompt fusing the scene description with a shared
        style anchor to ensure all scene images in a video match aesthetically.
        """
        base_desc = scene_description.strip()
        style_suffix = self.STYLE_PRESETS.get(visual_style.lower(), self.STYLE_PRESETS["cinematic"])
        
        prompt_parts = [base_desc, style_suffix]
        if style_keywords:
            prompt_parts.append(style_keywords.strip())

        return ", ".join(prompt_parts)

    def generate_image_bytes(self, prompt: str, steps: int = 4) -> bytes:
        """
        Calls Cloudflare Workers AI FLUX.1-schnell to generate an image.
        Tries primary token and falls back to alternate token if necessary.
        """
        if not self.is_configured:
            raise RuntimeError(
                "Cloudflare Workers AI is not configured. Please set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in .env"
            )

        url = f"https://api.cloudflare.com/client/v4/accounts/{self.account_id}/ai/run/{self.MODEL}"
        tokens_to_try = [t for t in [self.api_token, self.alt_token] if t]

        payload = {
            "prompt": prompt,
            "steps": min(max(int(steps), 1), 8)
        }

        last_error = None
        for tok in tokens_to_try:
            headers = {
                "Authorization": f"Bearer {tok}",
                "Content-Type": "application/json"
            }
            try:
                res = requests.post(url, headers=headers, json=payload, timeout=60)
                if res.status_code == 200:
                    data = res.json()
                    if data.get("success") and "result" in data and "image" in data["result"]:
                        img_b64 = data["result"]["image"]
                        return base64.b64decode(img_b64)
                    else:
                        last_error = f"Cloudflare API response missing image: {data}"
                else:
                    last_error = f"HTTP {res.status_code}: {res.text}"
            except Exception as e:
                last_error = str(e)

        raise RuntimeError(f"Cloudflare FLUX Generation Failed: {last_error}")

    def format_image_aspect(
        self,
        image_bytes: bytes,
        aspect_ratio: str = "9:16",
        target_width: int = 1080,
        target_height: int = 1920
    ) -> Image.Image:
        """
        Resizes and center-crops the generated image to exactly match the target aspect ratio.
        """
        img = Image.open(BytesIO(image_bytes)).convert("RGB")
        orig_w, orig_h = img.size

        if aspect_ratio == "16:9":
            target_width, target_height = 1920, 1080
        elif aspect_ratio == "1:1":
            target_width, target_height = 1080, 1080

        target_ratio = target_width / target_height
        orig_ratio = orig_w / orig_h

        if orig_ratio > target_ratio:
            # Original is wider than target: crop sides
            new_w = int(orig_h * target_ratio)
            left = (orig_w - new_w) // 2
            img = img.crop((left, 0, left + new_w, orig_h))
        else:
            # Original is taller than target: crop top and bottom
            new_h = int(orig_w / target_ratio)
            top = (orig_h - new_h) // 2
            img = img.crop((0, top, orig_w, top + new_h))

        img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
        return img

    def generate_and_save(
        self,
        prompt: str,
        output_path: str,
        aspect_ratio: str = "9:16",
        steps: int = 4
    ) -> str:
        """
        Generates a FLUX image, formats aspect ratio, and saves as PNG.
        """
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        img_bytes = self.generate_image_bytes(prompt, steps=steps)
        formatted_img = self.format_image_aspect(img_bytes, aspect_ratio=aspect_ratio)
        formatted_img.save(output_path, "PNG", quality=95)
        return output_path

    def animate_image_to_clip(
        self,
        image_path: str,
        output_clip_path: str,
        duration: float,
        aspect_ratio: str = "9:16",
        fps: int = 30,
        motion_preset: str = "slow_zoom_in"
    ) -> str:
        """
        Converts a static FLUX image into a smooth 30fps MP4 video clip
        using FFmpeg's zoompan / Ken Burns pan-zoom filter.
        """
        os.makedirs(os.path.dirname(output_clip_path), exist_ok=True)
        dur = max(2.0, float(duration))
        total_frames = int(dur * fps)

        width, height = 1080, 1920
        if aspect_ratio == "16:9":
            width, height = 1920, 1080
        elif aspect_ratio == "1:1":
            width, height = 1080, 1080

        # Ken Burns Motion Filter presets
        if motion_preset == "slow_zoom_in":
            # Gentle zoom from 1.0 to 1.12 centered
            zoom_expr = f"min(zoom+0.0005,1.12)"
            x_expr = "iw/2-(iw/zoom/2)"
            y_expr = "ih/2-(ih/zoom/2)"
        elif motion_preset == "slow_zoom_out":
            zoom_expr = f"max(1.12-0.0005*on,1.0)"
            x_expr = "iw/2-(iw/zoom/2)"
            y_expr = "ih/2-(ih/zoom/2)"
        elif motion_preset == "pan_up":
            zoom_expr = "1.08"
            x_expr = "iw/2-(iw/zoom/2)"
            y_expr = f"ih/2-(ih/zoom/2)-(on/{total_frames})*(ih*0.06)"
        else:
            zoom_expr = "min(zoom+0.0004,1.10)"
            x_expr = "iw/2-(iw/zoom/2)"
            y_expr = "ih/2-(ih/zoom/2)"

        vf = (
            f"zoompan=z='{zoom_expr}':x='{x_expr}':y='{y_expr}':d={total_frames}:s={width}x{height}:fps={fps},"
            f"format=yuv420p"
        )

        cmd = [
            settings.FFMPEG_PATH,
            "-y",
            "-loop", "1",
            "-i", image_path,
            "-t", str(dur),
            "-vf", vf,
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-pix_fmt", "yuv420p",
            "-r", str(fps),
            "-an",
            output_clip_path
        ]

        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        return output_clip_path


flux_engine = CloudflareFluxImageEngine()
