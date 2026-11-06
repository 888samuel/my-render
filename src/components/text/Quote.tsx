import { useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { SafeArea, textAlignForPlacement } from "../common/SafeArea";
import { Entrance } from "./AnimatedText";
import { lerpFrames } from "../../utils/interpolate";
import { theme } from "../../styles/theme";
import { secondsToFrames } from "../../utils/time";
import type { LayerPlacement } from "../../types/common";
import type { TextAnimation } from "../../types/edit-plan";

type QuoteProps = {
  text: string;
  attribution?: string;
  animation?: TextAnimation;
  placement?: LayerPlacement;
};

export const Quote = ({
  text,
  attribution,
  animation,
  placement = "center",
}: QuoteProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const mark = lerpFrames(frame, 0, secondsToFrames(0.55, fps), 0, 1);

  return (
    <AbsoluteFill>
      <SafeArea placement={placement}>
        <Entrance animation={animation}>
          <div
            style={{
              maxWidth: 1100,
              textAlign: textAlignForPlacement(placement),
            }}
          >
            <div
              style={{
                color: theme.colors.accent,
                fontFamily: theme.fonts.display,
                fontSize: 140,
                lineHeight: 0.45,
                height: 72,
                opacity: mark,
                transform: `translateY(${String((1 - mark) * 16)}px)`,
              }}
            >
              “
            </div>
            <div
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.display,
                fontSize: theme.fontSize.statement,
                fontStyle: "italic",
                lineHeight: 1.35,
                whiteSpace: "pre-line",
              }}
            >
              {text}
            </div>
            {attribution ? (
              <div
                style={{
                  color: theme.colors.textMuted,
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSize.caption,
                  letterSpacing: "0.16em",
                  marginTop: theme.spacing.md,
                  textTransform: "uppercase",
                }}
              >
                {attribution}
              </div>
            ) : null}
          </div>
        </Entrance>
      </SafeArea>
    </AbsoluteFill>
  );
};
