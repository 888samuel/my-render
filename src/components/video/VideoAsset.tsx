import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { getVideoMetadata } from "@remotion/media-utils";
import {
  cancelRender,
  continueRender,
  delayRender,
  Freeze,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { resolveVideoAsset } from "../../engine/AssetResolver";
import {
  footageWindow,
  isRemoteSrc,
  resolvePlayback,
  sampleFootage,
} from "../../engine/videoPlayback";
import type { ImageFit } from "../../types/common";
import type { VideoLayer } from "../../types/edit-plan";
import { IllustratedFrame } from "../images/IllustratedFrame";

type VideoAssetProps = {
  layer: VideoLayer;
  durationInFrames: number;
};

const durationCache = new Map<string, number>();

export const VideoAsset = ({ layer, durationInFrames }: VideoAssetProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const relativePath = layer.src?.replace(/^\//, "") ?? resolveLayerAsset(layer);
  const url = isRemoteSrc(relativePath) ? relativePath : staticFile(relativePath);
  const durationSec = useVideoDuration(url);

  if (durationSec === null) {
    return null;
  }

  const playback = resolvePlayback(layer);
  const window = footageWindow(playback, durationSec, fps);
  const sample = sampleFootage({
    timelineFrame: frame,
    fps,
    window,
    playbackRate: playback.playbackRate,
    loop: playback.loop,
  });
  const silent = playback.muted || sample.holding;
  const placed =
    layer.x !== undefined || layer.y !== undefined || layer.width !== undefined;
  const fit = layer.fit ?? (placed ? "contain" : "cover");

  return (
    <IllustratedFrame
      media={
        <Freeze frame={sample.frame}>
          <OffthreadVideo
            name={layer.id ?? "video"}
            src={url}
            playbackRate={1}
            muted={silent}
            volume={silent ? 0 : playback.volume}
            toneMapped={false}
            style={pictureStyle(placed, fit, layer.height)}
          />
        </Freeze>
      }
      durationInFrames={durationInFrames}
      fit={fit}
      motion={layer.motion}
      overlay={layer.overlay}
      opacity={layer.opacity ?? 1}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
    />
  );
};

const resolveLayerAsset = (layer: VideoLayer): string => {
  if (layer.asset_id) {
    return resolveVideoAsset(layer.asset_id);
  }

  throw new Error("ERROR:\nVideo layer is missing src or asset_id.");
};

function pictureStyle(
  placed: boolean,
  fit: ImageFit,
  height: number | undefined,
): CSSProperties {
  if (placed) {
    return {
      display: "block",
      width: "100%",
      height: height !== undefined ? "100%" : "auto",
      aspectRatio: height === undefined ? "16 / 9" : undefined,
      objectFit: "contain",
    };
  }

  return {
    width: "100%",
    height: "100%",
    objectFit: fit === "contain" ? "contain" : "cover",
    objectPosition: "center center",
  };
}

function useVideoDuration(src: string): number | null {
  const [duration, setDuration] = useState<number | null>(
    () => durationCache.get(src) ?? null,
  );

  useEffect(() => {
    const known = durationCache.get(src);
    if (known !== undefined) {
      setDuration(known);
      return;
    }

    let cancelled = false;
    const handle = delayRender(`Reading duration of ${src}`);

    getVideoMetadata(src)
      .then((meta) => {
        if (!Number.isFinite(meta.durationInSeconds) || meta.durationInSeconds <= 0) {
          throw new Error("Video file has no duration.");
        }
        durationCache.set(src, meta.durationInSeconds);
        if (!cancelled) {
          setDuration(meta.durationInSeconds);
        }
        continueRender(handle);
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        cancelRender(new Error(`ERROR:\nCould not read video "${src}". ${message}`));
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return duration;
}
