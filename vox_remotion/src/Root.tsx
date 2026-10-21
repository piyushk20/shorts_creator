import React from "react";
import { Composition } from "remotion";
import { MainComposition } from "./MainComposition";
import voxData from "./voxData.json";

export const Root: React.FC = () => {
  return (
    <Composition
      id="VoxIndexFunds"
      component={MainComposition}
      durationInFrames={voxData.total_frames}
      fps={voxData.fps}
      width={voxData.width}
      height={voxData.height}
    />
  );
};
