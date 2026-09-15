import type {
  AssetId,
  ClipId,
  ImageFit,
  ImageOverlay,
  LayerId,
  LayerPlacement,
  MotionType,
  Seconds,
  TextAnimationType,
  TransitionType,
} from "./common";

export type Motion = {
  type: MotionType;
  intensity?: number;
};

export type TextAnimation = {
  type: TextAnimationType;
};

export type Transition = {
  type: TransitionType;
  duration_sec?: Seconds;
};

export type LayerTiming = {
  id?: LayerId;
  /**
   * Absolute timeline time. If omitted, the layer starts with its parent clip.
   */
  start_sec?: Seconds;
  /**
   * Absolute timeline time. If omitted, the layer ends with its parent clip.
   */
  end_sec?: Seconds;
  placement?: LayerPlacement;
};

export type ImageLayer = LayerTiming & {
  type: "image";
  asset_id?: AssetId;
  src?: string;
  fit?: ImageFit;
  motion?: Motion;
  overlay?: ImageOverlay;
};

export type VideoLayer = LayerTiming & {
  type: "video";
  asset_id: AssetId;
};

export type TextLayer = LayerTiming & {
  type: "text";
  text: string;
  animation?: TextAnimation;
};

export type TitleLayer = LayerTiming & {
  type: "title";
  text: string;
  animation?: TextAnimation;
};

export type QuoteLayer = LayerTiming & {
  type: "quote";
  text: string;
  attribution?: string;
  animation?: TextAnimation;
};

export type ListLayer = LayerTiming & {
  type: "list";
  style?: "numbered" | "bullet";
  items: string[];
  animation?: TextAnimation;
};

export type HighlightedTextLayer = LayerTiming & {
  type: "highlighted_text";
  text: string;
  highlight?: string;
  animation?: TextAnimation;
};

export type NumberedListGraphicLayer = LayerTiming & {
  type: "graphic";
  graphic: "numbered_list";
  items: Array<{ number?: string; label: string }>;
  animation?: TextAnimation;
};

export type ComparisonGraphicLayer = LayerTiming & {
  type: "graphic";
  graphic: "comparison";
  left: { title: string; items: string[] };
  right: { title: string; items: string[] };
};

export type TimelineGraphicLayer = LayerTiming & {
  type: "graphic";
  graphic: "timeline";
  events: Array<{ label: string; time_label?: string }>;
};

export type FlowGraphicLayer = LayerTiming & {
  type: "graphic";
  graphic: "flow";
  steps: Array<{ label: string }>;
};

export type KeyStatementGraphicLayer = LayerTiming & {
  type: "graphic";
  graphic: "key_statement";
  text: string;
  animation?: TextAnimation;
};

export type AudioVisualizerGraphicLayer = LayerTiming & {
  type: "graphic";
  graphic: "audio_visualizer";
  variant?: "bars" | "waveform";
};

export type GraphicLayer =
  | NumberedListGraphicLayer
  | ComparisonGraphicLayer
  | TimelineGraphicLayer
  | FlowGraphicLayer
  | KeyStatementGraphicLayer
  | AudioVisualizerGraphicLayer;

export type TransitionLayer = LayerTiming & {
  type: "transition";
  transition: Transition;
};

export type Layer =
  | ImageLayer
  | VideoLayer
  | TextLayer
  | TitleLayer
  | QuoteLayer
  | ListLayer
  | HighlightedTextLayer
  | GraphicLayer
  | TransitionLayer;

export type Clip = {
  id: ClipId;
  start_sec: Seconds;
  end_sec: Seconds;
  layers: Layer[];
  transition_in?: Transition;
  transition_out?: Transition;
};

export type VideoSettings = {
  id: string;
  width: number;
  height: number;
  fps: number;
  /**
   * Optional explicit duration. If omitted, the engine uses the last clip end time.
   */
  duration_sec?: Seconds;
};

export type AudioTrack = {
  src: string;
  start_sec?: Seconds;
};

export type EditPlan = {
  version: string;
  video: VideoSettings;
  audio?: AudioTrack;
  clips: Clip[];
};
