import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { SafeArea } from "../common/SafeArea";
import { theme } from "../../styles/theme";
import type { LayerPlacement } from "../../types/common";

type ChipsProps = {
  items: string[];
  placement?: LayerPlacement;
};

export const Chips = ({ items, placement = "center" }: ChipsProps) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const labels = items.filter((item) => item.trim().length > 0);
  const stagger = Math.max(1, Math.round(fps * 0.16));
  const length = Math.max(1, Math.round(fps * 0.4));

  if (labels.length === 0) {
    return null;
  }

  return (
    <AbsoluteFill style={{ zIndex: 30 }}>
      <SafeArea placement={placement}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 16,
            maxWidth: 1280,
          }}
        >
          {labels.map((item, index) => {
            const start = stagger * index;
            const progress = interpolate(frame, [start, start + length], [0, 1], {
              easing: Easing.out(Easing.back(1.6)),
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const opacity = interpolate(frame, [start, start + length * 0.35], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const bob = Math.sin((frame / fps) * 2.4 + index * 0.8) * 5 * progress;

            return (
              <div
                key={`${item}-${String(index)}`}
                style={{
                  opacity,
                  transform: `translateY(${String((1 - progress) * 18 + bob)}px) scale(${String(0.86 + progress * 0.14)})`,
                  padding: "12px 20px",
                  backgroundColor: "rgba(8, 9, 12, 0.74)",
                  border: `1px solid ${theme.colors.accent}88`,
                  color: theme.colors.text,
                  fontFamily: theme.fonts.body,
                  fontSize: 30,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  lineHeight: 1.2,
                }}
              >
                {item}
              </div>
            );
          })}
        </div>
      </SafeArea>
    </AbsoluteFill>
  );
};
