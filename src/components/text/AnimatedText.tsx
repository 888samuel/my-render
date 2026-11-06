import type { CSSProperties, ReactNode } from "react";
import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import {
  entranceToCss,
  resolveTextEntrance,
  wordRevealOpacity,
} from "../../engine/AnimationResolver";
import { normalizeTextAnimationInput } from "../../engine/normalizeAnimation";
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
  const anim = normalizeTextAnimationInput(animation);
  const type = anim.type;
  const autoExit = anim.auto_exit ?? true;
  const isWordReveal = type === "word_reveal" || type === "dramatic_reveal";
  const entrance = resolveTextEntrance(
    frame,
    durationInFrames,
    type,
    fps,
    autoExit,
  );

  if (type === "typewriter") {
    return (
      <Typewriter
        text={text}
        frame={frame}
        fps={fps}
        opacity={entrance.opacity}
        style={style}
        align={align}
      />
    );
  }

  if (type === "kinetic") {
    return (
      <KineticLine
        text={text}
        frame={frame}
        fps={fps}
        opacity={entrance.opacity}
        style={style}
        align={align}
      />
    );
  }

  if (type === "marker") {
    return (
      <MarkerLine
        text={text}
        frame={frame}
        fps={fps}
        opacity={entrance.opacity}
        style={style}
        align={align}
      />
    );
  }

  if (type === "letter_rise") {
    return (
      <LetterRise
        text={text}
        frame={frame}
        fps={fps}
        opacity={entrance.opacity}
        style={style}
        align={align}
      />
    );
  }

  if (type === "shimmer") {
    return (
      <ShimmerLine
        text={text}
        frame={frame}
        fps={fps}
        opacity={entrance.opacity}
        style={style}
        align={align}
      />
    );
  }

  if (type === "wave") {
    return (
      <WaveLine
        text={text}
        frame={frame}
        fps={fps}
        opacity={entrance.opacity}
        style={style}
        align={align}
      />
    );
  }

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
        opacity: entrance.opacity,
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

const Typewriter = ({
  text,
  frame,
  fps,
  opacity,
  style,
  align,
}: {
  text: string;
  frame: number;
  fps: number;
  opacity: number;
  style?: CSSProperties;
  align: "left" | "center" | "right";
}) => {
  const chars = Array.from(text);
  const framesPerChar = Math.max(1, Math.round(fps * 0.045));
  const count = Math.min(chars.length, Math.floor(frame / framesPerChar));
  const done = count >= chars.length;
  const caretOn = !done && Math.floor(frame / 8) % 2 === 0;

  return (
    <div style={{ ...style, opacity, textAlign: align }}>
      {chars.slice(0, count).join("")}
      <span
        style={{
          display: "inline-block",
          width: done ? 0 : 2,
          height: "0.82em",
          marginLeft: done ? 0 : 5,
          backgroundColor: theme.colors.accent,
          opacity: caretOn ? 1 : 0,
          verticalAlign: "text-bottom",
        }}
      />
    </div>
  );
};

