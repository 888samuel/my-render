import type { Fps, Frames, Seconds } from "../types/common";

export function secondsToFrames(seconds: Seconds, fps: Fps): Frames {
  if (!Number.isFinite(seconds) || !Number.isFinite(fps) || fps <= 0) {
    throw new Error(
      `ERROR:\nCannot convert seconds to frames (seconds=${String(seconds)}, fps=${String(fps)}).`,
    );
  }

  return Math.round(seconds * fps);
}

export function framesToSeconds(frames: Frames, fps: Fps): Seconds {
  if (!Number.isFinite(frames) || !Number.isFinite(fps) || fps <= 0) {
    throw new Error(
      `ERROR:\nCannot convert frames to seconds (frames=${String(frames)}, fps=${String(fps)}).`,
    );
  }

  return frames / fps;
}
