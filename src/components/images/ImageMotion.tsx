import type { ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import type { Motion } from "../../types/edit-plan";
import {
  applyMotionIntensity,
  resolveMotion,
  sampleMotion,
} from "../../engine/AnimationResolver";
import { useCameraOffset } from "../../engine/CameraRig";
import { normalizeMotionType } from "../../engine/normalizeAliases";

type ImageMotionProps = {
  motion?: Motion;
  durationInFrames: number;
  /** Placed illustrations size to their image. Full-frame photos fill the shot. */
  fill?: boolean;
  opacity?: number;
  children: ReactNode;
};

export const ImageMotion = ({
  motion,
  durationInFrames,
  fill = true,
  opacity = 1,
  children,
}: ImageMotionProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const camera = useCameraOffset();
  const type = normalizeMotionType(motion?.type ?? "static");
  const sampled = sampleMotion(
    applyMotionIntensity(resolveMotion(type, motion?.from), motion?.intensity),
    frame,
    durationInFrames,
    fps,
  );
  const factor = motion?.parallaxFactor ?? 1;
  const translateX = sampled.translateX * factor + camera.translateX * factor;
  const translateY = sampled.translateY * factor + camera.translateY * factor;
  const scale =
    (1 + (sampled.scale - 1) * factor) * (1 + (camera.scale - 1) * factor);

  return (
    <div
      style={{
        width: "100%",
        height: fill ? "100%" : "auto",
        opacity: sampled.opacity * opacity,
        transform: `translate(${String(translateX)}%, ${String(translateY)}%) scale(${String(scale)})`,
        transformOrigin: "center center",
      }}
    >
      {children}
    </div>
  );
};
