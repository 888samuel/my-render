import { Easing, interpolate, useCurrentFrame } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { SafeArea } from "../common/SafeArea";
import { theme } from "../../styles/theme";
import type { VectorLayer } from "../../types/edit-plan";

type VectorDrawingProps = {
  layer: VectorLayer;
  durationInFrames: number;
};

export const VectorDrawing = ({ layer, durationInFrames }: VectorDrawingProps) => {
  const frame = useCurrentFrame();
  const drawFrames = Math.max(1, Math.min(durationInFrames - 1, 28));
  const progress = interpolate(frame, [0, drawFrames], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const color = layer.color ?? theme.colors.accent;
  const stroke = layer.strokeWidth ?? (layer.shape === "underline" ? 3 : 5);
  const circular = layer.shape === "circle";

  return (
    <AbsoluteFill style={{ zIndex: 25, pointerEvents: "none" }}>
      <SafeArea placement={layer.placement ?? "center"}>
        <svg
          viewBox={circular ? "0 0 100 100" : "0 0 100 24"}
          width={circular ? 220 : 520}
          height={circular ? 220 : 72}
        >
          {layer.shape === "line" || layer.shape === "underline" ? (
            <line
              x1="4"
              y1="12"
              x2="96"
              y2="12"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray="92"
              strokeDashoffset={92 * (1 - progress)}
            />
          ) : null}
          {layer.shape === "arrow" ? (
            <>
              <line
                x1="4"
                y1="12"
                x2="86"
                y2="12"
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray="82"
                strokeDashoffset={82 * (1 - progress)}
              />
              <polygon
                points="78,5 96,12 78,19"
                fill={color}
                opacity={progress > 0.72 ? 1 : 0}
              />
            </>
          ) : null}
          {layer.shape === "circle" ? (
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray="226"
              strokeDashoffset={226 * (1 - progress)}
              transform="rotate(-90 50 50)"
            />
          ) : null}
          {layer.shape === "bar" ? (
            <rect
              x="4"
              y="8"
              width={92 * progress}
              height="8"
              rx="4"
              fill={color}
            />
          ) : null}
        </svg>
      </SafeArea>
    </AbsoluteFill>
  );
};
