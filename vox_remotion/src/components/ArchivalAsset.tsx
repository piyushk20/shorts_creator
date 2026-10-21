import React from "react";
import { Img, staticFile, useCurrentFrame, interpolate } from "remotion";
import { theme } from "../theme";
import { WashiTape } from "./WashiTape";

interface ArchivalAssetProps {
  videoSrc: string;
  tilt?: number;
  width?: number;
  height?: number;
  label?: string;
  tapeRotation?: number;
}

export const ArchivalAsset: React.FC<ArchivalAssetProps> = ({
  videoSrc,
  tilt = -1.5,
  width = 920,
  height = 700,
  label = "ARCHIVE FOOTAGE",
  tapeRotation = 3.5,
}) => {
  const frame = useCurrentFrame();

  // Ken Burns subtle push-in (1.0 -> 1.08)
  const scale = interpolate(frame, [0, 240], [1.0, 1.07], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const panY = interpolate(frame, [0, 240], [0, -15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        transform: `rotate(${tilt}deg)`,
        backgroundColor: theme.colors.cardBg,
        padding: "16px 16px 40px 16px",
        boxShadow: theme.shadows.paperCut,
        borderRadius: 4,
      }}
    >
      {/* Top Left Washi Tape */}
      <WashiTape top={-14} left={28} rotation={tapeRotation} />
      {/* Top Right Washi Tape */}
      <WashiTape top={-12} right={32} rotation={-tapeRotation * 1.2} />

      {/* Clipped Media Frame */}
      <div
        style={{
          width: "100%",
          height: height - 56,
          overflow: "hidden",
          borderRadius: 2,
          backgroundColor: "#18181B",
          position: "relative",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${scale}) translateY(${panY}px)`,
          }}
        >
          <Img
            src={staticFile(videoSrc.endsWith(".mp4") ? videoSrc.replace(".mp4", ".jpg") : videoSrc)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "contrast(1.08) saturate(0.85) brightness(0.96)",
            }}
          />
        </div>

        {/* Vintage Film Overlay / Vignette within the cutout */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.35) 100%)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Archival Newspaper Caption Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 10,
          paddingLeft: 6,
          paddingRight: 6,
        }}
      >
        <span
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 20,
            letterSpacing: 2,
            color: theme.colors.inkBlack,
            fontWeight: 700,
            textTransform: "uppercase",
          }}
        >
          ● {label}
        </span>
        <span
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 18,
            color: theme.colors.slateText,
            letterSpacing: 1,
          }}
        >
          FIG. REF / 01
        </span>
      </div>
    </div>
  );
};
