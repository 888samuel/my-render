import { AnimatedText } from "../components/text/AnimatedText";
import { AudioVisualizer } from "../components/graphics/AudioVisualizer";
import { ChapterCard, LowerThird } from "../components/graphics/LowerThird";
import { Comparison } from "../components/graphics/Comparison";
import { FlowDiagram } from "../components/graphics/FlowDiagram";
import { HighlightText } from "../components/text/HighlightText";
import { ImageAsset } from "../components/images/ImageAsset";
import { List } from "../components/text/List";
import { NumberedList } from "../components/graphics/NumberedList";
import { Quote } from "../components/text/Quote";
import { Timeline } from "../components/graphics/Timeline";
import { Title } from "../components/text/Title";
import { YearStamp } from "../components/graphics/YearStamp";
import { normalizeTextAnimationInput } from "./normalizeAnimation";
import type { Layer, TextAnimation } from "../types/edit-plan";

type LayerRendererProps = {
  layer: Layer;
  compositionFrameOffset: number;
};

const animOf = (layer: { animation?: TextAnimation | string }): TextAnimation =>
  normalizeTextAnimationInput(layer.animation);

/** LLM plans sometimes put copy in `text` instead of `title`. */
const titleOf = (layer: object): string => {
  const record = layer as { title?: string; text?: string };
  return record.title ?? record.text ?? "";
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
          animation={animOf(layer)}
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
            animation={animOf(layer)}
            placement={layer.placement}
          />
        );
      }
      if (layer.variant === "quote") {
        return (
          <Quote
            text={layer.text}
            animation={animOf(layer)}
            placement={layer.placement}
          />
        );
      }
      if (layer.variant === "highlighted_text") {
        return (
          <HighlightText
            text={layer.text}
            animation={animOf(layer)}
            placement={layer.placement}
          />
        );
      }
      return (
        <AnimatedText
          text={layer.text}
          animation={animOf(layer)}
          placement={layer.placement}
          variant={layer.variant === "subtitle" ? "subtitle" : "body"}
        />
      );
    case "quote":
      return (
        <Quote
          text={layer.text}
          attribution={layer.attribution}
          animation={animOf(layer)}
          placement={layer.placement}
        />
      );
    case "list":
      return (
        <List
          items={layer.items}
          style={layer.style}
          animation={animOf(layer)}
          placement={layer.placement}
        />
      );
    case "highlighted_text":
      return (
        <HighlightText
          text={layer.text}
          highlight={layer.highlight}
          animation={animOf(layer)}
          placement={layer.placement}
        />
      );
    case "lower_third":
      return (
        <LowerThird
          title={titleOf(layer)}
          subtitle={layer.subtitle}
          animation={animOf(layer)}
          placement={layer.placement}
        />
      );
    case "chapter_card":
      return (
        <ChapterCard
          eyebrow={layer.eyebrow}
          title={titleOf(layer)}
          subtitle={layer.subtitle}
          animation={animOf(layer)}
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
          animation={animOf(layer)}
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
          animation={animOf(layer)}
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
    case "lower_third":
      return (
        <LowerThird
          title={titleOf(layer)}
          subtitle={layer.subtitle}
          animation={animOf(layer)}
          placement={layer.placement}
        />
      );
    case "chapter_card":
      return (
        <ChapterCard
          eyebrow={layer.eyebrow}
          title={titleOf(layer)}
          subtitle={layer.subtitle}
          animation={animOf(layer)}
        />
      );
    case "year_stamp":
      return (
        <YearStamp
          text={layer.text}
          animation={animOf(layer)}
          placement={layer.placement}
        />
      );
  }
};
