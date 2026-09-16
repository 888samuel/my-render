import type { AssetId } from "../types/common";

const localAssetRegistry: Record<AssetId, string> = {
  img_001: "assets/images/img_001.png",
  img_002: "assets/images/img_002.png",
  img_003: "assets/images/img_003.png",
  img_004: "assets/images/img_004.png",
  img_005: "assets/images/img_005.png",
  img_006: "assets/images/img_006.png",
  img_007: "assets/images/img_007.png",
  img_008: "assets/images/img_008.png",
  img_009: "assets/images/img_009.png",
  img_010: "assets/images/img_010.png",
  img_011: "assets/images/img_011.png",
  img_012: "assets/images/img_012.png",
  img_013: "assets/images/img_013.png",
  img_014: "assets/images/img_014.png",
  img_015: "assets/images/img_015.png",
  img_016: "assets/images/img_016.png",
};

export function resolveAsset(assetId: AssetId): string {
  const registered = localAssetRegistry[assetId];
  if (registered !== undefined) {
    return registered;
  }

  return `assets/images/${assetId}.png`;
}

export function hasAsset(assetId: AssetId): boolean {
  return assetId.length > 0;
}

export function resolvePublicSrc(src: string): string {
  return src.replace(/^\//, "");
}
