const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".mkv", ".m4v"] as const;

export type PlaybackInput = {
  trim_start_sec?: number;
  trim_end_sec?: number;
  playback_rate?: number;
  volume?: number;
  muted?: boolean;
  loop?: boolean;
};

export type ResolvedPlayback = {
  trimStartSec: number;
  trimEndSec?: number;
  playbackRate: number;
  volume: number;
  muted: boolean;
  loop: boolean;
};

export type FootageWindow = {
  trimStartSec: number;
  trimEndSec: number;
  /** How many timeline frames the trimmed range lasts at this speed. */
  contentFrames: number;
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
    input.volume !== undefined ||
    input.muted !== undefined ||
    input.loop !== undefined
  );
}

export function resolvePlayback(input: PlaybackInput = {}): ResolvedPlayback {
  const volume = input.volume ?? 1;

  return {
    trimStartSec: input.trim_start_sec ?? 0,
    trimEndSec: input.trim_end_sec,
    playbackRate: input.playback_rate ?? 1,
    volume,
    muted: input.muted === true || volume <= 0,
    loop: input.loop === true,
  };
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
}

/**
 * Clamp the authored trim to the file, then convert it to timeline frames.
 * Speed lives here: 2 seconds of footage at 2x lasts 1 second on the timeline.
 */
export function footageWindow(
  playback: ResolvedPlayback,
  sourceDurationSec: number,
  fps: number,
): FootageWindow {
  if (!Number.isFinite(sourceDurationSec) || sourceDurationSec <= 0) {
    throw new Error("ERROR:\nVideo file has no duration.");
  }

  if (!Number.isFinite(fps) || fps <= 0) {
    throw new Error("ERROR:\nVideo fps must be above 0.");
  }

  const trimStartSec = Math.min(Math.max(0, playback.trimStartSec), sourceDurationSec);
  const trimEndSec = Math.min(playback.trimEndSec ?? sourceDurationSec, sourceDurationSec);

  if (trimEndSec <= trimStartSec) {
    throw new Error(
      `ERROR:\nVideo trim ${String(trimStartSec)}s → ${String(trimEndSec)}s is outside the file (${String(sourceDurationSec)}s).`,
    );
  }

  const contentFrames = Math.max(
    1,
    Math.round(((trimEndSec - trimStartSec) / playback.playbackRate) * fps),
  );

  return { trimStartSec, trimEndSec, contentFrames };
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
  loop: boolean;
}): { frame: number; holding: boolean } {
  const span = options.window.contentFrames;
  const holding = !options.loop && options.timelineFrame >= span;
  const played = options.loop
    ? options.timelineFrame % span
    : Math.min(options.timelineFrame, span - 1);
  const sourceSec =
    options.window.trimStartSec + (played / options.fps) * options.playbackRate;

  return {
    frame: Math.max(0, Math.round(sourceSec * options.fps)),
    holding,
  };
}
