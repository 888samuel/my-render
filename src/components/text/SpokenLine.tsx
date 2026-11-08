import type { CSSProperties } from "react";
import { spokenCharCount } from "../../engine/AnimationResolver";
import {
  activeIndex,
  entranceProgress,
  splitClauses,
  splitLines,
  splitWords,
  spokenProgress,
  weightedUnits,
  type SpokenKind,
  type WeightedUnit,
} from "../../engine/spokenUnits";
import { theme } from "../../styles/theme";

type SpokenLineProps = {
  kind: SpokenKind;
  text: string;
  frame: number;
  fps: number;
  durationInFrames: number;
  opacity: number;
  style?: CSSProperties;
  align: "left" | "center" | "right";
};

const ETHIOPIC = "ሀለሐመሠረሰሸቀበተቸነኘአከኸወዐዘዠየደጀገጠጨጰጸፀፈፐ";
const LATIN = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export const SpokenLine = ({
  kind,
  text,
  frame,
  fps,
  durationInFrames,
  opacity,
  style,
  align,
}: SpokenLineProps) => {
  const progress = spokenProgress(frame, durationInFrames);
  const block: CSSProperties = { ...style, opacity, textAlign: align };

  switch (kind) {
    case "wipe":
      return (
        <div style={block}>
          <div
            style={{
              display: "inline-block",
              maxWidth: "100%",
              clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
            }}
          >
            {text}
          </div>
        </div>
      );
    case "underline":
      return (
        <div style={block}>
          <div style={{ display: "inline-block", maxWidth: "100%" }}>
            <div>{text}</div>
            <div
              style={{
                height: 6,
                width: `${progress * 100}%`,
                marginTop: 16,
                backgroundColor: theme.colors.accent,
              }}
            />
          </div>
        </div>
      );
    case "ghost":
      return (
        <GhostFill
          text={text}
          frame={frame}
          durationInFrames={durationInFrames}
          style={block}
        />
      );
    case "decode":
      return (
        <DecodeLine
          text={text}
          frame={frame}
          durationInFrames={durationInFrames}
          style={block}
        />
      );
    case "stroke":
      return (
        <StrokeLine
          text={text}
          frame={frame}
          durationInFrames={durationInFrames}
          style={block}
        />
      );
    case "lines":
    case "clauses":
      return (
        <StackedUnits
          units={weightedUnits(kind === "lines" ? splitLines(text) : splitClauses(text))}
          progress={progress}
          style={block}
          align={align}
        />
      );
    case "voice_words":
    case "follow":
    case "dim_past":
    case "word_box":
    case "word_rise":
    case "focus":
    case "punch":
      return (
        <WordLine
          kind={kind}
          words={splitWords(text)}
          frame={frame}
          fps={fps}
          durationInFrames={durationInFrames}
          progress={progress}
          style={block}
        />
      );
  }
};

