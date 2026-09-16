import type { ReactNode } from "react";
import { Sequence } from "remotion";
import { Crossfade } from "../components/transitions/Crossfade";
import { Fade } from "../components/transitions/Fade";
import { Slide } from "../components/transitions/Slide";
import { LayerRenderer } from "./LayerRenderer";
import type { Clip, Transition } from "../types/edit-plan";
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
      <ClipTransition transitionIn={clip.transition_in} transitionOut={clip.transition_out}>
        {clip.layers.map((layer, index) => {
          const layerStartSec = layer.start_sec ?? clip.start_sec;
          const layerEndSec = layer.end_sec ?? clip.end_sec;
          const layerFrom = secondsToFrames(layerStartSec - clip.start_sec, fps);
          const layerDuration = secondsToFrames(
            layerEndSec - layerStartSec,
            fps,
          );

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
              />
            </Sequence>
          );
        })}
      </ClipTransition>
    </Sequence>
  );
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
    // Outgoing dissolve/slide is rendered as a fade-out so the next overlapping
    // clip's fade-in can blend into a cross-dissolve.
    if (outType === "fade" || outType === "crossfade" || outType === "slide") {
      content = (
        <Fade direction="out" durationSec={durationSec}>
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
    }
  }

  return content;
};
