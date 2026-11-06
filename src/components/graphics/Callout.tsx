import { useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { SafeArea, textAlignForPlacement } from "../common/SafeArea";
import { Entrance } from "../text/AnimatedText";
import { lerpFrames } from "../../utils/interpolate";
import { theme } from "../../styles/theme";
import { secondsToFrames } from "../../utils/time";
import type { LayerPlacement } from "../../types/common";
import type { TextAnimation } from "../../types/edit-plan";

type CalloutProps = {
  kicker?: string;
  text: string;
  detail?: string;
  animation?: TextAnimation;
  placement?: LayerPlacement;
};

export const Callout = ({
  kicker,
  text,
  detail,
  animation,
  placement = "top_left",
}: CalloutProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const align = textAlignForPlacement(placement);
  const rule = lerpFrames(frame, 2, secondsToFrames(0.5, fps), 0, 64);

  return (
    <AbsoluteFill style={{ zIndex: 30 }}>
      <SafeArea placement={placement}>
        <Entrance animation={animation}>
          <div
            style={{
              display: "inline-flex",
              flexDirection: "column",
              alignItems: align === "right" ? "flex-end" : "flex-start",
              maxWidth: 560,
              padding: "18px 22px 16px",
              backgroundColor: "rgba(8, 9, 12, 0.74)",
              border: `1px solid ${theme.colors.accent}66`,
              textAlign: align,
            }}
          >
            {kicker ? (
              <div
                style={{
                  color: theme.colors.accent,
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSize.caption,
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                {kicker}
              </div>
            ) : null}
            <div
              style={{
                width: rule,
                height: 3,
                marginTop: 10,
                marginBottom: 12,
                backgroundColor: theme.colors.accent,
              }}
            />
            <div
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.display,
                fontSize: 40,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1.15,
                whiteSpace: "pre-line",
              }}
            >
              {text}
            </div>
            {detail ? (
              <div
                style={{
                  marginTop: 8,
                  color: theme.colors.textMuted,
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSize.caption,
                  letterSpacing: "0.02em",
                  lineHeight: 1.4,
                  whiteSpace: "pre-line",
                }}
              >
                {detail}
              </div>
            ) : null}
          </div>
        </Entrance>
      </SafeArea>
    </AbsoluteFill>
  );
};
