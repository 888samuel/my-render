import { interpolate } from "remotion";
import { cinematicEasing } from "./easing";

export function lerpFrames(
  frame: number,
  inputFrom: number,
  inputTo: number,
  outputFrom: number,
  outputTo: number,
): number {
  return interpolate(frame, [inputFrom, inputTo], [outputFrom, outputTo], {
    easing: cinematicEasing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}
