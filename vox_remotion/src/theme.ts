import { Easing } from "remotion";

export const theme = {
  colors: {
    bgPaper: "#F5F3EF",       // Warm tactile newspaper kraft
    bgPaperAlt: "#EBE7DF",    // Secondary aged paper tone
    inkBlack: "#111113",      // Deep graphite print ink
    slateText: "#3F3F46",     // Editorial secondary body
    vermilion: "#E11D48",     // Iconic Swiss accent red
    amberGold: "#D97706",     // Warm golden highlight
    royalBlue: "#2563EB",     // Institutional trust blue
    emeraldGreen: "#059669",  // Compounding growth green
    cardBg: "#FFFFFF",        // Cutout card white
    washiTape: "rgba(240, 230, 200, 0.82)", // Translucent tape
    washiTapeBorder: "rgba(200, 190, 160, 0.4)",
    gridDot: "rgba(20, 20, 25, 0.08)",
  },
  shadows: {
    paperCut: "0 18px 40px -10px rgba(0, 0, 0, 0.28), 0 4px 12px rgba(0, 0, 0, 0.12)",
    paperLight: "0 10px 25px -5px rgba(0, 0, 0, 0.18)",
    stamp: "0 2px 6px rgba(0, 0, 0, 0.2)",
  },
  fonts: {
    display: "'Helvetica Neue', 'Arial Black', -apple-system, sans-serif",
    serif: "'Georgia', 'Times New Roman', serif",
    mono: "'Courier Prime', 'Courier New', monospace",
  },
  spring: {
    snappy: { damping: 14, stiffness: 160, mass: 0.6 },
    smooth: { damping: 18, stiffness: 110, mass: 0.9 },
    bouncy: { damping: 12, stiffness: 170, mass: 0.7 },
  },
  ease: {
    out: Easing.bezier(0.16, 1, 0.3, 1),
    inOut: Easing.bezier(0.83, 0, 0.17, 1),
    in: Easing.bezier(0.7, 0, 0.84, 0),
  }
} as const;
