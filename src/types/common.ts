export type Seconds = number;
export type Frames = number;
export type Fps = number;

export type AssetId = string;
export type ClipId = string;
export type LayerId = string;

export type ImageFit = "contain" | "cover" | "centered_crop";

export type ImageOverlay =
  | "none"
  | "dark_gradient"
  | "vignette"
  | "spotlight"
  | "warm";

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
  | "subtle_movement"
  | "drift"
  | "breathe"
  | "float"
  | "pop_in"
  | "slide_in"
  | "ken_burns"
  | "focus_pull"
  | "orbit"
  | "sway";

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
  | "scale_up"
  | "kinetic"
  | "typewriter"
  | "voice"
  | "voice_words"
  | "follow"
  | "dim_past"
  | "word_box"
  | "wipe"
  | "underline"
  | "ghost"
  | "word_rise"
  | "focus"
  | "lines"
  | "clauses"
  | "punch"
  | "decode"
  | "stroke"
  | "marker"
  | "mask_up"
  | "letter_rise"
  | "shimmer"
  | "wave";

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

export type GraphicKind =
  | "numbered_list"
  | "comparison"
  | "timeline"
  | "flow"
  | "key_statement"
  | "audio_visualizer"
  | "lower_third"
  | "chapter_card"
  | "year_stamp";

export type LayerType =
  | "image"
  | "image_sequence"
  | "media"
  | "counter"
  | "vector"
  | "video"
  | "text"
  | "title"
  | "quote"
  | "list"
  | "highlighted_text"
  | "lower_third"
  | "chapter_card"
  | "callout"
  | "chips"
  | "progress"
  | "graphic"
  | "transition";

export type AssetKind = "image" | "video" | "audio" | "font";
