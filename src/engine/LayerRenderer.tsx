import { AnimatedText } from "../components/text/AnimatedText";
import { AudioVisualizer } from "../components/graphics/AudioVisualizer";
import { Comparison } from "../components/graphics/Comparison";
import { FlowDiagram } from "../components/graphics/FlowDiagram";
import { HighlightText } from "../components/text/HighlightText";
import { ImageAsset } from "../components/images/ImageAsset";
import { List } from "../components/text/List";
import { NumberedList } from "../components/graphics/NumberedList";
import { Quote } from "../components/text/Quote";
import { Timeline } from "../components/graphics/Timeline";
import { Title } from "../components/text/Title";
import type { Layer } from "../types/edit-plan";

type LayerRendererProps = {
  layer: Layer;
  compositionFrameOffset: number;
};

export const LayerRenderer = ({
  layer,
  compositionFrameOffset,
}: LayerRendererProps) => {
  switch (layer.type) {
    case "title":
      if (!layer.text.trim() || layer.placement === "none") {
        return null;
      }
      return (
        <Title
          text={layer.text}
          animation={layer.animation}
          placement={layer.placement}
        />
      );
    case "text":
      if (!layer.text.trim() || layer.placement === "none") {
        return null;
      }
      if (layer.variant === "title") {
        return (
          <Title
            text={layer.text}
            animation={layer.animation}
            placement={layer.placement}
          />
        );
      }
      return (
        <AnimatedText
          text={layer.text}
          animation={layer.animation}
          placement={layer.placement}
          variant={layer.variant === "subtitle" ? "subtitle" : "body"}
        />
      );
    case "quote":
      return (
        <Quote
          text={layer.text}
          attribution={layer.attribution}
          animation={layer.animation}
          placement={layer.placement}
        />
      );
    case "list":
      return (
        <List
          items={layer.items}
          style={layer.style}
          animation={layer.animation}
          placement={layer.placement}
        />
      );
    case "highlighted_text":
      return (
        <HighlightText
          text={layer.text}
          highlight={layer.highlight}
          animation={layer.animation}
          placement={layer.placement}
        />
      );
    case "image":
      return <ImageAsset layer={layer} />;
    case "graphic":
      return renderGraphic(layer, compositionFrameOffset);
    case "video":
      throw new Error('ERROR:\nLayer type "video" is not implemented yet.');
    case "transition":
      throw new Error('ERROR:\nLayer type "transition" is not implemented yet.');
  }
};

const renderGraphic = (
  layer: Extract<Layer, { type: "graphic" }>,
  compositionFrameOffset: number,
) => {
  switch (layer.graphic) {
    case "numbered_list":
      return (
        <NumberedList
          items={layer.items}
          animation={layer.animation}
          placement={layer.placement}
        />
      );
    case "comparison":
      return (
        <Comparison leftTitle={layer.left.title} rightTitle={layer.right.title} />
      );
    case "timeline":
      return <Timeline eventCount={layer.events.length} />;
    case "flow":
      return <FlowDiagram stepCount={layer.steps.length} />;
    case "key_statement":
      return (
        <Title
          text={layer.text}
          animation={layer.animation}
          placement={layer.placement}
          variant="statement"
        />
      );
    case "audio_visualizer":
      return (
        <AudioVisualizer
          compositionFrameOffset={compositionFrameOffset}
          variant={layer.variant}
        />
      );
  }
};
