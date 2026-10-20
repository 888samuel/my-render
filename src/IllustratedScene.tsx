import { VideoEngine } from "./engine/VideoEngine";
import type { EditPlan } from "./types/edit-plan";

/**
 * Preview of stacked pictures, a shared camera, a counter, and a drawn line.
 * Open composition "IllustratedScene" in Remotion Studio.
 */
const illustratedPlan: EditPlan = {
  version: "1.0",
  video: {
    id: "illustrated_scene",
    width: 1920,
    height: 1080,
    fps: 30,
    duration_sec: 6,
  },
  clips: [
    {
      id: "scene",
      start_sec: 0,
      end_sec: 6,
      src: "assets/images/img_003.png",
      fit: "cover",
      camera: { type: "drift_right", intensity: 0.85 },
      media: [
        {
          zIndex: 1,
          src: "assets/images/img_008.png",
          placement: "center_right",
          motion: { type: "breathe", parallaxFactor: 1.45 },
        },
        {
          zIndex: 2,
          src: "assets/images/img_010.png",
          placement: "center_left",
          opacity: 0.96,
          motion: { type: "subtle_movement", parallaxFactor: 1.15 },
        },
      ],
      layers: [
        {
          type: "counter",
          from: 0,
          to: 64,
          label: "studies",
          placement: "top_center",
          start_sec: 0.25,
        },
        {
          type: "vector",
          shape: "underline",
          placement: "center",
          start_sec: 0.4,
        },
        {
          type: "text",
          variant: "subtitle",
          text: "Belief moved the outcome more than income did.",
          placement: "bottom_center",
          animation: { type: "fade_in" },
        },
      ],
    },
  ],
};

export const IllustratedScene = () => {
  return <VideoEngine editPlan={illustratedPlan} />;
};
