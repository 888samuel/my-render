import { AbsoluteFill } from "../common/AbsoluteFill";
import { SafeArea, textAlignForPlacement } from "../common/SafeArea";
import { Entrance } from "./AnimatedText";
import { theme } from "../../styles/theme";
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
