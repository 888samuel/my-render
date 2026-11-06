import { Easing, interpolate, useCurrentFrame } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { SafeArea, textAlignForPlacement } from "../common/SafeArea";
import { theme } from "../../styles/theme";
import { lerpFrames } from "../../utils/interpolate";
import type { CounterLayer } from "../../types/edit-plan";

type DataCounterProps = {
  layer: CounterLayer;
  durationInFrames: number;
};

export const DataCounter = ({ layer, durationInFrames }: DataCounterProps) => {
  const frame = useCurrentFrame();
  const countFrames = Math.max(1, Math.min(durationInFrames - 1, 42));
  const value = interpolate(frame, [0, countFrames], [layer.from, layer.to], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const decimals = layer.decimals ?? 0;
  const shown = Number(value.toFixed(decimals)).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const prefix = layer.prefix ?? "";
  const suffix = layer.suffix ?? "";
  const align = textAlignForPlacement(layer.placement ?? "center");
  const cross =
    align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
  const opacity = Math.min(
    lerpFrames(frame, 0, 12, 0, 1),
    lerpFrames(frame, durationInFrames - 12, durationInFrames, 1, 0),
  );
  const rise = lerpFrames(frame, 0, 14, 18, 0);
  const rule = lerpFrames(frame, 2, 16, 0, 56);

  return (
    <AbsoluteFill style={{ zIndex: 30 }}>
      <SafeArea placement={layer.placement ?? "center"}>
        <div
          style={{
            opacity,
            transform: `translateY(${String(rise)}px)`,
            display: "inline-flex",
            flexDirection: "column",
            alignItems: cross,
            minWidth: 240,
            padding: "18px 26px 16px",
            textAlign: align,
            backgroundColor: "rgba(8, 9, 12, 0.74)",
            border: `1px solid ${theme.colors.accent}66`,
          }}
        >
          <div
            style={{
              width: rule,
              height: 3,
              marginBottom: 12,
              backgroundColor: theme.colors.accent,
            }}
          />
          <div
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.display,
              fontSize: 84,
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
            }}
          >
            {prefix}
            {shown}
            {suffix}
          </div>
          {layer.label ? (
            <div
              style={{
                marginTop: 10,
                color: theme.colors.accent,
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSize.caption,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              {layer.label}
            </div>
          ) : null}
        </div>
      </SafeArea>
    </AbsoluteFill>
  );
};
