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
  canPlayNatively,
  footageGain,
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
  const relativePath =
    layer.src?.replace(/^\//, "") ?? resolveLayerAsset(layer);
  const url = isRemoteSrc(relativePath)
    ? relativePath
    : staticFile(relativePath);
  const durationSec = useVideoDuration(url);

  if (durationSec === null) {
    return null;
  }

  const playback = resolvePlayback(layer);
  const footage = footageWindow(playback, durationSec, fps, durationInFrames);
  const sample = sampleFootage({
    timelineFrame: frame,
    fps,
    window: footage,
    playbackRate: footage.rateStart,
    playbackRateEnd: footage.rateEnd,
    loop: playback.loop,
    reverse: playback.reverse,
    freeze: playback.freeze,
  });
  const atEnd =
    !playback.loop && !playback.freeze && frame >= footage.contentFrames;
  const silent = playback.muted || playback.freeze || atEnd;
  const gain = silent
    ? 0
    : footageGain({
        frame,
        durationInFrames,
        fps,
        volume: playback.volume,
        fadeInSec: playback.audioFadeInSec,
        fadeOutSec: playback.audioFadeOutSec,
      });
  const placed =
    layer.x !== undefined || layer.y !== undefined || layer.width !== undefined;
  const fit = layer.fit ?? (placed ? "contain" : "cover");
  const focus = `${String(playback.focusX)}% ${String(playback.focusY)}%`;
  const native = canPlayNatively(playback);
  const trimBefore = Math.round(footage.trimStartSec * fps);

  return (
    <IllustratedFrame
      media={
        native ? (
          atEnd ? (
            <Freeze frame={Math.max(0, footage.contentFrames - 1)}>
              <OffthreadVideo
                name={layer.id ?? "video"}
                src={url}
                trimBefore={trimBefore}
                playbackRate={footage.rateStart}
                muted
                volume={0}
                toneMapped={false}
                style={pictureStyle(placed, fit, layer.height, focus)}
              />
            </Freeze>
          ) : (
            <OffthreadVideo
              name={layer.id ?? "video"}
              src={url}
              trimBefore={trimBefore}
              playbackRate={footage.rateStart}
              muted={silent}
              volume={gain}
              toneMapped={false}
              style={pictureStyle(placed, fit, layer.height, focus)}
            />
          )
        ) : (
          <Freeze frame={sample.frame}>
            <OffthreadVideo
              name={layer.id ?? "video"}
              src={url}
              playbackRate={1}
              muted={silent}
              volume={gain}
              toneMapped={false}
              style={pictureStyle(placed, fit, layer.height, focus)}
            />
          </Freeze>
        )
      }
      durationInFrames={durationInFrames}
      fit={fit}
      motion={layer.motion}
      overlay={layer.overlay}
      look={layer.look}
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
  focus: string,
): CSSProperties {
  if (placed) {
    return {
      display: "block",
      width: "100%",
      height: height !== undefined ? "100%" : "auto",
      aspectRatio: height === undefined ? "16 / 9" : undefined,
      objectFit: "contain",
      objectPosition: focus,
    };
  }

  return {
    width: "100%",
    height: "100%",
    objectFit: fit === "contain" ? "contain" : "cover",
    objectPosition: focus,
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
        if (
          !Number.isFinite(meta.durationInSeconds) ||
          meta.durationInSeconds <= 0
        ) {
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
        cancelRender(
          new Error(`ERROR:\nCould not read video "${src}". ${message}`),
        );
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return duration;
}
