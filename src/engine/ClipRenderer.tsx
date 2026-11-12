import type { ReactNode } from "react";
import { Sequence } from "remotion";
import { CircleReveal } from "../components/transitions/CircleReveal";
import { Crossfade } from "../components/transitions/Crossfade";
import { Fade } from "../components/transitions/Fade";
import { FlashCut } from "../components/transitions/FlashCut";
import { GlitchCut } from "../components/transitions/GlitchCut";
import { Slide } from "../components/transitions/Slide";
import { WhipPan } from "../components/transitions/WhipPan";
import { Wipe } from "../components/transitions/Wipe";
import { ZoomPunch } from "../components/transitions/ZoomPunch";
import { ImageAsset } from "../components/images/ImageAsset";
import { MediaLayerView } from "../components/images/MediaLayerView";
import { VideoAsset } from "../components/video/VideoAsset";
import { normalizeLook } from "./artisticLook";
import { LayerRenderer } from "./LayerRenderer";
import { CameraRig } from "./CameraRig";
import { useEditPlan } from "./EditPlanContext";
import { LookProvider } from "./LookContext";
import { mediaKind, playbackInputOf } from "./videoPlayback";
import type {
  Clip,
  ImageLayer,
  MediaLayer,
  Transition,
  VideoLayer,
} from "../types/edit-plan";
import { secondsToFrames } from "../utils/time";
import { theme } from "../styles/theme";
import { normalizeTransitionType } from "./normalizeTransition";

type ClipRendererProps = {
  clip: Clip;
  nextClip?: Clip;
  fps: number;
};

export const ClipRenderer = ({ clip, nextClip, fps }: ClipRendererProps) => {
  const plan = useEditPlan();
  const shotLook = normalizeLook(clip.look ?? plan.video.look);
  const startFrame = secondsToFrames(clip.start_sec, fps);
  const visualEnd = visualEndSec(clip, nextClip);
  // Subtract absolute frames. Rounding each edge, then the gap, can
  // miss the SRT frame by one when the clip does not start at 0.
  const durationInFrames = Math.max(
    1,
    secondsToFrames(visualEnd, fps) - startFrame,
  );

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
        durationInFrames={durationInFrames}
      >
        <LookProvider value={shotLook}>
          <CameraRig camera={clip.camera} durationInFrames={durationInFrames}>
            {clipBackground(clip, durationInFrames)}
            {[...(clip.media ?? [])]
              .sort((a, b) => a.zIndex - b.zIndex)
              .map((item, index) =>
                timedLayer(clip, item, index, fps, visualEnd, (duration) => (
                  <MediaLayerView layer={item} durationInFrames={duration} />
                )),
              )}
            {clip.layers.map((layer, index) => {
              const layerStartSec = layer.start_sec ?? clip.start_sec;
              const authoredEnd = layer.end_sec ?? clip.end_sec;
              const layerEndSec = holdsPastClip(
                layer.type,
                authoredEnd,
                clip.end_sec,
              )
                ? visualEnd
                : authoredEnd;
              const span = layerWindow(
                startFrame,
                layerStartSec,
                layerEndSec,
                fps,
              );

              return (
                <Sequence
                  key={layer.id ?? `${clip.id}-layer-${String(index)}`}
                  from={span.from}
                  durationInFrames={span.durationInFrames}
                  name={layer.id ?? layer.type}
                  layout="none"
                >
                  <LayerRenderer
                    layer={layer}
                    compositionFrameOffset={startFrame + span.from}
                    durationInFrames={span.durationInFrames}
                  />
                </Sequence>
              );
            })}
          </CameraRig>
        </LookProvider>
      </ClipTransition>
    </Sequence>
  );
};

const timedLayer = (
  clip: Clip,
  item: MediaLayer,
  index: number,
  fps: number,
  visualEnd: number,
  render: (durationInFrames: number) => ReactNode,
) => {
  const layerStartSec = item.start_sec ?? clip.start_sec;
  const authoredEnd = item.end_sec ?? clip.end_sec;
  const layerEndSec = holdsPastClip("media", authoredEnd, clip.end_sec)
    ? visualEnd
    : authoredEnd;
  const span = layerWindow(
    secondsToFrames(clip.start_sec, fps),
    layerStartSec,
    layerEndSec,
    fps,
  );

  return (
    <Sequence
      key={item.id ?? `${clip.id}-media-${String(index)}`}
      from={span.from}
      durationInFrames={span.durationInFrames}
      name={item.id ?? `media-${String(item.zIndex)}`}
      layout="none"
    >
      {render(span.durationInFrames)}
    </Sequence>
  );
};

