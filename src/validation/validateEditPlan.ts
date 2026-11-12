import { normalizeLook } from "../engine/artisticLook";
import { listAudioTracks } from "../engine/audioTracks";
import {
  assertPlayback,
  mediaKind,
  playbackHasEdits,
} from "../engine/videoPlayback";
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

  assertKnownLook(plan.video.look, "Video settings");

  for (const clip of plan.clips) {
    if (clip.end_sec <= clip.start_sec) {
      throw new Error(
        `ERROR:\nClip "${clip.id}" ends before it starts (${String(clip.start_sec)}s → ${String(clip.end_sec)}s).`,
      );
    }

    assertKnownLook(clip.look, `Clip "${clip.id}"`);

    if (mediaKind(clip) === "video") {
      assertPlayback(clip, `Clip "${clip.id}"`);
    } else if (playbackHasEdits(clip)) {
      throw new Error(
        `ERROR:\nClip "${clip.id}" sets trim, speed, or volume, but the shot is not video.`,
      );
    }

    for (const layer of clip.layers) {
      if (layer.type === "image" || layer.type === "video") {
        assertKnownLook(layer.look, `Clip "${clip.id}" ${layer.type}`);
      }

      if (layer.type !== "video") {
        continue;
      }

      assertPlayback(layer, `Clip "${clip.id}" video`);
      if (
        layer.opacity !== undefined &&
        (!Number.isFinite(layer.opacity) ||
          layer.opacity < 0 ||
          layer.opacity > 1)
      ) {
        throw new Error(
          `ERROR:\nClip "${clip.id}" video opacity must be between 0 and 1.`,
        );
      }
    }
  }

  for (const track of listAudioTracks(plan.audio)) {
    if (!track.src.trim()) {
      throw new Error("ERROR:\nAn audio track is missing src.");
    }

    assertPlayback(track, `Audio "${track.src}"`);
    const start = track.start_sec ?? 0;
    if (track.end_sec !== undefined && track.end_sec <= start) {
      throw new Error(
        `ERROR:\nAudio "${track.src}" ends before it starts (${String(start)}s → ${String(track.end_sec)}s).`,
      );
    }
  }
}

function assertKnownLook(look: string | undefined, where: string): void {
  if (look === undefined) {
    return;
  }

  try {
    normalizeLook(look);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message.replace(/^ERROR:\n/, "")
        : String(error);
    throw new Error(`ERROR:\n${where}: ${message}`);
  }
}
