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
  VideoLook,
} from "./common";

export type MotionFrom = "left" | "right" | "top" | "bottom";

export type Motion = {
  type: MotionType;
  intensity?: number;
  /** Edge a slide_in starts from. Defaults to bottom. */
  from?: MotionFrom;
  /**
   * How much this layer follows the clip camera and its own move.
   * 0.5 sits back, 1 matches the camera, 1.5 pushes forward.
   */
  parallaxFactor?: number;
};

export type MediaPlacement =
  "center" | "center_left" | "center_right" | "top_center" | "bottom_center";

export type CameraType =
  "push_in" | "pull_out" | "drift_left" | "drift_right" | "rise" | "settle";

export type CameraMove = {
  type: CameraType;
  intensity?: number;
};

/** One transparent picture in a stacked shot. Omit placement to fill the frame. */
export type MediaLayer = ImagePlacement & {
  zIndex: number;
  src: string;
  placement?: MediaPlacement;
  opacity?: number;
  fit?: ImageFit;
  motion?: Motion;
  id?: LayerId;
  start_sec?: Seconds;
  end_sec?: Seconds;
};

/**
 * Position of an illustrated piece inside the frame.
 * Percents are 0–100. Omit all of them to fill the frame like a photograph.
 */
export type ImagePlacement = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export type TextAnimation = {
  type: TextAnimationType;
  /**
   * When true (default), text fades out near the end of its layer window.
   * `voice` ignores this and stays up until the layer ends, because that
   * window is the spoken line.
   */
  auto_exit?: boolean;
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

export type ImageLayer = LayerTiming &
  ImagePlacement & {
    type: "image";
    asset_id?: AssetId;
    src?: string;
    fit?: ImageFit;
    motion?: Motion;
    overlay?: ImageOverlay;
    /** Grade for this still. Omit to inherit the shot, then the video default. */
    look?: VideoLook;
  };

export type ImageSequenceLayer = LayerTiming &
  ImagePlacement & {
    type: "image_sequence";
    /** Public paths, played in order. A short loop such as a blink. */
    frames: string[];
    playback_fps?: number;
    loop?: boolean;
    fit?: ImageFit;
    motion?: Motion;
  };

/**
 * How a footage file plays inside a shot.
 * Times are seconds in the source file, not the timeline.
 */
export type VideoPlayback = {
  /** In-point. The shot starts this far into the file. */
  trim_start_sec?: Seconds;
  /**
   * Out-point. Omit to use the end of the file.
   * The timeline length of the trim is divided by playback_rate.
   */
  trim_end_sec?: Seconds;
  /** 1 is normal. 0.5 is half speed, 2 is double. */
  playback_rate?: number;
  /**
   * Speed at the end of the shot. The rate eases from playback_rate to this.
   * Omit it for one constant speed.
   */
  playback_rate_end?: number;
  /** Linear gain from 0 to 1. Defaults to 1. Use 0 under narration. */
  volume?: number;
  muted?: boolean;
  /**
   * Repeat the trimmed range when the shot is longer than the footage.
   * Otherwise the last frame holds.
   */
  loop?: boolean;
  /** Play the trim backwards. The rate stays positive. */
  reverse?: boolean;
  /**
   * Stretch the trim so it fills this shot.
   * Leave playback_rate unset. A ramp is not used.
   */
  conform?: boolean;
  /** Hold trim_start_sec for the whole shot. */
  freeze?: boolean;
  /** Fade the footage's own audio in, in seconds. */
  audio_fade_in_sec?: Seconds;
  /** Fade the footage's own audio out, in seconds. */
  audio_fade_out_sec?: Seconds;
  /**
   * Where a cover crop sits, 0–100.
   * 0 is the left or top edge. 50 is the center.
   */
  focus_x?: number;
  focus_y?: number;
};

export type VideoLayer = LayerTiming &
  ImagePlacement &
  VideoPlayback & {
    type: "video";
    asset_id?: AssetId;
    src?: string;
    fit?: ImageFit;
    motion?: Motion;
    overlay?: ImageOverlay;
    opacity?: number;
    /**
     * Grade for this window only.
     * Omit to inherit the shot look. "none" keeps this window clean.
     */
    look?: VideoLook;
  };

export type MediaLayerItem = LayerTiming &
  MediaLayer & {
    type: "media";
  };

export type CounterLayer = LayerTiming & {
  type: "counter";
  from: number;
  to: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label?: string;
};

export type VectorShape = "line" | "circle" | "arrow" | "bar" | "underline";

export type VectorLayer = LayerTiming & {
  type: "vector";
  shape: VectorShape;
  color?: string;
  strokeWidth?: number;
};

export type TextLayer = LayerTiming & {
  type: "text";
  text: string;
  variant?: "title" | "subtitle" | "body" | "highlighted_text" | "quote";
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

export type LowerThirdLayer = LayerTiming & {
  type: "lower_third";
  title: string;
  subtitle?: string;
  animation?: TextAnimation;
};

/** Short labels that pop in one after another, then keep a small float. */
export type ChipsLayer = LayerTiming & {
  type: "chips";
  items: string[];
};

/** A bar that fills across the layer. The number ticks as it moves. */
export type ProgressLayer = LayerTiming & {
  type: "progress";
  label?: string;
};

/** A short fact held in a corner so the picture stays readable. */
export type CalloutLayer = LayerTiming & {
  type: "callout";
  kicker?: string;
  text: string;
  detail?: string;
  animation?: TextAnimation;
};

export type ChapterCardLayer = LayerTiming & {
  type: "chapter_card";
  eyebrow?: string;
  title: string;
  subtitle?: string;
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

export type LowerThirdGraphicLayer = LayerTiming & {
  type: "graphic";
  graphic: "lower_third";
  title: string;
  subtitle?: string;
  animation?: TextAnimation;
};

export type ChapterCardGraphicLayer = LayerTiming & {
  type: "graphic";
  graphic: "chapter_card";
  eyebrow?: string;
  title: string;
  subtitle?: string;
  animation?: TextAnimation;
};

export type YearStampGraphicLayer = LayerTiming & {
  type: "graphic";
  graphic: "year_stamp";
  text: string;
  animation?: TextAnimation;
};

export type GraphicLayer =
  | NumberedListGraphicLayer
  | ComparisonGraphicLayer
  | TimelineGraphicLayer
  | FlowGraphicLayer
  | KeyStatementGraphicLayer
  | AudioVisualizerGraphicLayer
  | LowerThirdGraphicLayer
  | ChapterCardGraphicLayer
  | YearStampGraphicLayer;

export type TransitionLayer = LayerTiming & {
  type: "transition";
  transition: Transition;
};

export type Layer =
  | ImageLayer
  | ImageSequenceLayer
  | MediaLayerItem
  | CounterLayer
  | VectorLayer
  | VideoLayer
  | TextLayer
  | TitleLayer
  | QuoteLayer
  | ListLayer
  | HighlightedTextLayer
  | LowerThirdLayer
  | CalloutLayer
  | ChipsLayer
  | ProgressLayer
  | ChapterCardLayer
  | GraphicLayer
  | TransitionLayer;

export type Clip = {
  id: ClipId;
  start_sec: Seconds;
  end_sec: Seconds;
  layers: Layer[];
  transition_in?: Transition;
  transition_out?: Transition;
  /**
   * Background for the whole clip. "image" is the default.
   * "video" plays the file, with trim and speed. A path ending in
   * .mp4, .webm, .mov, .mkv, or .m4v is video even when this is omitted.
   */
  source?: "image" | "video";
  /**
   * Background picture or footage. Plans store this on the clip
   * instead of as a layer.
   */
  asset_id?: AssetId;
  src?: string;
  fit?: ImageFit;
  overlay?: ImageOverlay;
  motion?: Motion;
  /**
   * Artistic grade for the plate.
   * A video layer can override it. Omit to use video.look.
   */
  look?: VideoLook;
  trim_start_sec?: Seconds;
  trim_end_sec?: Seconds;
  playback_rate?: number;
  playback_rate_end?: number;
  volume?: number;
  muted?: boolean;
  loop?: boolean;
  reverse?: boolean;
  conform?: boolean;
  freeze?: boolean;
  audio_fade_in_sec?: Seconds;
  audio_fade_out_sec?: Seconds;
  focus_x?: number;
  focus_y?: number;
  /** Shared move. Each picture follows it by its own parallaxFactor. */
  camera?: CameraMove;
  /** Extra pictures stacked by zIndex. The clip src remains the back plate. */
  media?: MediaLayer[];
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
  /**
   * Grade for every shot that does not set its own look.
   * "none" and omitting it leave the picture untouched.
   */
  look?: VideoLook;
};

export type AudioTrack = {
  src: string;
  /** Timeline time when this bed starts. */
  start_sec?: Seconds;
  /** Timeline time when this bed stops. Omit to play through the video. */
  end_sec?: Seconds;
  /** In-point in the audio file. */
  trim_start_sec?: Seconds;
  /**
   * Out-point in the audio file. The bed stops when the trim or
   * `end_sec` is reached, whichever comes first.
   */
  trim_end_sec?: Seconds;
  /** 0–1. Defaults to 1. */
  volume?: number;
  playback_rate?: number;
  loop?: boolean;
};

export type EditPlan = {
  version: string;
  video: VideoSettings;
  /** One narration file, or a list of beds (narration, music, effects). */
  audio?: AudioTrack | AudioTrack[];
  clips: Clip[];
};
