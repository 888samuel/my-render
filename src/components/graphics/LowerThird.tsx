import { useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { SafeArea, textAlignForPlacement } from "../common/SafeArea";
import { Entrance, RevealText } from "../text/AnimatedText";
import {
  isPerWordAnimation,
  resolveTextEntrance,
} from "../../engine/AnimationResolver";
import { normalizeTextAnimationInput } from "../../engine/normalizeAnimation";
import { lerpFrames } from "../../utils/interpolate";
import { theme } from "../../styles/theme";
import { secondsToFrames } from "../../utils/time";
import type { LayerPlacement } from "../../types/common";
import type { TextAnimation } from "../../types/edit-plan";

type LowerThirdProps = {
  title: string;
  subtitle?: string;
  animation?: TextAnimation;
  placement?: LayerPlacement;
};

export const LowerThird = ({
  title,
  subtitle,
  animation,
  placement = "bottom_left",
}: LowerThirdProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = normalizeTextAnimationInput(animation);
  const perWord = isPerWordAnimation(anim.type);
  const rule = lerpFrames(frame, 0, secondsToFrames(0.45, fps), 0, 72);
  const subtitleOpacity = lerpFrames(
    frame,
    6,
    secondsToFrames(0.55, fps),
    0,
    1,
  );
  const titleStyle = {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: theme.fontSize.statement,
    fontWeight: 600,
    letterSpacing: "-0.01em",
    lineHeight: 1.25,
    textShadow: "0 2px 12px rgba(0,0,0,0.55)",
    whiteSpace: "pre-line" as const,
    maxWidth: 980,
  };

  const body = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: theme.spacing.xs,
        maxWidth: 980,
      }}
    >
      {anim.type === "marker" ? null : (
        <div
          style={{
            width: rule,
            height: 4,
            backgroundColor: theme.colors.accent,
            marginBottom: theme.spacing.xs,
          }}
        />
      )}
      {perWord ? (
        <RevealText
          text={title}
          animation={{ ...anim, auto_exit: false }}
          align={textAlignForPlacement(placement)}
          style={titleStyle}
        />
      ) : (
        <div style={titleStyle}>{title}</div>
      )}
      {subtitle ? (
        <div
          style={{
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSize.caption,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            opacity: subtitleOpacity,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );

  return (
    <AbsoluteFill>
      <SafeArea placement={placement}>
        <div style={{ marginBottom: 108 }}>
          {perWord ? (
            <div
              style={{
                opacity: resolveTextEntrance(
                  frame,
                  durationInFrames,
                  anim.type,
                  fps,
                  anim.auto_exit ?? true,
                ).opacity,
              }}
            >
              {body}
            </div>
          ) : (
            <Entrance animation={anim}>{body}</Entrance>
          )}
        </div>
      </SafeArea>
    </AbsoluteFill>
  );
};

type ChapterCardProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  animation?: TextAnimation;
};

export const ChapterCard = ({
  eyebrow,
  title,
  subtitle,
  animation,
}: ChapterCardProps) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const anim = normalizeTextAnimationInput(animation);
  const perWord = isPerWordAnimation(anim.type);
  const rule = lerpFrames(frame, 2, secondsToFrames(0.7, fps), 0, 148);
  const tracking = lerpFrames(frame, 0, secondsToFrames(0.85, fps), 0.46, 0.22);
  const subtitleOpacity = lerpFrames(
    frame,
    8,
    secondsToFrames(0.95, fps),
    0,
    1,
  );
  const titleStyle = {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: theme.fontSize.title,
    fontWeight: 500,
    lineHeight: 1.2,
    whiteSpace: "pre-line" as const,
    maxWidth: 1400,
  };

  const body = (
    <div
      style={{
        textAlign: "center",
        maxWidth: 1400,
        padding: theme.spacing.lg,
      }}
    >
      {eyebrow ? (
        <div
          style={{
            color: theme.colors.accent,
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSize.caption,
            letterSpacing: `${String(tracking)}em`,
            textTransform: "uppercase",
            marginBottom: theme.spacing.md,
          }}
        >
          {eyebrow}
        </div>
      ) : null}
      <div
        style={{
          width: rule,
          height: 2,
          marginLeft: "auto",
          marginRight: "auto",
          marginBottom: theme.spacing.md,
          backgroundColor: theme.colors.accent,
        }}
      />
      {perWord ? (
        <RevealText
          text={title}
          animation={{ ...anim, auto_exit: false }}
          align="center"
          style={titleStyle}
        />
      ) : (
        <div style={titleStyle}>{title}</div>
      )}
      {subtitle ? (
        <div
          style={{
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.body,
            fontSize: theme.fontSize.body,
            marginTop: theme.spacing.md,
            lineHeight: 1.35,
            whiteSpace: "pre-line",
            opacity: subtitleOpacity,
          }}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, rgba(6,7,10,0.18) 0%, rgba(6,7,10,0.58) 40%, rgba(6,7,10,0.76) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {perWord ? (
        <div
          style={{
            opacity: resolveTextEntrance(
              frame,
              durationInFrames,
              anim.type,
              fps,
              anim.auto_exit ?? true,
            ).opacity,
          }}
        >
          {body}
        </div>
      ) : (
        <Entrance animation={anim}>{body}</Entrance>
      )}
    </AbsoluteFill>
  );
};
