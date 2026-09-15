import type { CSSProperties } from "react";
import type { MotionType, TextAnimationType } from "../types/common";
import { theme } from "../styles/theme";
import { lerpFrames } from "../utils/interpolate";
import { secondsToFrames } from "../utils/time";

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
      return STATIC_MOTION;
    case "slow_zoom_in":
      return {
        scaleFrom: 1.02,
        scaleTo: 1.08,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: 0,
        translateYTo: 0,
      };
    case "slow_zoom_out":
      return {
        scaleFrom: 1.08,
        scaleTo: 1.02,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: 0,
        translateYTo: 0,
      };
    case "pan_left":
      return {
        scaleFrom: 1.12,
        scaleTo: 1.12,
        translateXFrom: 3.2,
        translateXTo: -3.2,
        translateYFrom: 0,
        translateYTo: 0,
      };
    case "pan_right":
      return {
        scaleFrom: 1.12,
        scaleTo: 1.12,
        translateXFrom: -3.2,
        translateXTo: 3.2,
        translateYFrom: 0,
        translateYTo: 0,
      };
    case "subtle_movement":
      return {
        scaleFrom: 1.03,
        scaleTo: 1.07,
        translateXFrom: -0.8,
        translateXTo: 0.8,
        translateYFrom: 0.6,
        translateYTo: -1.2,
      };
  }
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
): EntranceStyle {
  const enterFrames = secondsToFrames(theme.animation.entranceSec, fps);
  const exitFrames = secondsToFrames(theme.animation.exitSec, fps);
  const rest: EntranceStyle = {
    opacity: 1,
    translateX: 0,
    translateY: 0,
    scale: 1,
  };

  switch (animation) {
    case "none":
    case "word_reveal":
    case "dramatic_reveal":
    case "sequential":
      return rest;
    case "fade_in":
      return {
        ...rest,
        opacity: lerpFrames(frame, 0, enterFrames, 0, 1),
      };
    case "fade_out":
      return {
        ...rest,
        opacity: lerpFrames(
          frame,
          durationInFrames - exitFrames,
          durationInFrames,
          1,
          0,
        ),
      };
    case "slide_up":
      return {
        ...rest,
        opacity: lerpFrames(frame, 0, enterFrames, 0, 1),
        translateY: lerpFrames(frame, 0, enterFrames, 28, 0),
      };
    case "slide_left":
      return {
        ...rest,
        opacity: lerpFrames(frame, 0, enterFrames, 0, 1),
        translateX: lerpFrames(frame, 0, enterFrames, 36, 0),
      };
    case "scale_in":
      return {
        ...rest,
        opacity: lerpFrames(frame, 0, enterFrames, 0, 1),
        scale: lerpFrames(frame, 0, enterFrames, 0.96, 1),
      };
  }
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