const WordLine = ({
  kind,
  words,
  frame,
  fps,
  durationInFrames,
  progress,
  style,
}: {
  kind: "voice_words" | "follow" | "dim_past" | "word_box" | "word_rise" | "focus" | "punch";
  words: string[];
  frame: number;
  fps: number;
  durationInFrames: number;
  progress: number;
  style: CSSProperties;
}) => {
  const units = weightedUnits(words);
  const active = activeIndex(units, progress);

  return (
    <div style={style}>
      {words.map((word, index) => {
        const unit = units[index];
        return (
          <span
            key={`${word}-${String(index)}`}
            style={wordStyle(kind, index, active, frame, fps, durationInFrames, unit)}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

function wordStyle(
  kind: "voice_words" | "follow" | "dim_past" | "word_box" | "word_rise" | "focus" | "punch",
  index: number,
  active: number,
  frame: number,
  fps: number,
  durationInFrames: number,
  unit: WeightedUnit | undefined,
): CSSProperties {
  const base: CSSProperties = {
    display: "inline-block",
    marginRight: "0.28em",
    verticalAlign: "baseline",
  };
  const started = index <= active;
  const isActive = index === active;

  if (kind === "voice_words") {
    return { ...base, opacity: started ? 1 : 0 };
  }

  if (kind === "follow") {
    return {
      ...base,
      color: isActive ? theme.colors.accent : theme.colors.text,
    };
  }

  if (kind === "dim_past") {
    return {
      ...base,
      color: isActive ? theme.colors.accent : theme.colors.text,
      opacity: isActive ? 1 : index < active ? 0.42 : 0.2,
    };
  }

  if (kind === "word_box") {
    return {
      ...base,
      padding: "0.06em 0.2em",
      borderRadius: 12,
      backgroundColor: isActive ? theme.colors.accent : "transparent",
      color: isActive ? theme.colors.background : theme.colors.text,
    };
  }

  if (kind === "punch") {
    return {
      ...base,
      marginRight: "0.42em",
      color: isActive ? theme.colors.accent : theme.colors.text,
      transform: `scale(${isActive ? 1.08 : 1})`,
    };
  }

  const rise = entranceProgress(
    frame,
    fps,
    unit?.start ?? 1,
    durationInFrames,
    kind === "focus" ? 0.4 : 0.35,
  );

  if (kind === "word_rise") {
    return {
      ...base,
      opacity: rise,
      transform: `translateY(${(1 - rise) * 28}px)`,
    };
  }

  return {
    ...base,
    opacity: rise,
    filter: `blur(${(1 - rise) * 8}px)`,
  };
}

const StackedUnits = ({
  units,
  progress,
  style,
  align,
}: {
  units: WeightedUnit[];
  progress: number;
  style: CSSProperties;
  align: "left" | "center" | "right";
}) => {
  const active = activeIndex(units, progress);
  const items =
    align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center";

  return (
    <div
      style={{
        ...style,
        display: "flex",
        flexDirection: "column",
        alignItems: items,
        gap: 14,
      }}
    >
      {units.map((unit, index) => (
        <div key={`${unit.text}-${String(index)}`} style={{ opacity: index <= active ? 1 : 0 }}>
          {unit.text}
        </div>
      ))}
    </div>
  );
};

const GhostFill = ({
  text,
  frame,
  durationInFrames,
  style,
}: {
  text: string;
  frame: number;
  durationInFrames: number;
  style: CSSProperties;
}) => {
  const chars = Array.from(text);
  const count = spokenCharCount(frame, durationInFrames, chars.length);

  return (
    <div style={style}>
      {chars.map((char, index) => (
        <span
          key={index}
          style={{
            color: index < count ? theme.colors.text : theme.colors.textMuted,
            opacity: index < count ? 1 : 0.45,
          }}
        >
          {char === "\n" ? <br /> : char}
        </span>
      ))}
    </div>
  );
};

const DecodeLine = ({
  text,
  frame,
  durationInFrames,
  style,
}: {
  text: string;
  frame: number;
  durationInFrames: number;
  style: CSSProperties;
}) => {
  const chars = Array.from(text);
  const count = spokenCharCount(frame, durationInFrames, chars.length);
  const tick = Math.floor(frame / 2);

  return (
    <div style={style}>
      {chars.map((char, index) => (
        <span key={index}>
          {char === "\n" ? (
            <br />
          ) : index < count ? (
            char
          ) : (
            scramble(char, tick, index)
          )}
        </span>
      ))}
    </div>
  );
};

const StrokeLine = ({
  text,
  frame,
  durationInFrames,
  style,
}: {
  text: string;
  frame: number;
  durationInFrames: number;
  style: CSSProperties;
}) => {
  const chars = Array.from(text);
  const end = Math.max(1, durationInFrames - 1);

  return (
    <div style={style}>
      {chars.map((char, index) => {
        if (char === "\n") return <br key={index} />;
        if (char === " ") return <span key={index}> </span>;
        const start = (index / Math.max(1, chars.length)) * end;
        const stop = ((index + 1) / Math.max(1, chars.length)) * end;
        const local = Math.min(1, Math.max(0, (frame - start) / Math.max(1, stop - start)));
        return (
          <span
            key={index}
            style={{
              display: "inline-block",
              clipPath: `inset(0 ${(1 - local) * 100}% 0 0)`,
            }}
          >
            {char}
          </span>
        );
      })}
    </div>
  );
};

function scramble(char: string, tick: number, index: number): string {
  if (char === " ") return " ";
  const ethiopic = /\p{Script=Ethiopic}/u.test(char);
  const pool = ethiopic ? ETHIOPIC : LATIN;
  const pick = (tick * 3 + index * 7) % pool.length;
  return pool.charAt(pick) || char;
}
