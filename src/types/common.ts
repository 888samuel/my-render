export type Seconds = number;
export type Frames = number;
export type Fps = number;

export type AssetId = string;
export type ClipId = string;
export type LayerId = string;

export type ImageFit = "contain" | "cover" | "centered_crop";

export type ImageOverlay = "none" | "dark_gradient";

export type LayerPlacement =
  | "center"
  | "lower_third"
  | "left"
  | "right"
  | "top_left"
  | "top_right"
  | "top_center"
  | "bottom_left"
  | "bottom_right"
  | "bottom_center"
  | "center_left"
  | "center_right"
  | "none";

export type MotionType =
  | "none"
  | "static"
  | "static_hold"
  | "slow_zoom_in"
  | "slow_zoom_out"
  | "zoom_in"
  | "zoom_out"
  | "pan_left"
  | "pan_right"
  | "pan_up"
  | "pan_down"
  | "pan_diagonal"
  | "tilt_up"
  | "tilt_down"
  | "subtle_movement";

export type TextAnimationType =
  | "none"
  | "fade_in"
  | "fade_out"
  | "slide_up"
  | "slide_left"
  | "scale_in"
  | "word_reveal"
  | "dramatic_reveal"
  | "sequential"
  | "fade_up"
  | "scale_up";

export type TransitionType =
  | "none"
  | "fade"
  | "crossfade"
  | "slide"
  | "hard_cut"
  | "cross_dissolve"
  | "fade_in_from_black"
  | "fade_to_black"
  | "smooth_slide"
  | "whip_pan"
  | "glitch_cut"
  | "zoom_punch"
  | "soft_blur"
  | "whip_zoom"
  | "flash_cut"
  | "wipe_left"
  | "dissolve_smoke"
  | "circle_pulse";

export type LayerType =
  | "image"
  | "video"
  | "text"
  | "title"
  | "quote"
  | "list"
  | "highlighted_text"
  | "graphic"
  | "transition";

export type GraphicKind =
  | "numbered_list"
  | "comparison"
  | "timeline"
  | "flow"
  | "key_statement"
  | "audio_visualizer";

export type AssetKind = "image" | "video" | "audio" | "font";
