import type { CSSProperties, ReactNode } from "react";
import type { LayerPlacement } from "../../types/common";
import { theme } from "../../styles/theme";

type SafeAreaProps = {
  children: ReactNode;
  placement?: LayerPlacement;
};

export const SafeArea = ({ children, placement = "center" }: SafeAreaProps) => {
  const layout: CSSProperties =
    placement === "lower_third"
      ? { alignItems: "flex-start", justifyContent: "flex-end" }
      : placement === "left"
        ? { alignItems: "flex-start", justifyContent: "center" }
        : { alignItems: "center", justifyContent: "center" };

  return (
    <div
      style={{
        boxSizing: "border-box",
        width: "100%",
        height: "100%",
        padding: theme.layout.safeMargin,
        paddingBottom:
          placement === "lower_third"
            ? theme.layout.safeMargin + theme.spacing.md
            : theme.layout.safeMargin,
        display: "flex",
        flexDirection: "column",
        ...layout,
      }}
    >
      {children}
    </div>
  );
};
