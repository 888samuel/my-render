import type { AssetId } from "../types/common";

const localAssetRegistry: Record<AssetId, string> = {
  img_001: "assets/images/img_001.png",
  img_002: "assets/images/img_002.png",
  img_003: "assets/images/img_003.png",
};

export function resolveAsset(assetId: AssetId): string {
  const src = localAssetRegistry[assetId];

  if (src === undefined) {
    throw new Error(`ERROR:\nAsset "${assetId}" does not exist.`);
  }

  return src;
}

export function hasAsset(assetId: AssetId): boolean {
  return localAssetRegistry[assetId] !== undefined;
}
