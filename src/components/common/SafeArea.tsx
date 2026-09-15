import type { CSSProperties, ReactNode } from "react";
import type { LayerPlacement } from "../../types/common";
import { theme } from "../../styles/theme";

type SafeAreaProps = {
  children: ReactNode;
  placement?: LayerPlacement;
};

export const textAlignForPlacement = (
  placement: LayerPlacement = "center",
): "left" | "center" | "right" => {
  if (
    placement === "left" ||
    placement === "top_left" ||
    placement === "bottom_left" ||
    placement === "center_left" ||
    placement === "lower_third"
  ) {
    return "left";
  }

  if (
    placement === "right" ||
    placement === "top_right" ||
    placement === "bottom_right" ||
    placement === "center_right"
  ) {
    return "right";
  }

  return "center";
};

const layoutForPlacement = (placement: LayerPlacement): CSSProperties => {
  switch (placement) {
    case "none":
    case "center":
      return { alignItems: "center", justifyContent: "center" };
    case "left":
    case "center_left":
      return { alignItems: "flex-start", justifyContent: "center" };
    case "right":
    case "center_right":
      return { alignItems: "flex-end", justifyContent: "center" };
    case "top_left":
      return { alignItems: "flex-start", justifyContent: "flex-start" };
    case "top_right":
      return { alignItems: "flex-end", justifyContent: "flex-start" };
    case "top_center":
      return { alignItems: "center", justifyContent: "flex-start" };
    case "bottom_left":
    case "lower_third":
      return { alignItems: "flex-start", justifyContent: "flex-end" };
    case "bottom_right":
      return { alignItems: "flex-end", justifyContent: "flex-end" };
    case "bottom_center":
      return { alignItems: "center", justifyContent: "flex-end" };
  }
};

export const SafeArea = ({ children, placement = "center" }: SafeAreaProps) => {
  const isBottom =
    placement === "lower_third" ||
    placement === "bottom_left" ||
    placement === "bottom_right" ||
    placement === "bottom_center";

  return (
    <div
      style={{
        boxSizing: "border-box",
        width: "100%",
        height: "100%",
        padding: theme.layout.safeMargin,
        paddingBottom: isBottom
          ? theme.layout.safeMargin + theme.spacing.lg
          : theme.layout.safeMargin,
        display: "flex",
        flexDirection: "column",
        ...layoutForPlacement(placement),
      }}
    >
      {children}
    </div>
  );
};
