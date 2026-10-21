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

  // Entrance 5: Social Media CTA (Staggers in at frame 110, expands through last frame)
  const pSocial = spring({ frame: frame - 110, fps, config: theme.spring.bouncy });
  const pSocialPulse = frame > 200 ? Math.sin((frame - 200) / 4) * 2 : 0;

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
          height={540}
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

      {/* On-Screen Social Media Handle & CTA Card (Prominent through final frame) */}
      {frame >= 100 && (
        <div
          style={{
            position: "absolute",
            bottom: frame > 220 ? 250 : 340,
            left: 70,
            right: 70,
            backgroundColor: "#FFFFFF",
            padding: "26px 36px",
            borderRadius: 14,
            boxShadow: "0 22px 50px rgba(0,0,0,0.25), 0 6px 16px rgba(0,0,0,0.15)",
            border: "3.5px solid #0F172A",
            opacity: pSocial,
            transform: `translateY(${interpolate(pSocial, [0, 1], [60, 0])}px) rotate(${interpolate(pSocial, [0, 1], [-1.5, 0.5])}deg) scale(${frame > 220 ? 1.03 : 1})`,
            zIndex: 50,
            transition: "all 0.3s ease-out",
          }}
        >
          <WashiTape top={-12} left={35} rotation={-4} width={100} />
          <WashiTape top={-12} right={45} rotation={3} width={105} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
              {/* Facebook Icon */}
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: "50%",
                  backgroundColor: "#1877F2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 18px rgba(24, 119, 242, 0.45)",
                  flexShrink: 0,
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="#FFFFFF">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </div>

              <div>
                <div
                  style={{
                    fontFamily: theme.fonts.display,
                    fontSize: 22,
                    fontWeight: 900,
                    color: "#E11D48",
                    letterSpacing: 2.5,
                    textTransform: "uppercase",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span>FOLLOW AND LIKE FOR MORE</span>
                  <span style={{ fontSize: 22 }}>👍</span>
                </div>
                <div
                  style={{
                    fontFamily: theme.fonts.mono,
                    fontSize: 34,
                    fontWeight: 900,
                    color: "#0F172A",
                    letterSpacing: -0.5,
                    marginTop: 6,
                  }}
                >
                  facebook :{" "}
                  <span
                    style={{
                      color: "#1877F2",
                      backgroundColor: "rgba(24, 119, 242, 0.08)",
                      padding: "3px 14px",
                      borderRadius: 8,
                      border: "2px solid rgba(24, 119, 242, 0.3)",
                      display: "inline-block",
                    }}
                  >
                    Shelf Wisdom
                  </span>
                </div>
              </div>
            </div>

            {/* Follow Button Pill */}
            <div
              style={{
                backgroundColor: "#1877F2",
                color: "#FFFFFF",
                fontFamily: theme.fonts.display,
                fontSize: 20,
                fontWeight: 900,
                letterSpacing: 1.5,
                padding: "14px 28px",
                borderRadius: 30,
                boxShadow: "0 8px 20px rgba(24, 119, 242, 0.45)",
                textTransform: "uppercase",
                transform: `scale(${1 + pSocialPulse * 0.01})`,
                flexShrink: 0,
              }}
            >
              + FOLLOW
            </div>
          </div>
        </div>
      )}

      {/* Word-level captions anchored in bottom safe zone (fades out after narration ends) */}
      {frame <= 228 && <SafeZoneCaptions tokens={tokens} />}
    </AbsoluteFill>
  );
};
