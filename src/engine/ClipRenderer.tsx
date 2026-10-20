import type { ReactNode } from "react";
import { Sequence } from "remotion";
import { Crossfade } from "../components/transitions/Crossfade";
import { Fade } from "../components/transitions/Fade";
import { Slide } from "../components/transitions/Slide";
import { Wipe } from "../components/transitions/Wipe";
import { ZoomPunch } from "../components/transitions/ZoomPunch";
import { ImageAsset } from "../components/images/ImageAsset";
import { MediaLayerView } from "../components/images/MediaLayerView";
import { LayerRenderer } from "./LayerRenderer";
import { CameraRig } from "./CameraRig";
import type { Clip, ImageLayer, MediaLayer, Transition } from "../types/edit-plan";
import { secondsToFrames } from "../utils/time";
import { theme } from "../styles/theme";
import { normalizeTransitionType } from "./normalizeTransition";

type ClipRendererProps = {
  clip: Clip;
  fps: number;
};

export const ClipRenderer = ({ clip, fps }: ClipRendererProps) => {
  const startFrame = secondsToFrames(clip.start_sec, fps);
  const durationInFrames = secondsToFrames(clip.end_sec - clip.start_sec, fps);

  return (
    <Sequence
      from={startFrame}
      durationInFrames={durationInFrames}
      name={clip.id}
      layout="none"
    >
      <ClipTransition
        transitionIn={clip.transition_in}
        transitionOut={clip.transition_out}
      >
        <CameraRig camera={clip.camera} durationInFrames={durationInFrames}>
          {clipBackground(clip, durationInFrames)}
          {[...(clip.media ?? [])]
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((item, index) =>
              timedLayer(clip, item, index, fps, (duration) => (
                <MediaLayerView layer={item} durationInFrames={duration} />
              )),
            )}
          {clip.layers.map((layer, index) => {
            const layerStartSec = layer.start_sec ?? clip.start_sec;
            const layerEndSec = layer.end_sec ?? clip.end_sec;
            const layerFrom = secondsToFrames(layerStartSec - clip.start_sec, fps);
            const layerDuration = secondsToFrames(layerEndSec - layerStartSec, fps);

            return (
              <Sequence
                key={layer.id ?? `${clip.id}-layer-${String(index)}`}
                from={layerFrom}
                durationInFrames={Math.max(1, layerDuration)}
                name={layer.id ?? layer.type}
                layout="none"
              >
                <LayerRenderer
                  layer={layer}
                  compositionFrameOffset={startFrame + layerFrom}
                  durationInFrames={Math.max(1, layerDuration)}
                />
              </Sequence>
            );
          })}
        </CameraRig>
      </ClipTransition>
    </Sequence>
  );
};

const timedLayer = (
  clip: Clip,
  item: MediaLayer,
  index: number,
  fps: number,
  render: (durationInFrames: number) => ReactNode,
) => {
  const layerStartSec = item.start_sec ?? clip.start_sec;
  const layerEndSec = item.end_sec ?? clip.end_sec;
  const layerFrom = secondsToFrames(layerStartSec - clip.start_sec, fps);
  const layerDuration = Math.max(
    1,
    secondsToFrames(layerEndSec - layerStartSec, fps),
  );

  return (
    <Sequence
      key={item.id ?? `${clip.id}-media-${String(index)}`}
      from={layerFrom}
      durationInFrames={layerDuration}
      name={item.id ?? `media-${String(item.zIndex)}`}
      layout="none"
    >
      {render(layerDuration)}
    </Sequence>
  );
};

const clipBackground = (clip: Clip, durationInFrames: number) => {
  if (!clip.src && !clip.asset_id) {
    return null;
  }

  const layer: ImageLayer = {
    type: "image",
    id: `${clip.id}-background`,
    asset_id: clip.asset_id,
    src: clip.src,
    fit: clip.fit,
    overlay: clip.overlay,
    motion: clip.camera
      ? {
          type: clip.motion?.type ?? "static",
          intensity: clip.motion?.intensity,
          from: clip.motion?.from,
          parallaxFactor: clip.motion?.parallaxFactor ?? 0.55,
        }
      : clip.motion,
  };

  return <ImageAsset layer={layer} durationInFrames={durationInFrames} />;
};

const ClipTransition = ({
  transitionIn,
  transitionOut,
  children,
}: {
  transitionIn?: Transition;
  transitionOut?: Transition;
  children: ReactNode;
}) => {
  let content: ReactNode = children;

  if (transitionOut) {
    const outType = normalizeTransitionType(transitionOut.type);
    const durationSec =
      transitionOut.duration_sec ?? theme.animation.transitionSec;
    if (outType === "fade" || outType === "crossfade" || outType === "slide") {
      content = (
        <Fade direction="out" durationSec={durationSec}>
          {content}
        </Fade>
      );
    } else if (outType === "wipe") {
      content = (
        <Fade direction="out" durationSec={durationSec}>
          {content}
        </Fade>
      );
    } else if (outType === "zoom_punch") {
      content = (
        <Fade direction="out" durationSec={Math.min(0.35, durationSec)}>
          {content}
        </Fade>
      );
    }
  }

  if (transitionIn) {
    const durationSec =
      transitionIn.duration_sec ?? theme.animation.transitionSec;
    const inType = normalizeTransitionType(transitionIn.type);
    if (inType === "fade") {
      content = (
        <Fade direction="in" durationSec={durationSec}>
          {content}
        </Fade>
      );
    } else if (inType === "crossfade") {
      content = <Crossfade durationSec={durationSec}>{content}</Crossfade>;
    } else if (inType === "slide") {
      content = <Slide durationSec={durationSec}>{content}</Slide>;
    } else if (inType === "wipe") {
      content = <Wipe durationSec={durationSec}>{content}</Wipe>;
    } else if (inType === "zoom_punch") {
      content = <ZoomPunch durationSec={durationSec}>{content}</ZoomPunch>;
    }
  }

  return content;
};
