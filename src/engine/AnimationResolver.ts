import type { CSSProperties } from "react";
import type { MotionType, TextAnimationType } from "../types/common";
import { theme } from "../styles/theme";
import { lerpFrames } from "../utils/interpolate";
import { secondsToFrames } from "../utils/time";
import { normalizeTextAnimation } from "./normalizeAliases";

export type MotionCurve = {
  scaleFrom: number;
  scaleTo: number;
  translateXFrom: number;
  translateXTo: number;
  translateYFrom: number;
  translateYTo: number;
};

export type EntranceStyle = {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
};

const STATIC_MOTION: MotionCurve = {
  scaleFrom: 1,
  scaleTo: 1,
  translateXFrom: 0,
  translateXTo: 0,
  translateYFrom: 0,
  translateYTo: 0,
};

export function resolveMotion(type: MotionType): MotionCurve {
  switch (type) {
    case "none":
    case "static":
    case "static_hold":
      return STATIC_MOTION;
    case "slow_zoom_in":
    case "zoom_in":
      return {
        scaleFrom: 1.04,
        scaleTo: 1.14,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: 0,
        translateYTo: 0,
      };
    case "slow_zoom_out":
    case "zoom_out":
      return {
        scaleFrom: 1.14,
        scaleTo: 1.04,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: 0,
        translateYTo: 0,
      };
    case "pan_left":
      return {
        scaleFrom: 1.16,
        scaleTo: 1.16,
        translateXFrom: 4.2,
        translateXTo: -4.2,
        translateYFrom: 0,
        translateYTo: 0,
      };
    case "pan_right":
      return {
        scaleFrom: 1.16,
        scaleTo: 1.16,
        translateXFrom: -4.2,
        translateXTo: 4.2,
        translateYFrom: 0,
        translateYTo: 0,
      };
    case "pan_up":
    case "tilt_up":
      return {
        scaleFrom: 1.14,
        scaleTo: 1.14,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: 4.0,
        translateYTo: -4.0,
      };
    case "pan_down":
    case "tilt_down":
      return {
        scaleFrom: 1.14,
        scaleTo: 1.14,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: -4.0,
        translateYTo: 4.0,
      };
    case "pan_diagonal":
      return {
        scaleFrom: 1.15,
        scaleTo: 1.15,
        translateXFrom: -3.2,
        translateXTo: 3.2,
        translateYFrom: -2.6,
        translateYTo: 2.6,
      };
    case "subtle_movement":
      return {
        scaleFrom: 1.05,
        scaleTo: 1.1,
        translateXFrom: -1.2,
        translateXTo: 1.2,
        translateYFrom: 0.8,
        translateYTo: -1.6,
      };
  }
}

export function applyMotionIntensity(
  curve: MotionCurve,
  intensity: number | undefined,
): MotionCurve {
  if (intensity === undefined) {
    return curve;
  }

  if (intensity <= 0) {
    return STATIC_MOTION;
  }

  const factor = Math.min(1.8, Math.max(0.35, intensity / 0.25));

  return {
    scaleFrom: 1 + (curve.scaleFrom - 1) * factor,
    scaleTo: 1 + (curve.scaleTo - 1) * factor,
    translateXFrom: curve.translateXFrom * factor,
    translateXTo: curve.translateXTo * factor,
    translateYFrom: curve.translateYFrom * factor,
    translateYTo: curve.translateYTo * factor,
  };
}

export type SampledMotion = {
  scale: number;
  translateX: number;
  translateY: number;
};

export function sampleMotion(
  curve: MotionCurve,
  frame: number,
  durationInFrames: number,
): SampledMotion {
  const endFrame = Math.max(1, durationInFrames - 1);

  return {
    scale: lerpFrames(frame, 0, endFrame, curve.scaleFrom, curve.scaleTo),
    translateX: lerpFrames(
      frame,
      0,
      endFrame,
      curve.translateXFrom,
      curve.translateXTo,
    ),
    translateY: lerpFrames(
      frame,
      0,
      endFrame,
      curve.translateYFrom,
      curve.translateYTo,
    ),
  };
}

export function resolveTextEntrance(
  frame: number,
  durationInFrames: number,
  animation: TextAnimationType,
  fps: number,
  autoExit = true,
): EntranceStyle {
  const enterFrames = secondsToFrames(theme.animation.entranceSec, fps);
  const exitFrames = secondsToFrames(theme.animation.exitSec, fps);
  const rest: EntranceStyle = {
    opacity: 1,
    translateX: 0,
    translateY: 0,
    scale: 1,
  };
  const type = normalizeTextAnimation(animation);

  let style: EntranceStyle = rest;
  switch (type) {
    case "none":
    case "word_reveal":
    case "dramatic_reveal":
    case "sequential":
      style = rest;
      break;
    case "fade_in":
      style = {
        ...rest,
        opacity: lerpFrames(frame, 0, enterFrames, 0, 1),
      };
      break;
    case "fade_out":
      style = {
        ...rest,
        opacity: lerpFrames(
          frame,
          durationInFrames - exitFrames,
          durationInFrames,
          1,
          0,
        ),
      };
      break;
    case "fade_up":
    case "slide_up":
      style = {
        ...rest,
        opacity: lerpFrames(frame, 0, enterFrames, 0, 1),
        translateY: lerpFrames(frame, 0, enterFrames, 28, 0),
      };
      break;
    case "slide_left":
      style = {
        ...rest,
        opacity: lerpFrames(frame, 0, enterFrames, 0, 1),
        translateX: lerpFrames(frame, 0, enterFrames, 36, 0),
      };
      break;
    case "scale_up":
    case "scale_in":
      style = {
        ...rest,
        opacity: lerpFrames(frame, 0, enterFrames, 0, 1),
        scale: lerpFrames(frame, 0, enterFrames, 0.96, 1),
      };
      break;
  }

  if (
    autoExit &&
    type !== "fade_out" &&
    type !== "none" &&
    durationInFrames > enterFrames + exitFrames + 2
  ) {
    const exitOpacity = lerpFrames(
      frame,
      durationInFrames - exitFrames,
      durationInFrames,
      1,
      0,
    );
    style = {
      ...style,
      opacity: Math.min(style.opacity, exitOpacity),
    };
  }

  return style;
}

export function entranceToCss(style: EntranceStyle): CSSProperties {
  return {
    opacity: style.opacity,
    transform: `translate(${String(style.translateX)}px, ${String(style.translateY)}px) scale(${String(style.scale)})`,
  };
}

export function wordRevealOpacity(
  frame: number,
  wordIndex: number,
  fps: number,
  dramatic: boolean,
): number {
  const staggerSec = dramatic
    ? theme.animation.wordStaggerSec * 1.6
    : theme.animation.wordStaggerSec;
  const start = secondsToFrames(staggerSec, fps) * wordIndex;
  const length = secondsToFrames(
    dramatic ? theme.animation.entranceSec : theme.animation.entranceSec * 0.7,
    fps,
  );

  return lerpFrames(frame, start, start + length, 0, 1);
}
