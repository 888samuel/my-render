import { IllustratedFrame } from "./IllustratedFrame";
import type { MediaLayer, MediaPlacement } from "../../types/edit-plan";

const presets: Record<MediaPlacement, { x: number; y: number; width: number }> = {
  center: { x: 50, y: 54, width: 42 },
  center_left: { x: 28, y: 58, width: 34 },
  center_right: { x: 72, y: 58, width: 34 },
  top_center: { x: 50, y: 30, width: 36 },
  bottom_center: { x: 50, y: 72, width: 34 },
};

type MediaLayerViewProps = {
  layer: MediaLayer;
  durationInFrames: number;
};

export const MediaLayerView = ({ layer, durationInFrames }: MediaLayerViewProps) => {
  const preset = layer.placement ? presets[layer.placement] : undefined;
  const placed =
    preset !== undefined ||
    layer.x !== undefined ||
    layer.y !== undefined ||
    layer.width !== undefined;

  return (
    <IllustratedFrame
      src={layer.src}
      durationInFrames={durationInFrames}
      fit={layer.fit ?? (placed ? "contain" : "cover")}
      motion={layer.motion}
      opacity={layer.opacity ?? 1}
      zIndex={layer.zIndex}
      x={layer.x ?? preset?.x}
      y={layer.y ?? preset?.y}
      width={layer.width ?? preset?.width}
      height={layer.height}
    />
  );
};
