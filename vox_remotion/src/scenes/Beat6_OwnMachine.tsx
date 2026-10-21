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

export const Beat6_OwnMachine: React.FC<BeatSceneProps> = ({
  tokens,
  brollVideo,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance 1: Header
  const pHead = spring({ frame, fps, config: theme.spring.smooth });

  // Entrance 2: Payoff Callout Card (stagger frame 8)
  const pCard = spring({ frame: frame - 8, fps, config: theme.spring.smooth });

  // Entrance 3: Golden Seal Stamp (stagger frame 18)
  const pSeal = spring({ frame: frame - 18, fps, config: theme.spring.bouncy });

  // Entrance 4: Archival Asset (stagger frame 26)
  const pAsset = spring({ frame: frame - 26, fps, config: theme.spring.smooth });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <BgPaper accentTint={theme.colors.emeraldGreen} />

      {/* Top Header */}
      <div
        style={{
          position: "absolute",
          top: 90,
          left: 60,
          right: 60,
          opacity: pHead,
          zIndex: 30,
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: theme.colors.emeraldGreen,
            color: "#FFFFFF",
            fontFamily: theme.fonts.mono,
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: 3,
            padding: "6px 18px",
            borderRadius: 4,
            marginBottom: 16,
          }}
        >
          ● THE WINNING FORMULA
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
          DON'T PREDICT. <br />
          <span style={{ color: theme.colors.emeraldGreen }}>OWN THE MACHINE.</span>
        </h1>
      </div>

      {/* Takeaway Card */}
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 80,
          right: 80,
          backgroundColor: theme.colors.cardBg,
          padding: "32px 36px",
          borderRadius: 8,
          boxShadow: theme.shadows.paperCut,
          opacity: pCard,
          transform: `translateY(${interpolate(pCard, [0, 1], [30, 0])}px) rotate(-1.2deg)`,
          zIndex: 25,
          borderLeft: `10px solid ${theme.colors.emeraldGreen}`,
        }}
      >
        <WashiTape top={-14} left={30} rotation={-4} width={100} />
        <WashiTape top={-12} right={40} rotation={3} width={110} />

        <div
          style={{
            fontFamily: theme.fonts.display,
            fontSize: 36,
            fontWeight: 900,
            color: theme.colors.inkBlack,
            lineHeight: 1.25,
            textTransform: "uppercase",
          }}
        >
          SIMPLICITY BEATS ACTIVE TRADING
        </div>

        <p
          style={{
            fontFamily: theme.fonts.mono,
            fontSize: 22,
            color: theme.colors.slateText,
            marginTop: 14,
            marginBottom: 0,
            lineHeight: 1.5,
          }}
        >
          When you buy an index fund, you harness capitalism's compounding engine. 
          No stock picking. Near-zero fees. Unbeatable math.
        </p>
      </div>

      {/* Center Archival Asset Cutout */}
      <div
        style={{
          position: "absolute",
          top: 730,
          left: 80,
          opacity: interpolate(pAsset, [0, 1], [0, 1]),
          transform: `scale(${interpolate(pAsset, [0, 1], [0.94, 1])}) rotate(1.5deg)`,
          zIndex: 20,
        }}
      >
        <ArchivalAsset
          videoSrc={brollVideo}
          tilt={1.5}
          width={920}
          height={610}
          label="THE COMPOUNDING SUMMIT / AMERICAN INNOVATION"
        />
      </div>

      {/* Golden Seal Stamp */}
      <div
        style={{
          position: "absolute",
          top: 670,
          right: 90,
          opacity: pSeal,
          transform: `scale(${interpolate(pSeal, [0, 1], [2.0, 1])}) rotate(-8deg)`,
          zIndex: 35,
          backgroundColor: theme.colors.amberGold,
          color: "#FFFFFF",
          padding: "16px 28px",
          fontFamily: theme.fonts.display,
          fontSize: 26,
          fontWeight: 900,
          letterSpacing: 2,
          borderRadius: 8,
          boxShadow: theme.shadows.stamp,
          border: "4px solid #FFFFFF",
          textAlign: "center",
        }}
      >
        VERIFIED RULE: <br />
        <span style={{ fontSize: 20, fontFamily: theme.fonts.mono }}>BUY & HOLD THE TOTAL MARKET</span>
      </div>

      {/* Word-level captions anchored in bottom safe zone */}
      <SafeZoneCaptions tokens={tokens} />
    </AbsoluteFill>
  );
};
