import type { ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { lerpFrames } from "../../utils/interpolate";
import { theme } from "../../styles/theme";
import { secondsToFrames } from "../../utils/time";

type ZoomPunchProps = {
  children: ReactNode;
  durationSec?: number;
};

export const ZoomPunch = ({
  children,
  durationSec = theme.animation.transitionSec,
}: ZoomPunchProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const punchFrames = Math.max(1, secondsToFrames(durationSec, fps));

  return (
    <AbsoluteFill
      style={{
        opacity: lerpFrames(frame, 0, punchFrames, 0, 1),
        transform: `scale(${String(lerpFrames(frame, 0, punchFrames, 1.12, 1))})`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
