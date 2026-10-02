import { AbsoluteFill } from "../common/AbsoluteFill";
import { SafeArea } from "../common/SafeArea";
import { Entrance } from "../text/AnimatedText";
import { theme } from "../../styles/theme";
import type { LayerPlacement } from "../../types/common";
import type { TextAnimation } from "../../types/edit-plan";

type YearStampProps = {
  text: string;
  animation?: TextAnimation;
  placement?: LayerPlacement;
};

export const YearStamp = ({
  text,
  animation,
  placement = "top_left",
}: YearStampProps) => {
  return (
    <AbsoluteFill>
      <SafeArea placement={placement}>
        <Entrance animation={animation}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: theme.spacing.sm,
              border: `1px solid ${theme.colors.accent}88`,
              backgroundColor: "rgba(11, 12, 16, 0.62)",
              padding: `${String(theme.spacing.sm)}px ${String(theme.spacing.md)}px`,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                backgroundColor: theme.colors.accent,
              }}
            />
            <div
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSize.body,
                letterSpacing: "0.06em",
                fontWeight: 600,
                whiteSpace: "pre-line",
              }}
            >
              {text}
            </div>
          </div>
        </Entrance>
      </SafeArea>
    </AbsoluteFill>
  );
};