const KineticLine = ({
  text,
  frame,
  fps,
  opacity,
  style,
  align,
}: {
  text: string;
  frame: number;
  fps: number;
  opacity: number;
  style?: CSSProperties;
  align: "left" | "center" | "right";
}) => {
  const words = text.split(" ").filter((word) => word.length > 0);
  const stagger = Math.max(1, Math.round(fps * 0.07));
  const length = Math.max(1, Math.round(fps * 0.42));

  return (
    <div style={{ ...style, opacity, textAlign: align }}>
      {words.map((word, index) => {
        const start = stagger * index;
        const progress = interpolate(frame, [start, start + length], [0, 1], {
          easing: Easing.out(Easing.back(1.5)),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const wordOpacity = interpolate(
          frame,
          [start, start + length * 0.45],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );

        return (
          <span
            key={`${word}-${String(index)}`}
            style={{
              display: "inline-block",
              marginRight: index === words.length - 1 ? 0 : "0.28em",
              opacity: wordOpacity,
              transform: `translateY(${String((1 - progress) * 18)}px) rotate(${String((1 - progress) * -2.5)}deg) scale(${String(0.9 + progress * 0.1)})`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

const MarkerLine = ({
  text,
  frame,
  fps,
  opacity,
  style,
  align,
}: {
  text: string;
  frame: number;
  fps: number;
  opacity: number;
  style?: CSSProperties;
  align: "left" | "center" | "right";
}) => {
  const enter = secondsToFrames(theme.animation.entranceSec, fps);
  const width = lerpFrames(frame, 4, enter, 0, 100);

  return (
    <div
      style={{
        display: "inline-block",
        maxWidth: style?.maxWidth ?? "100%",
        opacity,
        textAlign: align,
      }}
    >
      <div style={{ ...style, maxWidth: "100%" }}>{text}</div>
      <div
        style={{
          height: 5,
          width: `${String(width)}%`,
          marginTop: 12,
          backgroundColor: theme.colors.accent,
        }}
      />
    </div>
  );
};

const LetterRise = ({
  text,
  frame,
  fps,
  opacity,
  style,
  align,
}: {
  text: string;
  frame: number;
  fps: number;
  opacity: number;
  style?: CSSProperties;
  align: "left" | "center" | "right";
}) => {
  const chars = Array.from(text);
  const stagger = Math.max(1, Math.round(fps * 0.028));
  const length = Math.max(1, Math.round(fps * 0.36));

  return (
    <div style={{ ...style, opacity, textAlign: align }}>
      {chars.map((char, index) => {
        if (char === " " || char === "\n") {
          return char === "\n" ? <br key={index} /> : <span key={index}> </span>;
        }
        const start = stagger * index;
        const progress = interpolate(frame, [start, start + length], [0, 1], {
          easing: Easing.out(Easing.back(1.35)),
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const charOpacity = interpolate(
          frame,
          [start, start + length * 0.4],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        return (
          <span
            key={`${char}-${String(index)}`}
            style={{
              display: "inline-block",
              opacity: charOpacity,
              transform: `translateY(${String((1 - progress) * 24)}px)`,
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
};

const ShimmerLine = ({
  text,
  frame,
  fps,
  opacity,
  style,
  align,
}: {
  text: string;
  frame: number;
  fps: number;
  opacity: number;
  style?: CSSProperties;
  align: "left" | "center" | "right";
}) => {
  const fade = lerpFrames(frame, 0, Math.round(fps * 0.35), 0, 1);
  const period = Math.max(1, Math.round(fps * 2.2));
  const travel = ((frame % period) / period) * 160 - 30;

  return (
    <div
      style={{
        ...style,
        display: "inline-block",
        maxWidth: "100%",
        opacity: opacity * fade,
        textAlign: align,
        color: "transparent",
        backgroundImage: `linear-gradient(100deg, ${theme.colors.text} ${String(travel - 16)}%, ${theme.colors.accent} ${String(travel)}%, ${theme.colors.text} ${String(travel + 16)}%)`,
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}
    >
      {text}
    </div>
  );
};

const WaveLine = ({
  text,
  frame,
  fps,
  opacity,
  style,
  align,
}: {
  text: string;
  frame: number;
  fps: number;
  opacity: number;
  style?: CSSProperties;
  align: "left" | "center" | "right";
}) => {
  const chars = Array.from(text);
  const stagger = Math.max(1, Math.round(fps * 0.03));
  const length = Math.max(1, Math.round(fps * 0.28));

  return (
    <div style={{ ...style, opacity, textAlign: align }}>
      {chars.map((char, index) => {
        if (char === " " || char === "\n") {
          return char === "\n" ? <br key={index} /> : <span key={index}> </span>;
        }
        const start = stagger * index;
        const reveal = interpolate(frame, [start, start + length], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const bob = Math.sin((frame / fps) * 3.4 + index * 0.55) * 7 * reveal;
        return (
          <span
            key={`${char}-${String(index)}`}
            style={{
              display: "inline-block",
              opacity: reveal,
              transform: `translateY(${String(bob)}px)`,
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
};

type EntranceProps = {
  animation?: TextAnimation;
  children: ReactNode;
};

export const Entrance = ({ animation, children }: EntranceProps) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const anim = normalizeTextAnimationInput(animation);
  const style = resolveTextEntrance(
    frame,
    durationInFrames,
    anim.type,
    fps,
    anim.auto_exit ?? true,
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
