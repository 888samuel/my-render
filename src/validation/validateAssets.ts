import type { EditPlan } from "../types/edit-plan";
import { hasAsset } from "../engine/AssetResolver";

export function validateAssets(plan: EditPlan): void {
  for (const clip of plan.clips) {
    for (const layer of clip.layers) {
      if (layer.type !== "image" && layer.type !== "video") {
        continue;
      }

      if (layer.type === "image" && layer.src) {
        continue;
      }

      const assetId = layer.asset_id;
      if (!assetId || !hasAsset(assetId)) {
        throw new Error(
          `ERROR:\nAsset "${assetId ?? ""}" referenced by clip "${clip.id}" does not exist.`,
        );
      }
    }
  }
}
