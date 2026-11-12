import type { ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { lerpFrames } from "../../utils/interpolate";
import { secondsToFrames } from "../../utils/time";

type GlitchCutProps = {
  children: ReactNode;
  durationSec?: number;
};

/**
 * A short sideways kick with a colored fringe.
 * The picture is moved once. It is not a real RGB split of the footage.
 */
export const GlitchCut = ({ children, durationSec = 0.35 }: GlitchCutProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const span = Math.max(1, secondsToFrames(durationSec, fps));
  const glitchSpan = Math.max(1, Math.round(span * 0.6));
  const kicking = frame < glitchSpan;
  const slide = kicking ? ((frame * 13) % 9) - 4 : 0;
  const tint = kicking ? 0.4 * (1 - frame / glitchSpan) : 0;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          transform: `translateX(${String(slide)}%)`,
          opacity: lerpFrames(frame, 0, Math.min(4, span), 0.35, 1),
        }}
      >
        {children}
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(90deg, rgba(255,40,70,0.5), transparent 28%, transparent 72%, rgba(40,220,255,0.5))",
          opacity: tint,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};
