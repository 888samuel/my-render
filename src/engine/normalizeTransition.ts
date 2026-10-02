import type { TransitionType } from "../types/common";

export type NormalizedTransition =
  | "none"
  | "fade"
  | "crossfade"
  | "slide"
  | "wipe"
  | "zoom_punch";

export function normalizeTransitionType(
  type: TransitionType,
): NormalizedTransition {
  switch (type) {
    case "none":
    case "hard_cut":
    case "glitch_cut":
    case "flash_cut":
      return "none";
    case "fade":
    case "fade_in_from_black":
    case "fade_to_black":
    case "circle_pulse":
      return "fade";
    case "crossfade":
    case "cross_dissolve":
    case "soft_blur":
    case "dissolve_smoke":
      return "crossfade";
    case "slide":
    case "smooth_slide":
    case "whip_pan":
    case "whip_zoom":
      return "slide";
    case "wipe_left":
      return "wipe";
    case "zoom_punch":
      return "zoom_punch";
  }
}
