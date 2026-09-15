import type { ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { lerpFrames } from "../../utils/interpolate";
import { theme } from "../../styles/theme";
import { secondsToFrames } from "../../utils/time";

type SlideProps = {
  children: ReactNode;
  durationSec?: number;
};

export const Slide = ({
  children,
  durationSec = theme.animation.transitionSec,
}: SlideProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slideFrames = secondsToFrames(durationSec, fps);

  return (
    <AbsoluteFill
      style={{
        opacity: lerpFrames(frame, 0, slideFrames, 0, 1),
        transform: `translateX(${String(lerpFrames(frame, 0, slideFrames, 48, 0))}px)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
