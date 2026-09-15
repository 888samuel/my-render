import type { EditPlan } from "../types/edit-plan";
import { hasAsset } from "../engine/AssetResolver";

export function validateAssets(plan: EditPlan): void {
  for (const clip of plan.clips) {
    for (const layer of clip.layers) {
      if (layer.type !== "image" && layer.type !== "video") {
        continue;
      }

      if (!hasAsset(layer.asset_id)) {
        throw new Error(
          `ERROR:\nAsset "${layer.asset_id}" referenced by clip "${clip.id}" does not exist.`,
        );
      }
    }
  }
}
