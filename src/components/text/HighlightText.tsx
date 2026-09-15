import { useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { SafeArea } from "../common/SafeArea";
import { Entrance } from "./AnimatedText";
import { wordRevealOpacity } from "../../engine/AnimationResolver";
import { theme } from "../../styles/theme";
import type { LayerPlacement } from "../../types/common";
import type { TextAnimation } from "../../types/edit-plan";

type HighlightTextProps = {
  text: string;
  highlight?: string;
  animation?: TextAnimation;
  placement?: LayerPlacement;
};

export const HighlightText = ({
  text,
  highlight,
  animation,
  placement = "lower_third",
}: HighlightTextProps) => {
  const type = animation?.type ?? "fade_in";
  const isWordReveal = type === "word_reveal" || type === "dramatic_reveal";

  return (
    <AbsoluteFill>
      <SafeArea placement={placement}>
        {isWordReveal ? (
          <HighlightedReveal
            text={text}
            highlight={highlight}
            dramatic={type === "dramatic_reveal"}
            placement={placement}
          />
        ) : (
          <Entrance animation={animation}>
            <div style={statementStyle(placement)}>
              {renderHighlighted(text, highlight)}
            </div>
          </Entrance>
        )}
      </SafeArea>
    </AbsoluteFill>
  );
};

const statementStyle = (placement: LayerPlacement) => {
  return {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: theme.fontSize.statement,
    fontWeight: 500,
    letterSpacing: "-0.02em",
    lineHeight: 1.3,
    maxWidth: 1280,
    textAlign: (placement === "center" ? "center" : "left") as
      | "center"
      | "left",
  };
};

const HighlightedReveal = ({
  text,
  highlight,
  dramatic,
  placement,
}: {
  text: string;
  highlight?: string;
  dramatic: boolean;
  placement: LayerPlacement;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ").filter((word) => word.length > 0);
  const highlightedWords = new Set(highlightWords(text, highlight));

  return (
    <div style={statementStyle(placement)}>
      {words.map((word, index) => {
        const highlighted = highlightedWords.has(index);

        return (
          <span
            key={`${word}-${String(index)}`}
            style={{
              display: "inline",
              marginRight: "0.28em",
              opacity: wordRevealOpacity(frame, index, fps, dramatic),
              boxShadow: highlighted
                ? `inset 0 -0.38em 0 ${theme.colors.accent}66`
                : undefined,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

const highlightWords = (text: string, highlight?: string): number[] => {
  if (!highlight) {
    return [];
  }

  const words = text.split(" ").filter((word) => word.length > 0);
  const highlightParts = highlight.split(" ").filter((word) => word.length > 0);
  const indexes: number[] = [];

  for (let start = 0; start <= words.length - highlightParts.length; start++) {
    const slice = words.slice(start, start + highlightParts.length);
    if (slice.join(" ") === highlight) {
      for (let offset = 0; offset < highlightParts.length; offset++) {
        indexes.push(start + offset);
      }
      return indexes;
    }
  }

  return indexes;
};

const renderHighlighted = (text: string, highlight?: string) => {
  if (!highlight || !text.includes(highlight)) {
    return text;
  }

  const start = text.indexOf(highlight);
  const before = text.slice(0, start);
  const after = text.slice(start + highlight.length);

  return (
    <>
      {before}
      <span
        style={{
          color: theme.colors.text,
          boxShadow: `inset 0 -0.42em 0 ${theme.colors.accent}55`,
        }}
      >
        {highlight}
      </span>
      {after}
    </>
  );
};
