import {
  createSmoothSvgPath,
  useAudioData,
  visualizeAudioWaveform,
} from "@remotion/media-utils";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { listAudioTracks } from "../../engine/audioTracks";
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
  const audioSrc = listAudioTracks(plan.audio)[0]?.src;
  const src = staticFile(
    (audioSrc ?? "assets/audio/output.mp3").replace(/^\//, ""),
  );
  const audioData = useAudioData(src);
  const frame = compositionFrameOffset + localFrame;
  const visualWidth = Math.max(320, width - theme.layout.safeMargin * 2);
  const barWidth = 5;
  const barGap = 4;
  const numberOfSamples =
    variant === "waveform"
      ? 160
      : Math.max(48, Math.floor((visualWidth + barGap) / (barWidth + barGap)));

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
    numberOfSamples,
    windowInSeconds: 0.1,
    normalize: false,
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {variant === "waveform" ? (
        <Waveform samples={samples} width={visualWidth} />
      ) : (
        <Bars samples={samples} width={visualWidth} />
      )}
    </AbsoluteFill>
  );
};

const Bars = ({ samples, width }: { samples: number[]; width: number }) => {
  return (
    <div
      style={{
        position: "absolute",
        left: theme.layout.safeMargin,
        width,
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
  const height = 56;
  const path = createSmoothSvgPath({
    points: samples.map((sample, index) => ({
      x: (index / Math.max(samples.length - 1, 1)) * width,
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
        width={width}
        height={height}
        viewBox={`0 0 ${String(width)} ${String(height)}`}
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
