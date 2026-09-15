import type { MotionType, TextAnimationType } from "../types/common";

export function normalizeMotionType(type: MotionType): MotionType {
  switch (type) {
    case "zoom_in":
      return "slow_zoom_in";
    case "zoom_out":
      return "slow_zoom_out";
    case "static_hold":
      return "static";
    default:
      return type;
  }
}

export function normalizeTextAnimation(
  type: TextAnimationType,
): TextAnimationType {
  switch (type) {
    case "fade_up":
      return "slide_up";
    case "scale_up":
      return "scale_in";
    default:
      return type;
  }
}
