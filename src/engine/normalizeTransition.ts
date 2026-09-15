import type { TransitionType } from "../types/common";

export function normalizeTransitionType(
  type: TransitionType,
): "none" | "fade" | "crossfade" | "slide" {
  switch (type) {
    case "none":
    case "hard_cut":
    case "glitch_cut":
    case "flash_cut":
    case "zoom_punch":
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
    case "wipe_left":
      return "slide";
  }
}
