import type { ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { lerpFrames } from "../../utils/interpolate";
import { theme } from "../../styles/theme";
import { secondsToFrames } from "../../utils/time";

type WipeProps = {
  children: ReactNode;
  durationSec?: number;
  direction?: "left" | "right";
};

export const Wipe = ({
  children,
  durationSec = theme.animation.transitionSec,
  direction = "left",
}: WipeProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wipeFrames = Math.max(1, secondsToFrames(durationSec, fps));
  const progress = lerpFrames(frame, 0, wipeFrames, 0, 1);
  const inset =
    direction === "left"
      ? `inset(0 ${String((1 - progress) * 100)}% 0 0)`
      : `inset(0 0 0 ${String((1 - progress) * 100)}%)`;

  return (
    <AbsoluteFill
      style={{
        clipPath: inset,
        opacity: lerpFrames(frame, 0, wipeFrames * 0.35, 0.15, 1),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
