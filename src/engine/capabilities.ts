/**
 * Capability tiers for the Remotion editing engine.
 *
 * NOW  = safe on GitHub Actions low-RAM (`concurrency=1`) and weak local PCs
 * FUTURE = needs more RAM/CPU, or heavier GPU effects — do not enable in production yet
 */

export const CAPABILITIES = {
  now: {
    description:
      "Available today on GitHub Actions low-RAM and 4–8GB local machines.",
    motion: [
      "static",
      "static_hold",
      "slow_zoom_in",
      "slow_zoom_out",
      "zoom_in",
      "zoom_out",
      "pan_left",
      "pan_right",
      "pan_up",
      "pan_down",
      "pan_diagonal",
      "tilt_up",
      "tilt_down",
      "subtle_movement",
    ],
    textAnimation: [
      "none",
      "fade_in",
      "fade_out",
      "fade_up",
      "slide_up",
      "slide_left",
      "scale_in",
      "scale_up",
      "word_reveal",
      "dramatic_reveal",
      "sequential",
    ],
    transitions: [
      "none",
      "hard_cut",
      "fade",
      "fade_in_from_black",
      "fade_to_black",
      "crossfade",
      "cross_dissolve",
      "slide",
      "smooth_slide",
      "wipe_left",
      "zoom_punch",
    ],
    layers: [
      "image",
      "text",
      "title",
      "quote",
      "list",
      "highlighted_text",
      "lower_third",
      "chapter_card",
      "graphic.numbered_list",
      "graphic.key_statement",
      "graphic.audio_visualizer",
      "graphic.year_stamp",
    ],
    notes: [
      "Keep concurrency=1 on Actions.",
      "Prefer 1 image + 1–2 text overlays per beat.",
      "Cross-dissolve needs overlapping clips (~0.5–0.6s).",
      "Avoid heavy blur/particle stacks on free runners.",
    ],
  },
  future: {
    description:
      "Planned later when you have stronger render hardware or paid runners.",
    transitions: [
      "whip_pan",
      "whip_zoom",
      "glitch_cut",
      "soft_blur",
      "dissolve_smoke",
      "circle_pulse",
      "flash_cut",
    ],
    layers: [
      "video",
      "split_screen",
      "parallax_stack",
      "particle_overlay",
      "map_pin",
      "scripture_card_animated",
      "beat_synced_zoom",
    ],
    effects: [
      "real_glitch_rgb_split",
      "depth_of_field_blur",
      "smoke_particles",
      "3d_camera_moves",
      "webgl_shaders",
    ],
    notes: [
      "Needs 16GB+ RAM or paid GitHub/larger runners for reliable speed.",
      "Can still be authored in JSON later without changing Remotion architecture.",
    ],
  },
} as const;

export type CapabilityTier = keyof typeof CAPABILITIES;

/** Transitions that currently render as a real distinct effect (not just an alias). */
export const IMPLEMENTED_TRANSITIONS = new Set([
  "none",
  "hard_cut",
  "fade",
  "fade_in_from_black",
  "fade_to_black",
  "crossfade",
  "cross_dissolve",
  "slide",
  "smooth_slide",
  "wipe_left",
  "zoom_punch",
]);
