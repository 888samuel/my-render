import type { ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { lerpFrames } from "../../utils/interpolate";
import { theme } from "../../styles/theme";
import { secondsToFrames } from "../../utils/time";

type FadeProps = {
  children: ReactNode;
  durationSec?: number;
  direction?: "in" | "out";
};

export const Fade = ({
  children,
  durationSec = theme.animation.transitionSec,
  direction = "in",
}: FadeProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const fadeFrames = secondsToFrames(durationSec, fps);
  const opacity =
    direction === "in"
      ? lerpFrames(frame, 0, fadeFrames, 0, 1)
      : lerpFrames(frame, durationInFrames - fadeFrames, durationInFrames, 1, 0);

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
