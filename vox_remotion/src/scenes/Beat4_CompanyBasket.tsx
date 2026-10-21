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

const TOP_COMPANIES = [
  { ticker: "AAPL", name: "Apple Inc.", weight: "7.1%", color: "#09090B" },
  { ticker: "MSFT", name: "Microsoft Corp.", weight: "6.8%", color: "#0078D4" },
  { ticker: "NVDA", name: "Nvidia Corp.", weight: "6.2%", color: "#76B900" },
  { ticker: "AMZN", name: "Amazon.com Inc.", weight: "3.7%", color: "#FF9900" },
  { ticker: "GOOGL", name: "Alphabet Inc.", weight: "2.5%", color: "#4285F4" },
  { ticker: "BRK.B", name: "Berkshire Hathaway", weight: "1.9%", color: "#002B49" },
];

export const Beat4_CompanyBasket: React.FC<BeatSceneProps> = ({
  tokens,
  brollVideo,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance 1: Header
  const pHead = spring({ frame, fps, config: theme.spring.smooth });

  // Entrance 2: Basket Mosaic Grid (staggered cards)
  const pGrid = spring({ frame: frame - 8, fps, config: theme.spring.snappy });

  // Entrance 3: Self-Cleansing Rule Tag
  const pBadge = spring({ frame: frame - 22, fps, config: theme.spring.bouncy });

  // Entrance 4: Archival Asset Cutout
  const pAsset = spring({ frame: frame - 28, fps, config: theme.spring.smooth });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <BgPaper accentTint={theme.colors.emeraldGreen} />

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
          ● AUTOMATIC DIVERSIFICATION
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
          ONE BASKET: <br />
          <span style={{ color: theme.colors.emeraldGreen }}>ALL 500 GIANTS</span>
        </h1>
      </div>

      {/* 6-Company Mosaic Grid */}
      <div
        style={{
          position: "absolute",
          top: 340,
          left: 80,
          right: 80,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          opacity: pGrid,
          zIndex: 25,
        }}
      >
        {TOP_COMPANIES.map((comp, idx) => {
          const cardP = spring({
            frame: frame - (10 + idx * 3),
            fps,
            config: theme.spring.snappy,
          });
          const cardY = interpolate(cardP, [0, 1], [25, 0]);

          return (
            <div
              key={comp.ticker}
              style={{
                opacity: cardP,
                transform: `translateY(${cardY}px)`,
                backgroundColor: theme.colors.cardBg,
                padding: "16px 20px",
                borderRadius: 8,
                boxShadow: theme.shadows.paperCut,
                borderLeft: `6px solid ${comp.color}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontFamily: theme.fonts.display, fontSize: 30, fontWeight: 900, color: theme.colors.inkBlack }}>
                  {comp.ticker}
                </div>
                <div style={{ fontFamily: theme.fonts.mono, fontSize: 16, color: theme.colors.slateText }}>
                  {comp.name}
                </div>
              </div>
              <div
                style={{
                  fontFamily: theme.fonts.mono,
                  fontSize: 20,
                  fontWeight: 800,
                  color: theme.colors.emeraldGreen,
                  backgroundColor: "rgba(5, 150, 105, 0.1)",
                  padding: "4px 10px",
                  borderRadius: 4,
                }}
              >
                {comp.weight}
              </div>
            </div>
          );
        })}
      </div>

      {/* Center Archival Asset Cutout */}
      <div
        style={{
          position: "absolute",
          top: 720,
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
          height={620}
          label="S&P 500 COMPOSITION / AMERICAN ENTERPRISE"
        />
      </div>

      {/* Self-Cleansing Stamped Badge */}
      <div
        style={{
          position: "absolute",
          top: 650,
          right: 90,
          opacity: pBadge,
          transform: `scale(${interpolate(pBadge, [0, 1], [1.6, 1])}) rotate(6deg)`,
          zIndex: 35,
          backgroundColor: theme.colors.inkBlack,
          color: "#FFFFFF",
          padding: "12px 24px",
          fontFamily: theme.fonts.display,
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: 2,
          borderRadius: 4,
          boxShadow: theme.shadows.stamp,
          border: `2px solid ${theme.colors.emeraldGreen}`,
        }}
      >
        SELF-CLEANSING: WEAK EXIT, WINNERS STAY
      </div>

      {/* Word-level captions anchored in bottom safe zone */}
      <SafeZoneCaptions tokens={tokens} />
    </AbsoluteFill>
  );
};
