import type { ReactNode } from "react";
import { Sequence } from "remotion";
import { Crossfade } from "../components/transitions/Crossfade";
import { Fade } from "../components/transitions/Fade";
import { Slide } from "../components/transitions/Slide";
import { LayerRenderer } from "./LayerRenderer";
import type { Clip, Transition } from "../types/edit-plan";
import { secondsToFrames } from "../utils/time";
import { theme } from "../styles/theme";

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

  if (transitionOut && transitionOut.type === "fade") {
    content = (
      <Fade
        direction="out"
        durationSec={transitionOut.duration_sec ?? theme.animation.transitionSec}
      >
        {content}
      </Fade>
    );
  }

  if (transitionIn) {
    const durationSec = transitionIn.duration_sec ?? theme.animation.transitionSec;
    if (transitionIn.type === "fade") {
      content = (
        <Fade direction="in" durationSec={durationSec}>
          {content}
        </Fade>
      );
    } else if (transitionIn.type === "crossfade") {
      content = <Crossfade durationSec={durationSec}>{content}</Crossfade>;
    } else if (transitionIn.type === "slide") {
      content = <Slide durationSec={durationSec}>{content}</Slide>;
    }
  }

  return content;
};
