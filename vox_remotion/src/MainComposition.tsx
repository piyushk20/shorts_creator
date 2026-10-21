import React from "react";
import { AbsoluteFill, Sequence, Audio, staticFile } from "remotion";
import voxData from "./voxData.json";
import { GradeAndGrain } from "./components/GradeAndGrain";
import { Beat1_MarketTrap } from "./scenes/Beat1_MarketTrap";
import { Beat2_ManagersFail } from "./scenes/Beat2_ManagersFail";
import { Beat3_BuyHaystack } from "./scenes/Beat3_BuyHaystack";
import { Beat4_CompanyBasket } from "./scenes/Beat4_CompanyBasket";
import { Beat5_FeeDestroyer } from "./scenes/Beat5_FeeDestroyer";
import { Beat6_OwnMachine } from "./scenes/Beat6_OwnMachine";

export const MainComposition: React.FC = () => {
  const { scenes, audio_src } = voxData;

  return (
    <AbsoluteFill style={{ backgroundColor: "#F5F3EF" }}>
      {/* Complete Mixed Audio Track (Voiceover + Looped Ducked BGM) */}
      <Audio src={staticFile(audio_src)} />

      {/* Beat 1: The Market Trap */}
      <Sequence from={scenes[0].start_frame} durationInFrames={scenes[0].frame_count}>
        <Beat1_MarketTrap
          tokens={scenes[0].tokens as any}
          brollVideo={scenes[0].broll_video}
        />
      </Sequence>

      {/* Beat 2: 92% of Managers Fail */}
      <Sequence from={scenes[1].start_frame} durationInFrames={scenes[1].frame_count}>
        <Beat2_ManagersFail
          tokens={scenes[1].tokens as any}
          brollVideo={scenes[1].broll_video}
        />
      </Sequence>

      {/* Beat 3: Buy the Haystack */}
      <Sequence from={scenes[2].start_frame} durationInFrames={scenes[2].frame_count}>
        <Beat3_BuyHaystack
          tokens={scenes[2].tokens as any}
          brollVideo={scenes[2].broll_video}
        />
      </Sequence>

      {/* Beat 4: The 500-Company Basket */}
      <Sequence from={scenes[3].start_frame} durationInFrames={scenes[3].frame_count}>
        <Beat4_CompanyBasket
          tokens={scenes[3].tokens as any}
          brollVideo={scenes[3].broll_video}
        />
      </Sequence>

      {/* Beat 5: The 1% Fee Destroyer */}
      <Sequence from={scenes[4].start_frame} durationInFrames={scenes[4].frame_count}>
        <Beat5_FeeDestroyer
          tokens={scenes[4].tokens as any}
          brollVideo={scenes[4].broll_video}
        />
      </Sequence>

      {/* Beat 6: Own the Machine */}
      <Sequence from={scenes[5].start_frame} durationInFrames={scenes[5].frame_count}>
        <Beat6_OwnMachine
          tokens={scenes[5].tokens as any}
          brollVideo={scenes[5].broll_video}
        />
      </Sequence>

      {/* Layer 4 & 5: Universal Color Grade, Halftone Print Grain & Vignette */}
      <GradeAndGrain />
    </AbsoluteFill>
  );
};
