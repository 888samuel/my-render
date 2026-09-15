import { AbsoluteFill } from "../common/AbsoluteFill";
import { SafeArea } from "../common/SafeArea";
import { StaggeredItem } from "../text/AnimatedText";
import { Entrance } from "../text/AnimatedText";
import { theme } from "../../styles/theme";
import type { LayerPlacement } from "../../types/common";
import type { TextAnimation } from "../../types/edit-plan";

type NumberedListProps = {
  items: Array<{ number?: string; label: string }>;
  animation?: TextAnimation;
  placement?: LayerPlacement;
};

export const NumberedList = ({
  items,
  animation,
  placement = "left",
}: NumberedListProps) => {
  const sequential = (animation?.type ?? "sequential") === "sequential";

  return (
    <AbsoluteFill>
      <SafeArea placement={placement}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing.lg,
            width: "100%",
            maxWidth: 1080,
          }}
        >
          {items.map((item, index) => {
            const number = item.number ?? String(index + 1).padStart(2, "0");
            const row = (
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: theme.spacing.md,
                }}
              >
                <div
                  style={{
                    color: theme.colors.accent,
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSize.caption,
                    fontWeight: 600,
                    letterSpacing: "0.22em",
                    minWidth: 72,
                  }}
                >
                  {number}
                </div>
                <div
                  style={{
                    color: theme.colors.textMuted,
                    fontFamily: theme.fonts.body,
                    fontSize: theme.fontSize.caption,
                    letterSpacing: "0.18em",
                  }}
                >
                  —
                </div>
                <div
                  style={{
                    color: theme.colors.text,
                    fontFamily: theme.fonts.display,
                    fontSize: theme.fontSize.list,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.15,
                  }}
                >
                  {item.label}
                </div>
              </div>
            );

            return (
              <div key={`${number}-${item.label}`}>
                {sequential ? (
                  <StaggeredItem index={index}>{row}</StaggeredItem>
                ) : (
                  <Entrance animation={animation}>{row}</Entrance>
                )}
              </div>
            );
          })}
        </div>
      </SafeArea>
    </AbsoluteFill>
  );
};
