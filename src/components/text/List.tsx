import { AbsoluteFill } from "../common/AbsoluteFill";
import { SafeArea } from "../common/SafeArea";
import { Entrance, StaggeredItem } from "./AnimatedText";
import { theme } from "../../styles/theme";
import type { LayerPlacement } from "../../types/common";
import type { TextAnimation } from "../../types/edit-plan";

type ListProps = {
  items: string[];
  style?: "numbered" | "bullet";
  animation?: TextAnimation;
  placement?: LayerPlacement;
};

export const List = ({
  items,
  style = "bullet",
  animation,
  placement = "left",
}: ListProps) => {
  const sequential = animation?.type === "sequential";

  return (
    <AbsoluteFill>
      <SafeArea placement={placement}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing.md,
            width: "100%",
            maxWidth: 980,
          }}
        >
          {items.map((item, index) => {
            const row = (
              <div
                style={{
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSize.body,
                  letterSpacing: "0.01em",
                  lineHeight: 1.35,
                }}
              >
                {style === "numbered"
                  ? `${String(index + 1).padStart(2, "0")}  ${item}`
                  : `–  ${item}`}
              </div>
            );

            return (
              <div key={item}>
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

