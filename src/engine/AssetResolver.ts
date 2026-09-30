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
  // planner aliases without underscore
  img001: "assets/images/img_001.png",
  img002: "assets/images/img_002.png",
  img003: "assets/images/img_003.png",
  img004: "assets/images/img_004.png",
  img005: "assets/images/img_005.png",
  img006: "assets/images/img_006.png",
  img007: "assets/images/img_007.png",
  img008: "assets/images/img_008.png",
  img009: "assets/images/img_009.png",
  img010: "assets/images/img_010.png",
  img011: "assets/images/img_011.png",
  img012: "assets/images/img_012.png",
  img013: "assets/images/img_013.png",
};

export function resolveAsset(assetId: AssetId): string {
  const registered = localAssetRegistry[assetId];
  if (registered !== undefined) {
    return registered;
  }

  const underscored = assetId.match(/^img(\d+)$/i);
  if (underscored) {
    return `assets/images/img_${underscored[1].padStart(3, "0")}.png`;
  }

  return `assets/images/${assetId}.png`;
}

export function hasAsset(assetId: AssetId): boolean {
  return assetId.length > 0;
}

export function resolvePublicSrc(src: string): string {
  return src.replace(/^\//, "");
}
