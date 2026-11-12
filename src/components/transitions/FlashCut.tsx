import type { ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { lerpFrames } from "../../utils/interpolate";
import { theme } from "../../styles/theme";
import { secondsToFrames } from "../../utils/time";

type FlashCutProps = {
  children: ReactNode;
  durationSec?: number;
};

/** A white hit that clears into the next shot. */
export const FlashCut = ({
  children,
  durationSec = theme.animation.transitionSec,
}: FlashCutProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const span = Math.max(1, secondsToFrames(durationSec, fps));

  return (
    <AbsoluteFill>
      <AbsoluteFill
        style={{
          opacity: lerpFrames(frame, 0, Math.max(1, span * 0.45), 0.15, 1),
        }}
      >
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: "#F4F1EA",
          opacity: lerpFrames(frame, 0, span, 0.92, 0),
        }}
      />
    </AbsoluteFill>
  );
};
