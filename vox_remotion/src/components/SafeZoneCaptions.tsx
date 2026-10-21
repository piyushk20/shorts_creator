import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

export interface WordToken {
  word: string;
  start: number;
  end: number;
  start_frame: number;
  end_frame: number;
}

interface SafeZoneCaptionsProps {
  tokens: WordToken[];
}

export const SafeZoneCaptions: React.FC<SafeZoneCaptionsProps> = ({ tokens }) => {
  const frame = useCurrentFrame();

  if (!tokens || tokens.length === 0) return null;

  // Find currently active word
  const activeIndex = tokens.findIndex(
    (t) => frame >= t.start_frame && frame <= t.end_frame
  );

  // Group tokens into windows of 5 words for clean, readable short subtitles
  const currentIndex = activeIndex >= 0 ? activeIndex : 0;
  const windowSize = 5;
  const windowStart = Math.floor(currentIndex / windowSize) * windowSize;
  const currentChunk = tokens.slice(windowStart, windowStart + windowSize);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 150, // Strictly within the 360px bottom safe zone
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 50,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: "12px",
          maxWidth: 960,
          padding: "16px 28px",
          backgroundColor: "rgba(17, 17, 19, 0.88)",
          borderRadius: 18,
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
          backdropFilter: "blur(8px)",
        }}
      >
        {currentChunk.map((token, i) => {
          const isCurrent =
            frame >= token.start_frame && frame <= token.end_frame;
          const isPast = frame > token.end_frame;

          return (
            <span
              key={i}
              style={{
                fontFamily: theme.fonts.display,
                fontSize: 44,
                fontWeight: 900,
                textTransform: "uppercase",
                letterSpacing: 1.5,
                color: isCurrent
                  ? "#FFE600"
                  : isPast
                  ? "#FFFFFF"
                  : "rgba(255, 255, 255, 0.45)",
                backgroundColor: isCurrent ? "rgba(225, 29, 72, 0.95)" : "transparent",
                padding: isCurrent ? "4px 14px" : "4px 4px",
                borderRadius: 8,
                transform: isCurrent ? "scale(1.08)" : "scale(1.0)",
                transition: "all 0.1s ease",
              }}
            >
              {token.word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
