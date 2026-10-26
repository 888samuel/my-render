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
  /** Length of the clip this fade belongs to. Fade-out uses this, not the whole video. */
  durationInFrames?: number;
};

export const Fade = ({
  children,
  durationSec = theme.animation.transitionSec,
  direction = "in",
  durationInFrames,
}: FadeProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames: compositionFrames } = useVideoConfig();
  const totalFrames = durationInFrames ?? compositionFrames;
  const fadeFrames = Math.max(1, secondsToFrames(durationSec, fps));
  const opacity =
    direction === "in"
      ? lerpFrames(frame, 0, fadeFrames, 0, 1)
      : lerpFrames(
          frame,
          Math.max(0, totalFrames - fadeFrames),
          totalFrames,
          1,
          0,
        );

  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};
