import { VideoComposition, type VideoCompositionProps } from "./Composition";
import type { EditPlan } from "./types/edit-plan";

/** Short reel of footage editing: full-frame plate, picture-in-picture, trim. */
export const videoEditPlan: EditPlan = {
  version: "1.0",
  video: {
    id: "video_edit_reel",
    width: 1920,
    height: 1080,
    fps: 30,
    duration_sec: 8,
  },
  clips: [
    {
      id: "plate",
      start_sec: 0,
      end_sec: 3,
      source: "video",
      src: "assets/videos/sample-bars.mp4",
      trim_start_sec: 0.4,
      volume: 0,
      fit: "cover",
      overlay: "dark_gradient",
      motion: { type: "slow_zoom_in", intensity: 0.6 },
      transition_in: { type: "fade", duration_sec: 0.3 },
      layers: [
        {
          type: "text",
          variant: "title",
          text: "VIDEO PLATE",
          placement: "top_center",
          animation: { type: "fade_up" },
        },
        {
          type: "text",
          variant: "subtitle",
          text: "Starts 0.4s into the file. Silent under narration.",
          placement: "bottom_center",
          animation: { type: "fade_in" },
        },
      ],
    },
    {
      id: "pip",
      start_sec: 3,
      end_sec: 5.5,
      src: "assets/images/batch1_img01_hook_scrolling.png",
      fit: "cover",
      overlay: "dark_gradient",
      transition_in: { type: "fade", duration_sec: 0.3 },
      layers: [
        {
          type: "video",
          src: "assets/videos/sample-bars.mp4",
          playback_rate: 2,
          loop: true,
          volume: 0,
          x: 72,
          y: 46,
          width: 38,
        },
        {
          type: "text",
          variant: "title",
          text: "PICTURE IN PICTURE",
          placement: "left",
          animation: { type: "fade_up" },
        },
        {
          type: "text",
          variant: "subtitle",
          text: "The inset plays at double speed and loops.",
          placement: "bottom_center",
          animation: { type: "fade_in" },
        },
      ],
    },
    {
      id: "trim",
      start_sec: 5.5,
      end_sec: 8,
      source: "video",
      src: "assets/videos/sample-bars.mp4",
      trim_start_sec: 1.2,
      trim_end_sec: 3.2,
      volume: 1,
      fit: "contain",
      transition_in: { type: "fade", duration_sec: 0.25 },
      layers: [
        {
          type: "text",
          variant: "title",
          text: "TRIM AND SOUND",
          placement: "top_center",
          animation: { type: "fade_up" },
        },
        {
          type: "text",
          variant: "subtitle",
          text: "File time 1.2s to 3.2s. The last frame holds, with audio.",
          placement: "bottom_center",
          animation: { type: "fade_in" },
        },
      ],
    },
  ],
};

export const VideoEditReel = ({ editPlan }: VideoCompositionProps) => {
  return <VideoComposition editPlan={editPlan} />;
};
