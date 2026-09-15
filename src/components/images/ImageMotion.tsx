import type { ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { Motion } from "../../types/edit-plan";
import { resolveMotion, sampleMotion } from "../../engine/AnimationResolver";

type ImageMotionProps = {
  motion?: Motion;
  children: ReactNode;
};

export const ImageMotion = ({ motion, children }: ImageMotionProps) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const sampled = sampleMotion(
    resolveMotion(motion?.type ?? "static"),
    frame,
    durationInFrames,
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        transform: `translate(${String(sampled.translateX)}%, ${String(sampled.translateY)}%) scale(${String(sampled.scale)})`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );
};
