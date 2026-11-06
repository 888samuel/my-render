import { VideoComposition, type VideoCompositionProps } from "./Composition";
import type { EditPlan } from "./types/edit-plan";

/** 20-second tour of text that stays in motion, plus chips and a filling bar. */
export const capabilityDemoPlan: EditPlan = {
  version: "1.0",
  video: {
    id: "capability_demo_20s",
    width: 1920,
    height: 1080,
    fps: 30,
    duration_sec: 20,
  },
  clips: [
    {
      id: "letters",
      start_sec: 0,
      end_sec: 3.4,
      src: "assets/images/hook_inner_judge.png",
      fit: "cover",
      overlay: "vignette",
      motion: { type: "ken_burns", intensity: 0.45 },
      transition_in: { type: "fade_in_from_black", duration_sec: 0.45 },
      layers: [
        {
          type: "text",
          variant: "title",
          text: "Letter rise",
          placement: "center",
          animation: { type: "letter_rise" },
        },
        {
          type: "text",
          variant: "subtitle",
          text: "Each character climbs into the line.",
          placement: "bottom_center",
          animation: { type: "fade_up" },
        },
      ],
    },
    {
      id: "shimmer",
      start_sec: 3.4,
      end_sec: 6.8,
      src: "assets/images/hook_digital_chains.png",
      fit: "cover",
      overlay: "spotlight",
      motion: { type: "sway", intensity: 0.45 },
      transition_in: { type: "crossfade", duration_sec: 0.4 },
      layers: [
        {
          type: "text",
          variant: "title",
          text: "Shimmer",
          placement: "center",
          animation: { type: "shimmer" },
        },
        {
          type: "text",
          variant: "subtitle",
          text: "A gold glint keeps traveling through the word.",
          placement: "bottom_center",
          animation: { type: "fade_up" },
        },
      ],
    },
    {
      id: "wave",
      start_sec: 6.8,
      end_sec: 10.2,
      src: "assets/images/mindfulness_breath_anchor.png",
      fit: "cover",
      overlay: "dark_gradient",
      motion: { type: "focus_pull", intensity: 0.45 },
      transition_in: { type: "crossfade", duration_sec: 0.4 },
      layers: [
        {
          type: "text",
          variant: "title",
          text: "Wave",
          placement: "center",
          animation: { type: "wave" },
        },
        {
          type: "text",
          variant: "subtitle",
          text: "The letters keep moving after they arrive.",
          placement: "bottom_center",
          animation: { type: "fade_up" },
        },
      ],
    },
    {
      id: "chips",
      start_sec: 10.2,
      end_sec: 14,
      src: "assets/images/cbt_courtroom_notebook.png",
      fit: "cover",
      overlay: "vignette",
      motion: { type: "orbit", intensity: 0.36 },
      transition_in: { type: "crossfade", duration_sec: 0.4 },
      layers: [
        {
          type: "text",
          variant: "title",
          text: "Chips",
          placement: "top_center",
          animation: { type: "mask_up" },
        },
        {
          type: "chips",
          items: ["Courtroom", "+65%", "10 min", "7 days", "Friend test"],
          placement: "center",
        },
      ],
    },
    {
      id: "progress",
      start_sec: 14,
      end_sec: 17.2,
      src: "assets/images/outro_five_antidotes_wheel.png",
      fit: "cover",
      overlay: "vignette",
      motion: { type: "ken_burns", intensity: 0.4 },
      transition_in: { type: "crossfade", duration_sec: 0.4 },
      layers: [
        {
          type: "text",
          variant: "title",
          text: "Progress",
          placement: "center",
          animation: { type: "kinetic" },
        },
        {
          type: "progress",
          label: "Five antidotes",
        },
      ],
    },
    {
      id: "close",
      start_sec: 17.2,
      end_sec: 20,
      src: "assets/images/outro_growth_horizon.png",
      fit: "cover",
      overlay: "warm",
      motion: { type: "orbit", intensity: 0.32 },
      transition_in: { type: "crossfade", duration_sec: 0.4 },
      transition_out: { type: "fade_to_black", duration_sec: 0.55 },
      layers: [
        {
          type: "chapter_card",
          eyebrow: "Still moving",
          title: "Shimmer holds",
          subtitle: "The title never sits still",
          animation: { type: "shimmer" },
        },
      ],
    },
  ],
};

export const CapabilityDemo = ({ editPlan }: VideoCompositionProps) => {
  return <VideoComposition editPlan={editPlan} />;
};
