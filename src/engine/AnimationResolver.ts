import type { CSSProperties } from "react";
import { Easing, interpolate } from "remotion";
import type { MotionType, TextAnimationType } from "../types/common";
import type { MotionFrom } from "../types/edit-plan";
import { theme } from "../styles/theme";
import { lerpFrames } from "../utils/interpolate";
import { secondsToFrames } from "../utils/time";
import { normalizeTextAnimation } from "./normalizeAliases";

export type MotionBehavior = "linear" | "breathe" | "float" | "pop" | "enter";

export type MotionCurve = {
  behavior: MotionBehavior;
  scaleFrom: number;
  scaleTo: number;
  translateXFrom: number;
  translateXTo: number;
  translateYFrom: number;
  translateYTo: number;
  periodSec?: number;
  enterSec?: number;
};

export type EntranceStyle = {
  opacity: number;
  translateX: number;
  translateY: number;
  scale: number;
};

const STATIC_MOTION: MotionCurve = {
  behavior: "linear",
  scaleFrom: 1,
  scaleTo: 1,
  translateXFrom: 0,
  translateXTo: 0,
  translateYFrom: 0,
  translateYTo: 0,
};

const linear = (
  curve: Omit<MotionCurve, "behavior" | "periodSec" | "enterSec">,
): MotionCurve => ({
  behavior: "linear",
  ...curve,
});

export function resolveMotion(type: MotionType, from?: MotionFrom): MotionCurve {
  switch (type) {
    case "none":
    case "static":
    case "static_hold":
      return STATIC_MOTION;
    case "slow_zoom_in":
    case "zoom_in":
      return linear({
        scaleFrom: 1.04,
        scaleTo: 1.14,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: 0,
        translateYTo: 0,
      });
    case "slow_zoom_out":
    case "zoom_out":
      return linear({
        scaleFrom: 1.14,
        scaleTo: 1.04,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: 0,
        translateYTo: 0,
      });
    case "pan_left":
      return linear({
        scaleFrom: 1.16,
        scaleTo: 1.16,
        translateXFrom: 4.2,
        translateXTo: -4.2,
        translateYFrom: 0,
        translateYTo: 0,
      });
    case "pan_right":
      return linear({
        scaleFrom: 1.16,
        scaleTo: 1.16,
        translateXFrom: -4.2,
        translateXTo: 4.2,
        translateYFrom: 0,
        translateYTo: 0,
      });
    case "pan_up":
    case "tilt_up":
      return linear({
        scaleFrom: 1.14,
        scaleTo: 1.14,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: 4.0,
        translateYTo: -4.0,
      });
    case "pan_down":
    case "tilt_down":
      return linear({
        scaleFrom: 1.14,
        scaleTo: 1.14,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: -4.0,
        translateYTo: 4.0,
      });
    case "pan_diagonal":
      return linear({
        scaleFrom: 1.15,
        scaleTo: 1.15,
        translateXFrom: -3.2,
        translateXTo: 3.2,
        translateYFrom: -2.6,
        translateYTo: 2.6,
      });
    case "subtle_movement":
      return linear({
        scaleFrom: 1.05,
        scaleTo: 1.1,
        translateXFrom: -1.2,
        translateXTo: 1.2,
        translateYFrom: 0.8,
        translateYTo: -1.6,
      });
    case "breathe":
      return {
        behavior: "breathe",
        scaleFrom: 1,
        scaleTo: 1.035,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: 0,
        translateYTo: 0,
        periodSec: 2.6,
      };
    case "float":
      return {
        behavior: "float",
        scaleFrom: 1,
        scaleTo: 1,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: -1.6,
        translateYTo: 1.6,
        periodSec: 3.2,
      };
    case "pop_in":
      return {
        behavior: "pop",
        scaleFrom: 0.84,
        scaleTo: 1,
        translateXFrom: 0,
        translateXTo: 0,
        translateYFrom: 0,
        translateYTo: 0,
        enterSec: 0.48,
      };
    case "slide_in":
      return slideIn(from ?? "bottom");
  }
}

function slideIn(from: MotionFrom): MotionCurve {
  const enter = {
    behavior: "enter" as const,
    scaleFrom: 1,
    scaleTo: 1,
    translateXFrom: 0,
    translateXTo: 0,
    translateYFrom: 0,
    translateYTo: 0,
    enterSec: 0.55,
  };

  if (from === "left") {
    return { ...enter, translateXFrom: -18 };
  }
  if (from === "right") {
    return { ...enter, translateXFrom: 18 };
  }
  if (from === "top") {
    return { ...enter, translateYFrom: -14 };
  }
  return { ...enter, translateYFrom: 12 };
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

  if (curve.behavior === "breathe") {
    return {
      ...curve,
      scaleTo: 1 + (curve.scaleTo - 1) * factor,
    };
  }

  if (curve.behavior === "pop") {
    return {
      ...curve,
      scaleFrom: 1 + (curve.scaleFrom - 1) * factor,
    };
  }

  if (curve.behavior === "float" || curve.behavior === "enter") {
    return {
      ...curve,
      translateXFrom: curve.translateXFrom * factor,
      translateXTo: curve.translateXTo * factor,
      translateYFrom: curve.translateYFrom * factor,
      translateYTo: curve.translateYTo * factor,
    };
  }

  return {
    ...curve,
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
  opacity: number;
};

export function sampleMotion(
  curve: MotionCurve,
  frame: number,
  durationInFrames: number,
  fps: number,
): SampledMotion {
  if (curve.behavior === "breathe") {
    const periodFrames = Math.max(1, (curve.periodSec ?? 2.6) * fps);
    const wave =
      0.5 - 0.5 * Math.cos((frame / periodFrames) * Math.PI * 2);
    return {
      scale: curve.scaleFrom + (curve.scaleTo - curve.scaleFrom) * wave,
      translateX: 0,
      translateY: 0,
      opacity: 1,
    };
  }

  if (curve.behavior === "float") {
    const periodFrames = Math.max(1, (curve.periodSec ?? 3.2) * fps);
    const wave = Math.sin((frame / periodFrames) * Math.PI * 2);
    return {
      scale: 1,
      translateX: midpoint(curve.translateXFrom, curve.translateXTo, wave),
      translateY: midpoint(curve.translateYFrom, curve.translateYTo, wave),
      opacity: 1,
    };
  }

  if (curve.behavior === "pop" || curve.behavior === "enter") {
    const enterFrames = Math.max(1, Math.round((curve.enterSec ?? 0.5) * fps));
    const easing =
      curve.behavior === "pop"
        ? Easing.out(Easing.back(1.7))
        : Easing.out(Easing.cubic);
    const progress = interpolate(frame, [0, enterFrames], [0, 1], {
      easing,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const opacity = interpolate(frame, [0, enterFrames * 0.45], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return {
      scale: curve.scaleFrom + (curve.scaleTo - curve.scaleFrom) * progress,
      translateX:
        curve.translateXFrom +
        (curve.translateXTo - curve.translateXFrom) * progress,
      translateY:
        curve.translateYFrom +
        (curve.translateYTo - curve.translateYFrom) * progress,
      opacity,
    };
  }

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
    opacity: 1,
  };
}

function midpoint(from: number, to: number, wave: number): number {
  const mid = (from + to) / 2;
  const amp = (to - from) / 2;
  return mid + amp * wave;
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
