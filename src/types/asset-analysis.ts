import type { AssetId, AssetKind, Seconds } from "./common";

export type AnalyzedAsset = {
  id: AssetId;
  type: AssetKind;
  src: string;
  width?: number;
  height?: number;
  duration_sec?: Seconds;
};

export type AssetAnalysis = {
  version: string;
  assets: AnalyzedAsset[];
};
