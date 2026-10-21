import React from "react";
import { theme } from "../theme";

interface WashiTapeProps {
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  rotation?: number;
  width?: number;
  height?: number;
  color?: string;
}

export const WashiTape: React.FC<WashiTapeProps> = ({
  top,
  bottom,
  left,
  right,
  rotation = -4,
  width = 110,
  height = 36,
  color = theme.colors.washiTape,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top,
        bottom,
        left,
        right,
        width,
        height,
        backgroundColor: color,
        transform: `rotate(${rotation}deg)`,
        boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
        borderLeft: "2px dashed rgba(180, 170, 140, 0.5)",
        borderRight: "2px dashed rgba(180, 170, 140, 0.5)",
        zIndex: 10,
        pointerEvents: "none",
        opacity: 0.88,
      }}
    />
  );
};
