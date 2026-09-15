import type { AssetId } from "../types/common";

const localAssetRegistry: Record<AssetId, string> = {
  img001: "assets/images/img001_ancient_wanderer.png",
  img002: "assets/images/img002_desert_cliff_night.png",
  img003: "assets/images/img003_split_lighting_monk.png",
  img004: "assets/images/img004_golden_balm_oil.png",
  img005: "assets/images/img005_ethiopian_monastery.png",
  img006: "assets/images/img006_samaria_fortress.png",
  img007: "assets/images/img007_desolation_streets.png",
  img008: "assets/images/img008_king_joram.png",
  img009: "assets/images/img009_ahab_jezebel.png",
  img010: "assets/images/img010_pagan_idol_altar.png",
  img011: "assets/images/img011_king_ben_hadad.png",
  img012: "assets/images/img012_syrian_army.png",
  img013: "assets/images/img013_commander_war_tent.png",
  img014: "assets/images/img014_fortress_gates.png",
  img015: "assets/images/img015_empty_granary_pots.png",
  img016: "assets/images/img016_hebrew_parchment.png",
  img017: "assets/images/img017_emaciated_woman.png",
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
