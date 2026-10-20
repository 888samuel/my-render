import { Easing, interpolate, useCurrentFrame } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { SafeArea } from "../common/SafeArea";
import { theme } from "../../styles/theme";
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
  const shown = value.toFixed(decimals);
  const prefix = layer.prefix ?? "";
  const suffix = layer.suffix ?? "";

  return (
    <AbsoluteFill style={{ zIndex: 30 }}>
      <SafeArea placement={layer.placement ?? "center"}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.display,
              fontSize: 108,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              textShadow: "0 8px 28px rgba(0,0,0,0.45)",
            }}
          >
            {prefix}
            {shown}
            {suffix}
          </div>
          {layer.label ? (
            <div
              style={{
                marginTop: theme.spacing.sm,
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
