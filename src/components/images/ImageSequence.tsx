import { useCurrentFrame, useVideoConfig } from "remotion";
import { IllustratedFrame } from "./IllustratedFrame";
import type { ImageSequenceLayer } from "../../types/edit-plan";

type ImageSequenceProps = {
  layer: ImageSequenceLayer;
  durationInFrames: number;
};

export const ImageSequence = ({ layer, durationInFrames }: ImageSequenceProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frames = layer.frames;

  if (frames.length === 0) {
    throw new Error("ERROR:\nImage sequence has no frames.");
  }

  const playbackFps = layer.playback_fps ?? 8;
  const index = Math.floor((frame / fps) * playbackFps);
  const resolved =
    layer.loop === false
      ? Math.min(index, frames.length - 1)
      : index % frames.length;
  const src = frames[resolved] ?? frames[0];
  if (!src) {
    throw new Error("ERROR:\nImage sequence has no frames.");
  }
  const placed =
    layer.x !== undefined || layer.y !== undefined || layer.width !== undefined;

  return (
    <IllustratedFrame
      src={src}
      durationInFrames={durationInFrames}
      fit={layer.fit ?? (placed ? "contain" : "cover")}
      motion={layer.motion}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
    />
  );
};
