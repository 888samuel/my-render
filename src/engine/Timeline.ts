import type { EditPlan } from "../types/edit-plan";
import type { Frames } from "../types/common";
import { secondsToFrames } from "../utils/time";

export type TimedClip = {
  clip: EditPlan["clips"][number];
  startFrame: Frames;
  durationInFrames: Frames;
};

export function getVideoDurationSeconds(editPlan: EditPlan): number {
  if (editPlan.video.duration_sec !== undefined) {
    return editPlan.video.duration_sec;
  }

  const clipEndTimes = editPlan.clips.map((clip) => clip.end_sec);
  return Math.max(0, ...clipEndTimes);
}

export function buildTimeline(editPlan: EditPlan): TimedClip[] {
  const fps = editPlan.video.fps;

  return editPlan.clips.map((clip) => ({
    clip,
    startFrame: secondsToFrames(clip.start_sec, fps),
    durationInFrames: secondsToFrames(clip.end_sec - clip.start_sec, fps),
  }));
}
