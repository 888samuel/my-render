import type { ReactNode } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { theme } from "../../styles/theme";
import { secondsToFrames } from "../../utils/time";

type WhipPanProps = {
  children: ReactNode;
  durationSec?: number;
};

/** The frame slams in from the side and settles. No blur, so it stays cheap. */
export const WhipPan = ({
  children,
  durationSec = theme.animation.transitionSec,
}: WhipPanProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const span = Math.max(1, secondsToFrames(durationSec, fps));
  const progress = interpolate(frame, [0, span], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const remain = 1 - progress;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translateX(${String(remain * 16)}%) rotate(${String(remain * -1.6)}deg) scale(${String(1 + remain * 0.05)})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
