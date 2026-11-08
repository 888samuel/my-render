import type { EditPlan } from "../types/edit-plan";
import { hasAsset } from "../engine/AssetResolver";
import { isRemoteSrc, isVideoSrc, mediaKind } from "../engine/videoPlayback";

export function validateAssets(plan: EditPlan): void {
  for (const clip of plan.clips) {
    assertClipMedia(clip);

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

      if (layer.type === "image") {
        if (layer.src && isVideoSrc(layer.src)) {
          throw new Error(
            `ERROR:\nClip "${clip.id}" uses a video file on an image layer. Use type "video".`,
          );
        }
        assertImage(clip.id, layer.src, layer.asset_id);
        continue;
      }

      if (layer.type === "video") {
        assertVideo(clip.id, layer.src, layer.asset_id);
      }
    }
  }
}

function assertClipMedia(clip: EditPlan["clips"][number]): void {
  const kind = mediaKind(clip);

  if (kind === "video") {
    assertVideo(clip.id, clip.src, clip.asset_id);
    return;
  }

  if (clip.src && isVideoSrc(clip.src)) {
    throw new Error(
      `ERROR:\nClip "${clip.id}" points at a video file. Set "source": "video".`,
    );
  }

  if (clip.src || clip.asset_id) {
    assertImage(clip.id, clip.src, clip.asset_id);
  }
}

function assertVideo(
  clipId: string,
  src: string | undefined,
  assetId: string | undefined,
): void {
  if (!src && !assetId) {
    throw new Error(
      `ERROR:\nClip "${clipId}" is a video shot with no src or asset_id.`,
    );
  }

  if (src && !isRemoteSrc(src) && !isVideoSrc(src)) {
    throw new Error(
      `ERROR:\nClip "${clipId}" video src "${src}" is not a video file.`,
    );
  }

  if (!src && assetId && !hasAsset(assetId)) {
    throw new Error(
      `ERROR:\nAsset "${assetId}" referenced by clip "${clipId}" does not exist.`,
    );
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
