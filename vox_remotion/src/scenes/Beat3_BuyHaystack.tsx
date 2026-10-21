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

export const Beat3_BuyHaystack: React.FC<BeatSceneProps> = ({
  tokens,
  brollVideo,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance 1: Header (stagger frame 0)
  const pHead = spring({ frame, fps, config: theme.spring.smooth });

  // Entrance 2: John Bogle Quote Card (stagger frame 8)
  const pQuote = spring({ frame: frame - 8, fps, config: theme.spring.smooth });

  // Entrance 3: 1975 Stamp (stagger frame 18)
  const pStamp = spring({ frame: frame - 18, fps, config: theme.spring.bouncy });

  // Entrance 4: Archival Footage (stagger frame 26)
  const pAsset = spring({ frame: frame - 26, fps, config: theme.spring.smooth });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <BgPaper accentTint={theme.colors.royalBlue} />

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
            backgroundColor: theme.colors.royalBlue,
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
          ● THE 1975 BREAKTHROUGH
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
          DON'T FIND THE NEEDLE. <br />
          <span style={{ color: theme.colors.amberGold }}>BUY THE HAYSTACK.</span>
        </h1>
      </div>

      {/* John Bogle Quote Card */}
      <div
        style={{
          position: "absolute",
          top: 380,
          left: 80,
          right: 80,
          backgroundColor: theme.colors.cardBg,
          padding: "32px 36px",
          borderRadius: 6,
          boxShadow: theme.shadows.paperCut,
          transform: `translateY(${interpolate(pQuote, [0, 1], [30, 0])}px) rotate(-1.5deg)`,
          opacity: pQuote,
          zIndex: 25,
          borderLeft: `10px solid ${theme.colors.royalBlue}`,
        }}
      >
        <WashiTape top={-14} left={30} rotation={-4} width={100} />
        <WashiTape top={-12} right={40} rotation={3} width={110} />

        <p
          style={{
            fontFamily: theme.fonts.serif,
            fontSize: 34,
            fontStyle: "italic",
            color: theme.colors.inkBlack,
            lineHeight: 1.35,
            margin: 0,
          }}
        >
          "Don't look for the needle in the haystack. Just buy the entire haystack."
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 20,
            borderTop: "1px dashed rgba(0,0,0,0.12)",
            paddingTop: 14,
          }}
        >
          <span
            style={{
              fontFamily: theme.fonts.display,
              fontSize: 22,
              fontWeight: 800,
              color: theme.colors.inkBlack,
              letterSpacing: 1,
            }}
          >
            — JOHN C. BOGLE
          </span>
          <span
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: 18,
              color: theme.colors.royalBlue,
              fontWeight: 700,
            }}
          >
            FOUNDER OF VANGUARD
          </span>
        </div>
      </div>

      {/* Center Archival Asset Cutout */}
      <div
        style={{
          position: "absolute",
          top: 730,
          left: 80,
          opacity: interpolate(pAsset, [0, 1], [0, 1]),
          transform: `scale(${interpolate(pAsset, [0, 1], [0.94, 1])}) rotate(1.2deg)`,
          zIndex: 20,
        }}
      >
        <ArchivalAsset
          videoSrc={brollVideo}
          tilt={-1.2}
          width={920}
          height={610}
          label="FIRST INDEX INVESTMENT TRUST / 1975"
        />
      </div>

      {/* 1975 Stamped Badge */}
      <div
        style={{
          position: "absolute",
          top: 670,
          right: 90,
          opacity: pStamp,
          transform: `scale(${interpolate(pStamp, [0, 1], [1.8, 1])}) rotate(12deg)`,
          zIndex: 35,
          backgroundColor: theme.colors.amberGold,
          color: "#FFFFFF",
          padding: "10px 24px",
          fontFamily: theme.fonts.display,
          fontSize: 26,
          fontWeight: 900,
          letterSpacing: 2,
          borderRadius: 4,
          boxShadow: theme.shadows.stamp,
        }}
      >
        EST. 1975
      </div>

      {/* Word-level captions anchored in bottom safe zone */}
      <SafeZoneCaptions tokens={tokens} />
    </AbsoluteFill>
  );
};
