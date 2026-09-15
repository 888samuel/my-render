export type Seconds = number;
export type Frames = number;
export type Fps = number;

export type AssetId = string;
export type ClipId = string;
export type LayerId = string;

export type ImageFit = "contain" | "cover" | "centered_crop";

export type ImageOverlay = "none" | "dark_gradient";

export type LayerPlacement = "center" | "lower_third" | "left";

export type MotionType =
  | "none"
  | "static"
  | "slow_zoom_in"
  | "slow_zoom_out"
  | "pan_left"
  | "pan_right"
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
  | "sequential";

export type TransitionType = "none" | "fade" | "crossfade" | "slide";

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
