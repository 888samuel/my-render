import type { EditPlan } from "../types/edit-plan";
import { hasAsset } from "../engine/AssetResolver";

export function validateAssets(plan: EditPlan): void {
  for (const clip of plan.clips) {
    if (clip.src || clip.asset_id) {
      assertImage(clip.id, clip.src, clip.asset_id);
    }

    for (const media of clip.media ?? []) {
      if (!media.src) {
        throw new Error(
          `ERROR:\nClip "${clip.id}" has a media layer with no src.`,
        );
      }
    }

    for (const layer of clip.layers) {
      if (layer.type === "image_sequence") {
        if (layer.frames.length === 0) {
          throw new Error(
            `ERROR:\nClip "${clip.id}" has an image sequence with no frames.`,
          );
        }
        continue;
      }

      if (layer.type === "media") {
        if (!layer.src) {
          throw new Error(
            `ERROR:\nClip "${clip.id}" has a media layer with no src.`,
          );
        }
        continue;
      }

      if (layer.type === "counter") {
        if (!Number.isFinite(layer.from) || !Number.isFinite(layer.to)) {
          throw new Error(
            `ERROR:\nClip "${clip.id}" has a counter with no from/to values.`,
          );
        }
        continue;
      }

      if (layer.type === "vector" && !layer.shape) {
        throw new Error(
          `ERROR:\nClip "${clip.id}" has a vector layer with no shape.`,
        );
      }

      if (layer.type !== "image" && layer.type !== "video") {
        continue;
      }

      if (layer.type === "image") {
        assertImage(clip.id, layer.src, layer.asset_id);
        continue;
      }

      if (!layer.asset_id || !hasAsset(layer.asset_id)) {
        throw new Error(
          `ERROR:\nAsset "${layer.asset_id}" referenced by clip "${clip.id}" does not exist.`,
        );
      }
    }
  }
}

function assertImage(
  clipId: string,
  src: string | undefined,
  assetId: string | undefined,
): void {
  if (src) {
    return;
  }

  if (!assetId || !hasAsset(assetId)) {
    throw new Error(
      `ERROR:\nAsset "${assetId ?? ""}" referenced by clip "${clipId}" does not exist.`,
    );
  }
}
