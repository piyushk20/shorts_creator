import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { theme } from "../theme";
import { BgPaper } from "../components/BgPaper";
import { ArchivalAsset } from "../components/ArchivalAsset";
import { SafeZoneCaptions, WordToken } from "../components/SafeZoneCaptions";
import { WashiTape } from "../components/WashiTape";

interface BeatSceneProps {
  tokens: WordToken[];
  brollVideo: string;
}

export const Beat1_MarketTrap: React.FC<BeatSceneProps> = ({
  tokens,
  brollVideo,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance 1: Headline Banner (stagger frame 0)
  const pHead = spring({ frame, fps, config: theme.spring.smooth });
  const headY = interpolate(pHead, [0, 1], [-40, 0]);

  // Entrance 2: Archival Footage Cutout (stagger frame 6)
  const pAsset = spring({ frame: frame - 6, fps, config: theme.spring.smooth });
  const assetScale = interpolate(pAsset, [0, 1], [0.92, 1]);
  const assetOpacity = interpolate(pAsset, [0, 1], [0, 1]);

  // Entrance 3: Volatile Ticker Cards (stagger frame 14)
  const pTicker1 = spring({ frame: frame - 14, fps, config: theme.spring.snappy });
  const pTicker2 = spring({ frame: frame - 20, fps, config: theme.spring.snappy });

  // Entrance 4: Stamped TRAP Seal (stagger frame 28)
  const pStamp = spring({ frame: frame - 28, fps, config: theme.spring.bouncy });
  const stampScale = interpolate(pStamp, [0, 1], [2.2, 1]);
  const stampRot = interpolate(pStamp, [0, 1], [-30, -12]);

  // Idle breathing oscillation
  const breath = Math.sin(frame / 20) * 3;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <BgPaper accentTint={theme.colors.vermilion} />

      {/* Top Header Section */}
      <div
        style={{
          position: "absolute",
          top: 90,
          left: 60,
          right: 60,
          opacity: pHead,
          transform: `translateY(${headY}px)`,
          zIndex: 30,
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: theme.colors.vermilion,
            color: "#FFFFFF",
            fontFamily: theme.fonts.mono,
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: 3,
            padding: "6px 18px",
            borderRadius: 4,
            marginBottom: 16,
            boxShadow: theme.shadows.stamp,
          }}
        >
          ● WALL STREET ILLUSION
        </div>

        <h1
          style={{
            fontFamily: theme.fonts.display,
            fontSize: 78,
            fontWeight: 900,
            color: theme.colors.inkBlack,
            margin: 0,
            lineHeight: 1.05,
            letterSpacing: -1.5,
            textTransform: "uppercase",
          }}
        >
          THE STOCK <br />
          <span style={{ color: theme.colors.vermilion }}>PICKING TRAP</span>
        </h1>
      </div>

      {/* Center Archival Asset Cutout */}
      <div
        style={{
          position: "absolute",
          top: 410,
          left: 80,
          opacity: assetOpacity,
          transform: `scale(${assetScale}) translateY(${breath}px)`,
          zIndex: 20,
        }}
      >
        <ArchivalAsset
          videoSrc={brollVideo}
          tilt={-1.8}
          width={920}
          height={680}
          label="NYSE FLOOR / ACTIVE TRADING"
        />
      </div>

      {/* Floating Collage Ticker Elements */}
      <div
        style={{
          position: "absolute",
          top: 1110,
          left: 80,
          display: "flex",
          gap: 20,
          zIndex: 25,
        }}
      >
        {/* Ticker 1: Green Winning Illusion */}
        <div
          style={{
            opacity: pTicker1,
            transform: `translateY(${interpolate(pTicker1, [0, 1], [30, 0])}px) rotate(-2deg)`,
            backgroundColor: theme.colors.cardBg,
            padding: "16px 24px",
            borderRadius: 6,
            boxShadow: theme.shadows.paperLight,
            borderLeft: `6px solid ${theme.colors.emeraldGreen}`,
            position: "relative",
          }}
        >
          <WashiTape top={-12} left={16} width={70} height={24} rotation={4} />
          <span style={{ fontFamily: theme.fonts.mono, fontSize: 18, color: theme.colors.slateText }}>
            SPECULATION
          </span>
          <div style={{ fontFamily: theme.fonts.display, fontSize: 32, fontWeight: 900, color: theme.colors.emeraldGreen }}>
            NVDA +4.2%
          </div>
        </div>

        {/* Ticker 2: Red Reality */}
        <div
          style={{
            opacity: pTicker2,
            transform: `translateY(${interpolate(pTicker2, [0, 1], [30, 0])}px) rotate(3deg)`,
            backgroundColor: theme.colors.cardBg,
            padding: "16px 24px",
            borderRadius: 6,
            boxShadow: theme.shadows.paperLight,
            borderLeft: `6px solid ${theme.colors.vermilion}`,
            position: "relative",
          }}
        >
          <WashiTape top={-12} right={16} width={70} height={24} rotation={-5} />
          <span style={{ fontFamily: theme.fonts.mono, fontSize: 18, color: theme.colors.slateText }}>
            AFTER FEES
          </span>
          <div style={{ fontFamily: theme.fonts.display, fontSize: 32, fontWeight: 900, color: theme.colors.vermilion }}>
            PORTFOLIO -6.8%
          </div>
        </div>
      </div>

      {/* Stamped Red Ink [TRAP] Seal */}
      <div
        style={{
          position: "absolute",
          top: 980,
          right: 90,
          opacity: pStamp,
          transform: `scale(${stampScale}) rotate(${stampRot}deg)`,
          zIndex: 35,
          border: `5px double ${theme.colors.vermilion}`,
          padding: "12px 28px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          color: theme.colors.vermilion,
          fontFamily: theme.fonts.display,
          fontSize: 38,
          fontWeight: 900,
          letterSpacing: 3,
          boxShadow: theme.shadows.stamp,
          borderRadius: 4,
        }}
      >
        ALMOST NO ONE BEATS IT
      </div>

      {/* Word-level captions anchored in bottom safe zone */}
      <SafeZoneCaptions tokens={tokens} />
    </AbsoluteFill>
  );
};
