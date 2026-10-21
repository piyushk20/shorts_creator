import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";

export const BgPaper: React.FC<{ accentTint?: string }> = ({ accentTint }) => {
  const frame = useCurrentFrame();
  const d1 = Math.sin(frame / 60) * 20;
  const d2 = Math.cos(frame / 75) * 15;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.bgPaper, overflow: "hidden" }}>
      {/* Halftone micro-grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.55,
          backgroundImage: `radial-gradient(${theme.colors.gridDot} 1.5px, transparent 1.5px)`,
          backgroundSize: "28px 28px",
        }}
      />

      {/* Subtle organic paper mesh tints */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          top: -200 + d1,
          left: -200 + d2,
          filter: "blur(90px)",
          background: `radial-gradient(circle, ${accentTint || theme.colors.vermilion}14, transparent 70%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 800,
          height: 800,
          borderRadius: "50%",
          bottom: -150 - d2,
          right: -150 - d1,
          filter: "blur(100px)",
          background: `radial-gradient(circle, ${theme.colors.amberGold}12, transparent 70%)`,
        }}
      />

      {/* Fine editorial boundary lines */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 50,
          right: 50,
          height: 1,
          backgroundColor: "rgba(0,0,0,0.06)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 180,
          left: 50,
          right: 50,
          height: 1,
          backgroundColor: "rgba(0,0,0,0.06)",
        }}
      />
    </AbsoluteFill>
  );
};
