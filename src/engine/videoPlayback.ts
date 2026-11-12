const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".mkv", ".m4v"] as const;

export type PlaybackInput = {
  trim_start_sec?: number;
  trim_end_sec?: number;
  playback_rate?: number;
  playback_rate_end?: number;
  volume?: number;
  muted?: boolean;
  loop?: boolean;
  reverse?: boolean;
  conform?: boolean;
  freeze?: boolean;
  audio_fade_in_sec?: number;
  audio_fade_out_sec?: number;
  focus_x?: number;
  focus_y?: number;
};

export type ResolvedPlayback = {
  trimStartSec: number;
  trimEndSec?: number;
  playbackRate: number;
  /** Set only when the shot eases from playbackRate to another speed. */
  playbackRateEnd?: number;
  volume: number;
  muted: boolean;
  loop: boolean;
  reverse: boolean;
  conform: boolean;
  freeze: boolean;
  audioFadeInSec: number;
  audioFadeOutSec: number;
  focusX: number;
  focusY: number;
};

export type FootageWindow = {
  trimStartSec: number;
  trimEndSec: number;
  /** How many timeline frames the trimmed range lasts at this speed. */
  contentFrames: number;
  /** Speed at the first frame. A conformed shot stores the fitted speed here. */
  rateStart: number;
  /** Speed at the last frame. Equal to rateStart when the shot does not ramp. */
  rateEnd: number;
};

export function isRemoteSrc(src: string): boolean {
  return /^https?:\/\//i.test(src);
}

export function isVideoSrc(src: string): boolean {
  const clean = src.split("?")[0]?.split("#")[0]?.toLowerCase() ?? "";
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext));
}

export function mediaKind(input: {
  source?: "image" | "video";
  src?: string;
  asset_id?: string;
}): "image" | "video" {
  if (input.source) {
    return input.source;
  }

  if (input.src && isVideoSrc(input.src)) {
    return "video";
  }

  if (
    input.asset_id &&
    (/^vid[_-]?\d+$/i.test(input.asset_id) || isVideoSrc(input.asset_id))
  ) {
    return "video";
  }

  return "image";
}

export function playbackHasEdits(input: PlaybackInput): boolean {
  return (
    input.trim_start_sec !== undefined ||
    input.trim_end_sec !== undefined ||
    input.playback_rate !== undefined ||
    input.playback_rate_end !== undefined ||
    input.volume !== undefined ||
    input.muted !== undefined ||
    input.loop !== undefined ||
    input.reverse !== undefined ||
    input.conform !== undefined ||
    input.freeze !== undefined ||
    input.audio_fade_in_sec !== undefined ||
    input.audio_fade_out_sec !== undefined ||
    input.focus_x !== undefined ||
    input.focus_y !== undefined
  );
}

/** Copy the footage controls from a clip onto its plate layer. */
export function playbackInputOf(input: PlaybackInput): PlaybackInput {
  return {
    trim_start_sec: input.trim_start_sec,
    trim_end_sec: input.trim_end_sec,
    playback_rate: input.playback_rate,
    playback_rate_end: input.playback_rate_end,
    volume: input.volume,
    muted: input.muted,
    loop: input.loop,
    reverse: input.reverse,
    conform: input.conform,
    freeze: input.freeze,
    audio_fade_in_sec: input.audio_fade_in_sec,
    audio_fade_out_sec: input.audio_fade_out_sec,
    focus_x: input.focus_x,
    focus_y: input.focus_y,
  };
}

export function resolvePlayback(input: PlaybackInput = {}): ResolvedPlayback {
  const volume = input.volume ?? 1;
  const playbackRate = input.playback_rate ?? 1;
  const playbackRateEnd = input.playback_rate_end;
  const ramped =
    playbackRateEnd !== undefined && playbackRateEnd !== playbackRate;

  return {
    trimStartSec: input.trim_start_sec ?? 0,
    trimEndSec: input.trim_end_sec,
    playbackRate,
    playbackRateEnd: ramped ? playbackRateEnd : undefined,
    volume,
    muted: input.muted === true || volume <= 0,
    loop: input.loop === true,
    reverse: input.reverse === true,
    conform: input.conform === true,
    freeze: input.freeze === true,
    audioFadeInSec: input.audio_fade_in_sec ?? 0,
    audioFadeOutSec: input.audio_fade_out_sec ?? 0,
    focusX: input.focus_x ?? 50,
    focusY: input.focus_y ?? 50,
  };
}

