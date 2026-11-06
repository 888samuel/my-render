import { useCurrentFrame } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { theme } from "../../styles/theme";
import { lerpFrames } from "../../utils/interpolate";

type ProgressRailProps = {
  label?: string;
  durationInFrames: number;
};

export const ProgressRail = ({ label, durationInFrames }: ProgressRailProps) => {
  const frame = useCurrentFrame();
  const end = Math.max(1, durationInFrames - 1);
  const fill = lerpFrames(frame, 0, end, 0, 100);
  const opacity = lerpFrames(frame, 0, 10, 0, 1);
  const shown = Math.round(fill);

  return (
    <AbsoluteFill
      style={{
        zIndex: 30,
        justifyContent: "flex-end",
        padding: `0 ${String(theme.layout.safeMargin)}px ${String(theme.layout.safeMargin)}px`,
        opacity,
      }}
    >
      <div style={{ width: "100%" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.body,
              fontSize: theme.fontSize.caption,
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            }}
          >
            {label ?? "Progress"}
          </div>
          <div
            style={{
              color: theme.colors.accent,
              fontFamily: theme.fonts.display,
              fontSize: 42,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {shown}%
          </div>
        </div>
        <div
          style={{
            width: "100%",
            height: 6,
            backgroundColor: "rgba(243, 239, 230, 0.18)",
          }}
        >
          <div
            style={{
              width: `${String(fill)}%`,
              height: "100%",
              backgroundColor: theme.colors.accent,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
