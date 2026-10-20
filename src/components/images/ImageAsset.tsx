import { IllustratedFrame } from "./IllustratedFrame";
import { resolveAsset } from "../../engine/AssetResolver";
import type { ImageLayer } from "../../types/edit-plan";

type ImageAssetProps = {
  layer: ImageLayer;
  durationInFrames: number;
};

export const ImageAsset = ({ layer, durationInFrames }: ImageAssetProps) => {
  const relativePath = layer.src ?? resolveLayerAsset(layer);

  return (
    <IllustratedFrame
      src={relativePath}
      durationInFrames={durationInFrames}
      fit={layer.fit}
      motion={layer.motion}
      overlay={layer.overlay}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
    />
  );
};

const resolveLayerAsset = (layer: ImageLayer): string => {
  if (layer.asset_id) {
    return resolveAsset(layer.asset_id);
  }

  throw new Error("ERROR:\nImage layer is missing asset_id or src.");
};