/**
 * A straight forward cut can use the video's own clock, so its sound stays
 * in sync. Reverse, ramps, loops, and freezes step through frames instead.
 */
export function canPlayNatively(playback: ResolvedPlayback): boolean {
  return (
    !playback.reverse &&
    !playback.freeze &&
    !playback.loop &&
    playback.playbackRateEnd === undefined
  );
}

export function assertPlayback(input: PlaybackInput, label: string): void {
  const start = input.trim_start_sec;
  const end = input.trim_end_sec;
  const rate = input.playback_rate;
  const volume = input.volume;

  if (start !== undefined && (!Number.isFinite(start) || start < 0)) {
    throw new Error(
      `ERROR:\n${label} trim_start_sec must be a time of 0 or more.`,
    );
  }

  if (end !== undefined && (!Number.isFinite(end) || end <= 0)) {
    throw new Error(`ERROR:\n${label} trim_end_sec must be a time above 0.`);
  }

  if (start !== undefined && end !== undefined && end <= start) {
    throw new Error(
      `ERROR:\n${label} trim ends at ${String(end)}s, before it starts at ${String(start)}s.`,
    );
  }

  if (
    rate !== undefined &&
    (!Number.isFinite(rate) || rate <= 0 || rate > 16)
  ) {
    throw new Error(
      `ERROR:\n${label} playback_rate must be above 0 and at most 16.`,
    );
  }

  if (
    volume !== undefined &&
    (!Number.isFinite(volume) || volume < 0 || volume > 1)
  ) {
    throw new Error(`ERROR:\n${label} volume must be between 0 and 1.`);
  }

  if (input.muted !== undefined && typeof input.muted !== "boolean") {
    throw new Error(`ERROR:\n${label} muted must be true or false.`);
  }

  if (input.loop !== undefined && typeof input.loop !== "boolean") {
    throw new Error(`ERROR:\n${label} loop must be true or false.`);
  }

  assertRate(input.playback_rate_end, `${label} playback_rate_end`);
  assertFlag(input.reverse, `${label} reverse`);
  assertFlag(input.conform, `${label} conform`);
  assertFlag(input.freeze, `${label} freeze`);
  assertFade(input.audio_fade_in_sec, `${label} audio_fade_in_sec`);
  assertFade(input.audio_fade_out_sec, `${label} audio_fade_out_sec`);
  assertFocus(input.focus_x, `${label} focus_x`);
  assertFocus(input.focus_y, `${label} focus_y`);

  if (input.conform && (input.playback_rate !== undefined || input.playback_rate_end !== undefined)) {
    throw new Error(
      `ERROR:\n${label} conform fills the shot, so leave playback_rate unset.`,
    );
  }

  if (
    input.freeze &&
    (input.conform ||
      input.reverse ||
      input.loop ||
      input.playback_rate_end !== undefined)
  ) {
    throw new Error(
      `ERROR:\n${label} freeze holds one frame, so leave speed, reverse, and loop unset.`,
    );
  }
}

function assertRate(rate: number | undefined, label: string): void {
  if (rate === undefined) {
    return;
  }

  if (!Number.isFinite(rate) || rate <= 0 || rate > 16) {
    throw new Error(`ERROR:\n${label} must be above 0 and at most 16.`);
  }
}

function assertFlag(value: boolean | undefined, label: string): void {
  if (value !== undefined && typeof value !== "boolean") {
    throw new Error(`ERROR:\n${label} must be true or false.`);
  }
}

function assertFade(value: number | undefined, label: string): void {
  if (value === undefined) {
    return;
  }

  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`ERROR:\n${label} must be 0 or more seconds.`);
  }
}

function assertFocus(value: number | undefined, label: string): void {
  if (value === undefined) {
    return;
  }

  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`ERROR:\n${label} must be between 0 and 100.`);
  }
}

/**
 * Clamp the authored trim to the file, then convert it to timeline frames.
 * Speed lives here: 2 seconds of footage at 2x lasts 1 second on the timeline.
 */
