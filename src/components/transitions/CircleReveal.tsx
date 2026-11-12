import type { ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { lerpFrames } from "../../utils/interpolate";
import { theme } from "../../styles/theme";
import { secondsToFrames } from "../../utils/time";

type CircleRevealProps = {
  children: ReactNode;
  durationSec?: number;
};

/** The shot opens from a point in the middle of the frame. */
export const CircleReveal = ({
  children,
  durationSec = theme.animation.transitionSec,
}: CircleRevealProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const span = Math.max(1, secondsToFrames(durationSec, fps));
  if (frame >= span) {
    return <AbsoluteFill>{children}</AbsoluteFill>;
  }

  const radius = lerpFrames(frame, 0, span, 0, 120);

  return (
    <AbsoluteFill style={{ clipPath: `circle(${String(radius)}% at 50% 50%)` }}>
      {children}
    </AbsoluteFill>
  );
};
