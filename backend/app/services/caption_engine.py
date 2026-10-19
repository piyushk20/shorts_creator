from typing import List, Dict, Any, Optional
from backend.app.schemas.scene import SceneSchema, CaptionWordToken
from backend.app.core.security import safe_subtitle_text

class CaptionEngine:
    def generate_srt(self, scenes: List[SceneSchema], output_path: str):
        """
        Generates standard SRT subtitles file from scenes and word tokens.
        """
        srt_entries = []
        global_time = 0.0
        counter = 1

        for scene in scenes:
            scene_duration = scene.actual_duration_seconds or scene.estimated_duration_seconds
            tokens = scene.caption_tokens
            if not tokens:
                start_str = self._format_timestamp_srt(global_time)
                end_str = self._format_timestamp_srt(global_time + scene_duration)
                safe_narr = safe_subtitle_text(scene.narration)
                srt_entries.append(f"{counter}\n{start_str} --> {end_str}\n{safe_narr}\n")
                counter += 1
            else:
                chunk_size = 4
                for i in range(0, len(tokens), chunk_size):
                    chunk = tokens[i:i+chunk_size]
                    c_start = global_time + chunk[0].start
                    c_end = global_time + chunk[-1].end
                    text = safe_subtitle_text(" ".join([t.word for t in chunk]))
                    srt_entries.append(
                        f"{counter}\n{self._format_timestamp_srt(c_start)} --> {self._format_timestamp_srt(c_end)}\n{text}\n"
                    )
                    counter += 1

            global_time += scene_duration

        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(srt_entries))

    def generate_vtt(self, scenes: List[SceneSchema], output_path: str):
        """
        Generates WebVTT subtitles file.
        """
        vtt_entries = ["WEBVTT\n"]
        global_time = 0.0
        counter = 1

        for scene in scenes:
            scene_duration = scene.actual_duration_seconds or scene.estimated_duration_seconds
            tokens = scene.caption_tokens
            if not tokens:
                start_str = self._format_timestamp_vtt(global_time)
                end_str = self._format_timestamp_vtt(global_time + scene_duration)
                safe_narr = safe_subtitle_text(scene.narration)
                vtt_entries.append(f"{counter}\n{start_str} --> {end_str}\n{safe_narr}\n")
                counter += 1
            else:
                chunk_size = 4
                for i in range(0, len(tokens), chunk_size):
                    chunk = tokens[i:i+chunk_size]
                    c_start = global_time + chunk[0].start
                    c_end = global_time + chunk[-1].end
                    text = safe_subtitle_text(" ".join([t.word for t in chunk]))
                    vtt_entries.append(
                        f"{counter}\n{self._format_timestamp_vtt(c_start)} --> {self._format_timestamp_vtt(c_end)}\n{text}\n"
                    )
                    counter += 1

            global_time += scene_duration

        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(vtt_entries))

    def generate_ass_karaoke(
        self,
        scenes: List[SceneSchema],
        output_path: str,
        video_width: int = 1080,
        video_height: int = 1920,
        position: str = "bottom", # "bottom", "center", "top"
        font_name: str = "Arial Black",
        font_size: int = 70,
        highlight_color: str = "&H0000FFFF&", # Yellow BGR
        text_color: str = "&H00FFFFFF&",      # White BGR
        outline_width: int = 6
    ):
        """
        Generates Advanced SubStation Alpha (.ass) file with word-highlighting.
        Positioned in the BOTTOM SAFE ZONE (MarginV = 360px on 1080x1920 vertical)
        so it stays above the platform caption/audio title bar and clear of like/comment buttons.
        """
        # Determine alignment and vertical margin
        if position == "bottom":
            alignment = 2  # Bottom Center
            margin_v = 360 if video_height >= 1920 else 140
        elif position == "top":
            alignment = 8  # Top Center
            margin_v = 220 if video_height >= 1920 else 80
        else:
            alignment = 5  # Middle Center
            margin_v = 0

        header = f"""[Script Info]
Title: CreatorFlow Styled Captions (MoneyPrinterTurbo Enhanced)
ScriptType: v4.00+
PlayResX: {video_width}
PlayResY: {video_height}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},{text_color},{highlight_color},&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,{outline_width},3,{alignment},80,80,{margin_v},1
Style: Highlight,{font_name},{int(font_size * 1.06)},{highlight_color},{text_color},&H00000000,&H80000000,-1,0,0,0,105,105,0,0,1,{outline_width + 2},4,{alignment},80,80,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
        events = []
        global_time = 0.0

        for scene in scenes:
            scene_duration = scene.actual_duration_seconds or scene.estimated_duration_seconds
            tokens = scene.caption_tokens
            if not tokens:
                s_str = self._format_timestamp_ass(global_time)
                e_str = self._format_timestamp_ass(global_time + scene_duration)
                safe_narr = safe_subtitle_text(scene.narration).upper()
                events.append(f"Dialogue: 0,{s_str},{e_str},Default,,0,0,0,,{safe_narr}")
            else:
                chunk_size = 3
                for i in range(0, len(tokens), chunk_size):
                    chunk = tokens[i:i+chunk_size]
                    for active_idx, target_tok in enumerate(chunk):
                        w_start = global_time + target_tok.start
                        w_end = global_time + target_tok.end
                        
                        styled_words = []
                        for j, tok in enumerate(chunk):
                            w_upper = safe_subtitle_text(tok.word).upper()
                            if j == active_idx:
                                styled_words.append(r"{\c&H0022FF&\fscx112\fscy112}" + w_upper + r"{\r}")
                            else:
                                styled_words.append(r"{\c&HFFFFFF&}" + w_upper + r"{\r}")
                        
                        line_text = " ".join(styled_words)
                        events.append(
                            f"Dialogue: 0,{self._format_timestamp_ass(w_start)},{self._format_timestamp_ass(w_end)},Default,,0,0,0,,{line_text}"
                        )

            global_time += scene_duration

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(header + "\n".join(events))

    def _format_timestamp_srt(self, seconds: float) -> str:
        hrs = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds - int(seconds)) * 1000)
        return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"

    def _format_timestamp_vtt(self, seconds: float) -> str:
        hrs = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int((seconds - int(seconds)) * 1000)
        return f"{hrs:02d}:{mins:02d}:{secs:02d}.{millis:03d}"

    def _format_timestamp_ass(self, seconds: float) -> str:
        hrs = int(seconds // 3600)
        mins = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        centis = int(((seconds - int(seconds)) * 100))
        return f"{hrs}:{mins:02d}:{secs:02d}.{centis:02d}"

caption_engine = CaptionEngine()