const clipBackground = (clip: Clip, durationInFrames: number) => {
  if (!clip.src && !clip.asset_id) {
    return null;
  }

  if (mediaKind(clip) === "video") {
    const layer: VideoLayer = {
      type: "video",
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
      ...playbackInputOf(clip),
    };

    return <VideoAsset layer={layer} durationInFrames={durationInFrames} />;
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
  durationInFrames,
  children,
}: {
  transitionIn?: Transition;
  transitionOut?: Transition;
  durationInFrames: number;
  children: ReactNode;
}) => {
  let content: ReactNode = children;

  if (transitionOut) {
    const outType = normalizeTransitionType(transitionOut.type);
    const durationSec =
      transitionOut.duration_sec ?? theme.animation.transitionSec;
    if (outType === "fade" || outType === "crossfade" || outType === "slide") {
      content = (
        <Fade
          direction="out"
          durationSec={durationSec}
          durationInFrames={durationInFrames}
        >
          {content}
        </Fade>
      );
    } else if (outType === "wipe") {
      content = (
        <Fade
          direction="out"
          durationSec={durationSec}
          durationInFrames={durationInFrames}
        >
          {content}
        </Fade>
      );
    } else if (outType === "zoom_punch") {
      content = (
        <Fade
          direction="out"
          durationSec={Math.min(0.35, durationSec)}
          durationInFrames={durationInFrames}
        >
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
    } else if (inType === "flash") {
      content = <FlashCut durationSec={durationSec}>{content}</FlashCut>;
    } else if (inType === "circle") {
      content = (
        <CircleReveal durationSec={durationSec}>{content}</CircleReveal>
      );
    } else if (inType === "whip") {
      content = <WhipPan durationSec={durationSec}>{content}</WhipPan>;
    } else if (inType === "glitch") {
      content = <GlitchCut durationSec={durationSec}>{content}</GlitchCut>;
    }
  }

  return content;
};

/** Keep the picture up through a gap, and overlap a dissolve into the next shot. */
function visualEndSec(clip: Clip, nextClip: Clip | undefined): number {
  if (!nextClip) {
    return clip.end_sec;
  }

  const outType = clip.transition_out?.type;
  const inType = nextClip.transition_in?.type;
  if (outType === "fade_to_black" || inType === "fade_in_from_black") {
    return clip.end_sec;
  }

  const gap = nextClip.start_sec - clip.end_sec;
  let end = gap > 0 ? nextClip.start_sec : clip.end_sec;
  if (isBlend(outType) || isBlend(inType)) {
    const duration = Math.max(
      clip.transition_out?.duration_sec ?? 0.45,
      nextClip.transition_in?.duration_sec ?? 0.45,
    );
    end = Math.max(end, nextClip.start_sec + duration);
    end = Math.min(end, nextClip.end_sec - 0.05);
  }
  return Math.max(end, clip.end_sec);
}

function isBlend(type: string | undefined): boolean {
  return (
    type === "cross_dissolve" ||
    type === "crossfade" ||
    type === "fade" ||
    type === "slide" ||
    type === "smooth_slide"
  );
}

/** Layer sequence inside a clip, measured from absolute timeline frames. */
function layerWindow(
  clipStartFrame: number,
  layerStartSec: number,
  layerEndSec: number,
  fps: number,
): { from: number; durationInFrames: number } {
  const start = secondsToFrames(layerStartSec, fps);
  const end = secondsToFrames(layerEndSec, fps);
  let from = start - clipStartFrame;
  let durationInFrames = Math.max(1, end - start);
  if (from < 0) {
    durationInFrames = Math.max(1, durationInFrames + from);
    from = 0;
  }
  return { from, durationInFrames };
}

function holdsPastClip(
  type: string,
  authoredEnd: number,
  clipEnd: number,
): boolean {
  if (authoredEnd < clipEnd - 0.05) {
    return false;
  }
  return (
    type === "image" ||
    type === "image_sequence" ||
    type === "media" ||
    type === "video"
  );
}
