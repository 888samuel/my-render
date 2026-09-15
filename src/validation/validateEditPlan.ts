import type { EditPlan } from "../types/edit-plan";

export function validateEditPlan(plan: EditPlan): void {
  if (!plan.version) {
    throw new Error("ERROR:\nEdit plan is missing a version.");
  }

  if (!plan.video) {
    throw new Error("ERROR:\nEdit plan is missing video settings.");
  }

  if (!Array.isArray(plan.clips)) {
    throw new Error("ERROR:\nEdit plan clips must be an array.");
  }

  for (const clip of plan.clips) {
    if (clip.end_sec <= clip.start_sec) {
      throw new Error(
        `ERROR:\nClip "${clip.id}" ends before it starts (${String(clip.start_sec)}s → ${String(clip.end_sec)}s).`,
      );
    }
  }
}