export function footageWindow(
  playback: ResolvedPlayback,
  sourceDurationSec: number,
  fps: number,
  shotFrames?: number,
): FootageWindow {
  if (!Number.isFinite(sourceDurationSec) || sourceDurationSec <= 0) {
    throw new Error("ERROR:\nVideo file has no duration.");
  }

  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error("ERROR:\nVideo fps must be above 0.");
  }

  const trimStartSec = Math.min(
    Math.max(0, playback.trimStartSec),
    sourceDurationSec,
  );
  const trimEndSec = Math.min(
    playback.trimEndSec ?? sourceDurationSec,
    sourceDurationSec,
  );

  if (trimEndSec <= trimStartSec) {
    throw new Error(
      `ERROR:\nVideo trim ${String(trimStartSec)}s → ${String(trimEndSec)}s is outside the file (${String(sourceDurationSec)}s).`,
    );
  }

  const length = trimEndSec - trimStartSec;
  let rateStart = playback.playbackRate;
  let rateEnd = playback.playbackRateEnd ?? playback.playbackRate;
  let contentFrames: number;

  if (playback.freeze) {
    rateStart = 0;
    rateEnd = 0;
    contentFrames = 1;
  } else if (playback.conform) {
    if (shotFrames === undefined || shotFrames < 1) {
      throw new Error("ERROR:\nconform needs the shot length.");
    }
    const fitted = length / (shotFrames / fps);
    assertRate(fitted, "Conformed playback_rate");
    rateStart = fitted;
    rateEnd = fitted;
    contentFrames = shotFrames;
  } else {
    const average = (rateStart + rateEnd) / 2;
    contentFrames = Math.max(1, Math.round((length / average) * fps));
  }

  return { trimStartSec, trimEndSec, contentFrames, rateStart, rateEnd };
}

/** Linear gain for the footage's own audio, including the in and out fades. */
export function footageGain(options: {
  frame: number;
  durationInFrames: number;
  volume: number;
  fadeInSec: number;
  fadeOutSec: number;
  fps: number;
}): number {
  let gain = options.volume;
  const fadeInFrames = options.fadeInSec * options.fps;
  if (fadeInFrames > 0) {
    gain *= Math.min(1, options.frame / fadeInFrames);
  }

  const fadeOutFrames = options.fadeOutSec * options.fps;
  if (fadeOutFrames > 0) {
    const remaining = options.durationInFrames - 1 - options.frame;
    gain *= Math.min(1, Math.max(0, remaining) / fadeOutFrames);
  }

  return Math.min(1, Math.max(0, gain));
}

/**
 * Source frame to show for this timeline frame.
 * Frames use the composition fps, which is also how Remotion seeks the file.
 */
export function sampleFootage(options: {
  timelineFrame: number;
  fps: number;
  window: FootageWindow;
  playbackRate: number;
  playbackRateEnd?: number;
  loop: boolean;
  reverse?: boolean;
  freeze?: boolean;
}): { frame: number; holding: boolean } {
  if (options.freeze) {
    return {
      frame: Math.max(0, Math.round(options.window.trimStartSec * options.fps)),
      holding: true,
    };
  }

  const span = options.window.contentFrames;
  const holding = !options.loop && options.timelineFrame >= span;
  const played = options.loop
    ? ((options.timelineFrame % span) + span) % span
    : Math.min(Math.max(0, options.timelineFrame), span - 1);
  const rateStart = options.playbackRate;
  const rateEnd = options.playbackRateEnd ?? rateStart;
  const sourceSec = sourceTime({
    played,
    span,
    fps: options.fps,
    trimStart: options.window.trimStartSec,
    trimEnd: options.window.trimEndSec,
    rateStart,
    rateEnd,
    reverse: options.reverse === true,
  });

  return {
    frame: Math.max(0, Math.round(sourceSec * options.fps)),
    holding,
  };
}

/**
 * Where the playhead is in the file.
 * A constant speed keeps the original trim math. A ramp eases across the trim.
 */
function sourceTime(options: {
  played: number;
  span: number;
  fps: number;
  trimStart: number;
  trimEnd: number;
  rateStart: number;
  rateEnd: number;
  reverse: boolean;
}): number {
  const length = options.trimEnd - options.trimStart;
  let offset: number;

  if (options.rateStart === options.rateEnd) {
    offset = (options.played / options.fps) * options.rateStart;
  } else {
    const progress = options.span <= 1 ? 0 : options.played / options.span;
    const average = (options.rateStart + options.rateEnd) / 2;
    const integral =
      options.rateStart * progress +
      ((options.rateEnd - options.rateStart) * progress * progress) / 2;
    offset = (integral / average) * length;
  }

  const clamped = Math.min(length, Math.max(0, offset));
  const time = options.reverse
    ? options.trimEnd - clamped
    : options.trimStart + clamped;
  // The out-point is exclusive, so a reverse starts on the frame before it.
  if (options.reverse && time >= options.trimEnd) {
    return Math.max(options.trimStart, options.trimEnd - 1 / options.fps);
  }
  return time;
}
