import React from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";

export const GradeAndGrain: React.FC = () => {
  // SVG procedural noise URI for high quality paper grain without external asset files
  const noiseSvg =
    'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'240\' height=\'240\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'240\' height=\'240\' filter=\'url(%23n)\' opacity=\'0.45\'/%3E%3C/svg%3E")';

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 100 }}>
      {/* Layer 4: Soft-Light Editorial Color Grade */}
      <AbsoluteFill
        style={{
          backgroundColor: theme.colors.vermilion,
          mixBlendMode: "soft-light",
          opacity: 0.08,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(20,20,20,0.06) 0%, transparent 20%, transparent 80%, rgba(20,20,20,0.12) 100%)",
        }}
      />

      {/* Layer 5: Procedural Grain */}
      <AbsoluteFill
        style={{
          backgroundImage: noiseSvg,
          mixBlendMode: "multiply",
          opacity: 0.16,
        }}
      />

      {/* Vignette border */}
      <AbsoluteFill
        style={{
          boxShadow: "inset 0 0 140px rgba(0, 0, 0, 0.22)",
        }}
      />
    </AbsoluteFill>
  );
};
