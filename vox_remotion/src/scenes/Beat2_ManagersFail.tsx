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

export const Beat2_ManagersFail: React.FC<BeatSceneProps> = ({
  tokens,
  brollVideo,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance 1: Header
  const pHead = spring({ frame, fps, config: theme.spring.smooth });

  // Entrance 2: Massive 92% Number (stagger frame 8)
  const pCount = spring({ frame: frame - 8, fps, config: theme.spring.bouncy });
  const countVal = Math.min(92, Math.round(interpolate(pCount, [0, 1], [0, 92])));
  const countScale = interpolate(pCount, [0, 1], [0.8, 1]);

  // Entrance 3: Bar chart comparison (stagger frame 18)
  const pBar = spring({ frame: frame - 18, fps, config: theme.spring.smooth });
  const barWidthIndex = interpolate(pBar, [0, 1], [0, 88]);
  const barWidthActive = interpolate(pBar, [0, 1], [0, 8]);

  // Entrance 4: Archival asset (stagger frame 26)
  const pAsset = spring({ frame: frame - 26, fps, config: theme.spring.smooth });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <BgPaper accentTint={theme.colors.amberGold} />

      {/* Top Header */}
      <div
        style={{
          position: "absolute",
          top: 80,
          left: 60,
          right: 60,
          opacity: pHead,
          zIndex: 30,
        }}
      >
        <div
          style={{
            display: "inline-block",
            backgroundColor: theme.colors.amberGold,
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
          ● 15-YEAR EMPIRICAL STUDY
        </div>

        <h1
          style={{
            fontFamily: theme.fonts.display,
            fontSize: 74,
            fontWeight: 900,
            color: theme.colors.inkBlack,
            margin: 0,
            lineHeight: 1.05,
            letterSpacing: -1.5,
            textTransform: "uppercase",
          }}
        >
          THE HARSH REALITY: <br />
          <span style={{ color: theme.colors.vermilion }}>MANAGERS UNDERPERFORM</span>
        </h1>
      </div>

      {/* Big Hero 92% Collage Card */}
      <div
        style={{
          position: "absolute",
          top: 350,
          left: 80,
          right: 80,
          backgroundColor: theme.colors.cardBg,
          padding: "30px 40px",
          borderRadius: 8,
          boxShadow: theme.shadows.paperCut,
          transform: `scale(${countScale}) rotate(-1.5deg)`,
          opacity: pCount,
          zIndex: 25,
          position: "relative",
        }}
      >
        <WashiTape top={-14} left={40} rotation={-3} width={120} />
        <WashiTape top={-12} right={50} rotation={4} width={100} />

        <div style={{ display: "flex", alignItems: "baseline", gap: 20 }}>
          <span
            style={{
              fontFamily: theme.fonts.display,
              fontSize: 160,
              fontWeight: 900,
              color: theme.colors.vermilion,
              lineHeight: 0.9,
              letterSpacing: -6,
            }}
          >
            {countVal}%
          </span>
          <div>
            <div
              style={{
                fontFamily: theme.fonts.display,
                fontSize: 36,
                fontWeight: 900,
                color: theme.colors.inkBlack,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              OF FUND MANAGERS FAIL
            </div>
            <div
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: 20,
                color: theme.colors.slateText,
                marginTop: 6,
              }}
            >
              TO BEAT S&P 500 OVER 15 YEARS
            </div>
          </div>
        </div>

        {/* Comparison Bars */}
        <div style={{ marginTop: 28, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* S&P 500 Index Win Rate */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: theme.fonts.mono, fontSize: 18, fontWeight: 700 }}>
              <span>S&P 500 INDEX (PASSIVE)</span>
              <span style={{ color: theme.colors.emeraldGreen }}>92% WINS</span>
            </div>
            <div style={{ height: 24, width: "100%", backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${barWidthIndex}%`, backgroundColor: theme.colors.emeraldGreen, borderRadius: 12 }} />
            </div>
          </div>

          {/* Active Fund Managers */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: theme.fonts.mono, fontSize: 18, fontWeight: 700 }}>
              <span>ACTIVE HEDGE FUNDS (AFTER FEES)</span>
              <span style={{ color: theme.colors.vermilion }}>ONLY 8% BEAT</span>
            </div>
            <div style={{ height: 24, width: "100%", backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${barWidthActive}%`, backgroundColor: theme.colors.vermilion, borderRadius: 12 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Center Archival Footage Cutout */}
      <div
        style={{
          position: "absolute",
          top: 860,
          left: 100,
          opacity: pAsset,
          transform: `scale(${interpolate(pAsset, [0, 1], [0.92, 1])}) rotate(1.8deg)`,
          zIndex: 20,
        }}
      >
        <ArchivalAsset
          videoSrc={brollVideo}
          tilt={1.2}
          width={880}
          height={480}
          label="WALL STREET RESEARCH / SPIVA SCORECARD"
        />
      </div>

      {/* Word-level captions anchored in bottom safe zone */}
      <SafeZoneCaptions tokens={tokens} />
    </AbsoluteFill>
  );
};
