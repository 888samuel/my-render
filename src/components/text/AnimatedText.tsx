import type { CSSProperties, ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import {
  entranceToCss,
  resolveTextEntrance,
  wordRevealOpacity,
} from "../../engine/AnimationResolver";
import { lerpFrames } from "../../utils/interpolate";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { SafeArea, textAlignForPlacement } from "../common/SafeArea";
import { theme } from "../../styles/theme";
import { secondsToFrames } from "../../utils/time";
import type { LayerPlacement } from "../../types/common";
import type { TextAnimation } from "../../types/edit-plan";

type RevealTextProps = {
  text: string;
  animation?: TextAnimation;
  style?: CSSProperties;
  align?: "left" | "center" | "right";
};

export const RevealText = ({
  text,
  animation,
  style,
  align = "center",
}: RevealTextProps) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const type = animation?.type ?? "fade_in";
  const isWordReveal = type === "word_reveal" || type === "dramatic_reveal";
  const entrance = resolveTextEntrance(frame, durationInFrames, type, fps);

  if (!isWordReveal) {
    return (
      <div
        style={{
          ...style,
          ...entranceToCss(entrance),
          textAlign: align,
        }}
      >
        {text}
      </div>
    );
  }

  const words = text.split(" ").filter((word) => word.length > 0);

  return (
    <div
      style={{
        ...style,
        textAlign: align,
      }}
    >
      {words.map((word, index) => (
        <span
          key={`${word}-${String(index)}`}
          style={{
            display: "inline-block",
            marginRight: "0.28em",
            opacity: wordRevealOpacity(
              frame,
              index,
              fps,
              type === "dramatic_reveal",
            ),
          }}
        >
          {word}
        </span>
      ))}
    </div>
  );
};

export const AnimatedText = ({
  text,
  animation,
  placement = "lower_third",
  variant = "body",
}: {
  text: string;
  animation?: TextAnimation;
  placement?: LayerPlacement;
  variant?: "body" | "subtitle";
}) => {
  const align = textAlignForPlacement(placement);
  const isSubtitle = variant === "subtitle";

  return (
    <AbsoluteFill>
      <SafeArea placement={placement}>
        <RevealText
          text={text}
          animation={animation}
          align={align}
          style={{
            color: theme.colors.text,
            fontFamily: isSubtitle ? theme.fonts.body : theme.fonts.display,
            fontSize: isSubtitle ? theme.fontSize.body : theme.fontSize.statement,
            fontWeight: isSubtitle ? 400 : 500,
            letterSpacing: isSubtitle ? "0.01em" : "-0.02em",
            lineHeight: 1.3,
            maxWidth: isSubtitle ? 1500 : 1280,
            whiteSpace: "pre-line",
            textShadow: isSubtitle
              ? "0 2px 10px rgba(0,0,0,0.75)"
              : undefined,
          }}
        />
      </SafeArea>
    </AbsoluteFill>
  );
};

type EntranceProps = {
  animation?: TextAnimation;
  children: ReactNode;
};

export const Entrance = ({ animation, children }: EntranceProps) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const style = resolveTextEntrance(
    frame,
    durationInFrames,
    animation?.type ?? "fade_in",
    fps,
  );

  return <div style={entranceToCss(style)}>{children}</div>;
};

export const StaggeredItem = ({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = secondsToFrames(theme.animation.staggerSec, fps) * index;
  const length = secondsToFrames(theme.animation.entranceSec, fps);

  return (
    <div
      style={{
        opacity: lerpFrames(frame, start, start + length, 0, 1),
        transform: `translateY(${String(lerpFrames(frame, start, start + length, 18, 0))}px)`,
      }}
    >
      {children}
    </div>
  );
};
