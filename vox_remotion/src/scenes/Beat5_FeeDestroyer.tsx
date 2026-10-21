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

export const Beat5_FeeDestroyer: React.FC<BeatSceneProps> = ({
  tokens,
  brollVideo,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance 1: Header
  const pHead = spring({ frame, fps, config: theme.spring.smooth });

  // Entrance 2: Fee Comparison Card (stagger frame 8)
  const pCard = spring({ frame: frame - 8, fps, config: theme.spring.smooth });

  // Entrance 3: Bar growth (stagger frame 16)
  const pBar = spring({ frame: frame - 16, fps, config: theme.spring.smooth });
  const indexBar = interpolate(pBar, [0, 1], [0, 100]);
  const activeBar = interpolate(pBar, [0, 1], [0, 62]);

  // Entrance 4: Lost Wealth Red Stamp (stagger frame 26)
  const pStamp = spring({ frame: frame - 26, fps, config: theme.spring.bouncy });

  // Entrance 5: Archival Footage (stagger frame 32)
  const pAsset = spring({ frame: frame - 32, fps, config: theme.spring.smooth });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <BgPaper accentTint={theme.colors.vermilion} />

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
            backgroundColor: theme.colors.vermilion,
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
          ● COMPOUND FEE MATH
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
          THE 1% <br />
          <span style={{ color: theme.colors.vermilion }}>WEALTH DESTROYER</span>
        </h1>
      </div>

      {/* Compound Comparison Card */}
      <div
        style={{
          position: "absolute",
          top: 340,
          left: 80,
          right: 80,
          backgroundColor: theme.colors.cardBg,
          padding: "28px 36px",
          borderRadius: 8,
          boxShadow: theme.shadows.paperCut,
          opacity: pCard,
          transform: `translateY(${interpolate(pCard, [0, 1], [30, 0])}px) rotate(1.2deg)`,
          zIndex: 25,
        }}
      >
        <WashiTape top={-14} left={40} rotation={-4} width={100} />
        <WashiTape top={-12} right={50} rotation={3} width={110} />

        <div style={{ fontFamily: theme.fonts.mono, fontSize: 18, color: theme.colors.slateText, textTransform: "uppercase" }}>
          $100,000 INVESTED OVER 30 YEARS (8% RETURN)
        </div>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Index Fund Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: theme.fonts.display, fontSize: 24, fontWeight: 800 }}>
              <span>INDEX FUND (0.03% FEE)</span>
              <span style={{ color: theme.colors.emeraldGreen }}>$1,006,000</span>
            </div>
            <div style={{ height: 32, width: "100%", backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${indexBar}%`, backgroundColor: theme.colors.emeraldGreen, borderRadius: 16 }} />
            </div>
          </div>

          {/* Active Fund Bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontFamily: theme.fonts.display, fontSize: 24, fontWeight: 800 }}>
              <span>ACTIVE FUND (1.20% FEE)</span>
              <span style={{ color: theme.colors.vermilion }}>$660,000</span>
            </div>
            <div style={{ height: 32, width: "100%", backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${activeBar}%`, backgroundColor: theme.colors.vermilion, borderRadius: 16 }} />
            </div>
          </div>
        </div>

        {/* Stamped Lost Wealth Banner */}
        <div
          style={{
            marginTop: 24,
            padding: "12px 20px",
            backgroundColor: "rgba(225, 29, 72, 0.1)",
            border: `2px dashed ${theme.colors.vermilion}`,
            borderRadius: 6,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            opacity: pStamp,
            transform: `scale(${interpolate(pStamp, [0, 1], [1.3, 1])})`,
          }}
        >
          <span style={{ fontFamily: theme.fonts.display, fontSize: 22, fontWeight: 900, color: theme.colors.vermilion }}>
            LOST TO WALL STREET FEES:
          </span>
          <span style={{ fontFamily: theme.fonts.display, fontSize: 32, fontWeight: 900, color: theme.colors.vermilion }}>
            -$346,000
          </span>
        </div>
      </div>

      {/* Center Archival Asset Cutout */}
      <div
        style={{
          position: "absolute",
          top: 850,
          left: 80,
          opacity: interpolate(pAsset, [0, 1], [0, 1]),
          transform: `scale(${interpolate(pAsset, [0, 1], [0.94, 1])}) rotate(-1.5deg)`,
          zIndex: 20,
        }}
      >
        <ArchivalAsset
          videoSrc={brollVideo}
          tilt={-1.5}
          width={920}
          height={490}
          label="COMPOUND COST ANALYSIS / THE 1% TRAP"
        />
      </div>

      {/* Word-level captions anchored in bottom safe zone */}
      <SafeZoneCaptions tokens={tokens} />
    </AbsoluteFill>
  );
};
