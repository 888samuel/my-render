import {
  createSmoothSvgPath,
  useAudioData,
  visualizeAudioWaveform,
} from "@remotion/media-utils";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { useEditPlan } from "../../engine/EditPlanContext";
import { theme } from "../../styles/theme";

type AudioVisualizerProps = {
  compositionFrameOffset: number;
  variant?: "bars" | "waveform";
};

export const AudioVisualizer = ({
  compositionFrameOffset,
  variant = "bars",
}: AudioVisualizerProps) => {
  const plan = useEditPlan();
  const localFrame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const audioSrc = plan.audio?.src;
  const src = staticFile(
    (audioSrc ?? "assets/audio/voiceover.wav").replace(/^\//, ""),
  );
  const audioData = useAudioData(src);
  const frame = compositionFrameOffset + localFrame;

  if (!audioSrc) {
    throw new Error(
      "ERROR:\nAudio visualizer requires audio.src in the edit plan.",
    );
  }

  if (!audioData) {
    return null;
  }

  const samples = visualizeAudioWaveform({
    audioData,
    fps,
    frame,
    numberOfSamples: 32,
    windowInSeconds: 0.1,
    normalize: false,
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {variant === "waveform" ? (
        <Waveform samples={samples} width={width} />
      ) : (
        <Bars samples={samples} />
      )}
    </AbsoluteFill>
  );
};

const Bars = ({ samples }: { samples: number[] }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 40,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 4,
        height: 56,
      }}
    >
      {samples.map((sample, index) => {
        const level = Math.min(1, Math.abs(sample) * 2.4);
        const barHeight = 4 + level * 52;

        return (
          <div
            key={`bar-${String(index)}`}
            style={{
              width: 5,
              height: barHeight,
              borderRadius: 999,
              backgroundColor: theme.colors.accent,
              opacity: 0.55 + level * 0.45,
            }}
          />
        );
      })}
    </div>
  );
};

const Waveform = ({
  samples,
  width,
}: {
  samples: number[];
  width: number;
}) => {
  const visualWidth = Math.min(720, width - theme.layout.safeMargin * 2);
  const height = 56;
  const path = createSmoothSvgPath({
    points: samples.map((sample, index) => ({
      x: (index / Math.max(samples.length - 1, 1)) * visualWidth,
      y: height / 2 + sample * (height / 2) * 0.9,
    })),
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 40,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <svg
        width={visualWidth}
        height={height}
        viewBox={`0 0 ${String(visualWidth)} ${String(height)}`}
      >
        <path
          d={path}
          fill="none"
          stroke={theme.colors.accent}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
