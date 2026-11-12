import { VideoComposition, type VideoCompositionProps } from "./Composition";
import type { MotionType, TransitionType, VideoLook } from "./types/common";
import type { Clip, EditPlan } from "./types/edit-plan";

const SAMPLE = "assets/videos/sample-bars.mp4";
const STILL = "assets/images/batch1_img01_hook_scrolling.png";
const SHOT = 2;

type Beat = {
  id: string;
  look: VideoLook;
  title: string;
  detail: string;
  entrance: TransitionType;
  motion: MotionType;
};

const beats: Beat[] = [
  {
    id: "cinema",
    look: "cinema",
    title: "Cinema",
    detail: "Letterbox, cooler contrast, light grain.",
    entrance: "fade",
    motion: "slow_zoom_in",
  },
  {
    id: "film",
    look: "film",
    title: "Film",
    detail: "A warm print with heavier grain.",
    entrance: "crossfade",
    motion: "ken_burns",
  },
  {
    id: "noir",
    look: "noir",
    title: "Noir",
    detail: "Black and white, with the edges crushed.",
    entrance: "whip_pan",
    motion: "sway",
  },
  {
    id: "golden",
    look: "golden",
    title: "Golden",
    detail: "Amber light across the frame.",
    entrance: "flash_cut",
    motion: "drift",
  },
  {
    id: "teal",
    look: "teal",
    title: "Teal",
    detail: "Warm highlights, teal in the shadows.",
    entrance: "circle_pulse",
    motion: "slow_zoom_out",
  },
  {
    id: "fade",
    look: "fade",
    title: "Fade",
    detail: "Lifted blacks, like a washed print.",
    entrance: "crossfade",
    motion: "pan_left",
  },
  {
    id: "dream",
    look: "dream",
    title: "Dream",
    detail: "A soft bright center.",
    entrance: "whip_pan",
    motion: "orbit",
  },
  {
    id: "ink",
    look: "ink",
    title: "Ink",
    detail: "High contrast, almost a poster.",
    entrance: "glitch_cut",
    motion: "focus_pull",
  },
];

const plate = (beat: Beat, index: number): Clip => ({
  id: beat.id,
  start_sec: index * SHOT,
  end_sec: (index + 1) * SHOT,
  source: "video",
  src: SAMPLE,
  trim_start_sec: 0.2,
  volume: 0,
  loop: true,
  fit: "cover",
  look: beat.look,
  motion: { type: beat.motion, intensity: 0.7 },
  transition_in: { type: beat.entrance, duration_sec: 0.45 },
  layers: [
    {
      type: "callout",
      kicker: "Look",
      text: beat.title,
      detail: beat.detail,
      placement: "center_left",
      animation: { type: "fade_up" },
    },
  ],
});

const windowStart = beats.length * SHOT;
const editStart = windowStart + SHOT;
const EDIT = 2.5;

/** Full-frame grades, then one shot where the inset is graded on its own. */
export const videoEditPlan: EditPlan = {
  version: "1.0",
  video: {
    id: "video_edit_reel",
    width: 1920,
    height: 1080,
    fps: 30,
    duration_sec: editStart + EDIT * 4,
  },
  clips: [
    ...beats.map(plate),
    {
      id: "window",
      start_sec: windowStart,
      end_sec: windowStart + SHOT,
      src: STILL,
      fit: "cover",
      look: "film",
      transition_in: { type: "circle_pulse", duration_sec: 0.5 },
      layers: [
        {
          type: "video",
          src: SAMPLE,
          look: "vhs",
          playback_rate: 1.5,
          loop: true,
          volume: 0,
          x: 72,
          y: 46,
          width: 36,
        },
        {
          type: "callout",
          kicker: "Window",
          text: "VHS inset",
          detail: "The plate is film. This window is tape.",
          placement: "center_left",
          animation: { type: "fade_up" },
        },
      ],
    },
    {
      id: "reverse",
      start_sec: editStart,
      end_sec: editStart + EDIT,
      source: "video",
      src: SAMPLE,
      trim_start_sec: 0.3,
      trim_end_sec: 2.2,
      reverse: true,
      volume: 0,
      fit: "cover",
      look: "noir",
      transition_in: { type: "whip_pan", duration_sec: 0.4 },
      layers: [
        {
          type: "callout",
          kicker: "Edit",
          text: "Reverse",
          detail: "The same trim, played backwards.",
          placement: "center_left",
          animation: { type: "fade_up" },
        },
      ],
    },
    {
      id: "ramp",
      start_sec: editStart + EDIT,
      end_sec: editStart + EDIT * 2,
      source: "video",
      src: SAMPLE,
      trim_start_sec: 0.2,
      playback_rate: 0.5,
      playback_rate_end: 2,
      volume: 0,
      fit: "cover",
      look: "teal",
      transition_in: { type: "flash_cut", duration_sec: 0.35 },
      layers: [
        {
          type: "callout",
          kicker: "Edit",
          text: "Speed ramp",
          detail: "Half speed, then up to double.",
          placement: "center_left",
          animation: { type: "fade_up" },
        },
      ],
    },
    {
      id: "freeze",
      start_sec: editStart + EDIT * 2,
      end_sec: editStart + EDIT * 3,
      source: "video",
      src: SAMPLE,
      trim_start_sec: 1.1,
      freeze: true,
      volume: 0,
      fit: "cover",
      look: "ink",
      transition_in: { type: "hard_cut" },
      layers: [
        {
          type: "callout",
          kicker: "Edit",
          text: "Freeze",
          detail: "One frame, held for the shot.",
          placement: "center_left",
          animation: { type: "fade_up" },
        },
      ],
    },
    {
      id: "reframe",
      start_sec: editStart + EDIT * 3,
      end_sec: editStart + EDIT * 4,
      source: "video",
      src: SAMPLE,
      trim_start_sec: 0.4,
      focus_x: 8,
      focus_y: 50,
      audio_fade_in_sec: 0.4,
      audio_fade_out_sec: 0.4,
      volume: 0,
      fit: "cover",
      look: "cinema",
      motion: { type: "slow_zoom_in", intensity: 0.4 },
      transition_in: { type: "circle_pulse", duration_sec: 0.45 },
      layers: [
        {
          type: "callout",
          kicker: "Edit",
          text: "Reframe",
          detail: "The crop sits on the left of the frame.",
          placement: "center_left",
          animation: { type: "fade_up" },
        },
      ],
    },
  ],
};

export const VideoEditReel = ({ editPlan }: VideoCompositionProps) => {
  return <VideoComposition editPlan={editPlan} />;
};
