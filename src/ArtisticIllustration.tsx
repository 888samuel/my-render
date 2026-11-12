import { VideoComposition, type VideoCompositionProps } from "./Composition";
import type { MotionType, TransitionType, VideoLook } from "./types/common";
import type { Clip, EditPlan } from "./types/edit-plan";

const SAMPLE = "assets/videos/sample-bars.mp4";

/** Ten shots, five seconds each. */
const SHOT = 5;
const DURATION = 50;

type Beat = {
  id: string;
  look: VideoLook;
  src: string;
  title: string;
  detail: string;
  entrance: TransitionType;
  motion: MotionType;
};

const beats: Beat[] = [
  {
    id: "cinema",
    look: "cinema",
    src: "assets/images/batch2_img30_habit11_sunrise_sky.png",
    title: "Cinema",
    detail: "Letterbox, cooler contrast, light grain.",
    entrance: "fade",
    motion: "slow_zoom_in",
  },
  {
    id: "film",
    look: "film",
    src: "assets/images/batch2_img27_habit10_forest.png",
    title: "Film",
    detail: "A warm print with heavier grain.",
    entrance: "crossfade",
    motion: "ken_burns",
  },
  {
    id: "noir",
    look: "noir",
    src: "assets/images/batch1_img03_hook_window.png",
    title: "Noir",
    detail: "Black and white, with the edges crushed.",
    entrance: "whip_pan",
    motion: "sway",
  },
  {
    id: "golden",
    look: "golden",
    src: "assets/images/batch4_img67_habit30_balcony.png",
    title: "Golden",
    detail: "Amber light across the frame.",
    entrance: "flash_cut",
    motion: "drift",
  },
  {
    id: "teal",
    look: "teal",
    src: "assets/images/batch3_img48_habit20_lake.png",
    title: "Teal",
    detail: "Warm highlights, teal in the shadows.",
    entrance: "circle_pulse",
    motion: "slow_zoom_out",
  },
  {
    id: "fade",
    look: "fade",
    src: "assets/images/batch1_img13_habit3_journal.png",
    title: "Fade",
    detail: "Lifted blacks, like a washed print.",
    entrance: "crossfade",
    motion: "pan_left",
  },
  {
    id: "vhs",
    look: "vhs",
    src: "assets/images/batch1_img10_habit1_laptop.png",
    title: "VHS",
    detail: "Scan lines, a tracking bar, a small wobble.",
    entrance: "glitch_cut",
    motion: "drift",
  },
  {
    id: "dream",
    look: "dream",
    src: "assets/images/batch2_img38_habit15_mind_moon.png",
    title: "Dream",
    detail: "A soft bright center.",
    entrance: "whip_pan",
    motion: "orbit",
  },
  {
    id: "ink",
    look: "ink",
    src: "assets/images/batch1_img05_thesis_blocks.png",
    title: "Ink",
    detail: "High contrast, almost a poster.",
    entrance: "flash_cut",
    motion: "focus_pull",
  },
];

const plate = (beat: Beat, index: number): Clip => ({
  id: beat.id,
  start_sec: index * SHOT,
  end_sec: (index + 1) * SHOT,
  src: beat.src,
  fit: "cover",
  look: beat.look,
  motion: { type: beat.motion, intensity: 0.55 },
  transition_in: { type: beat.entrance, duration_sec: 0.55 },
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

/** Fifty seconds: nine grades on stills, then a film plate with a tape window. */
export const artisticPlan: EditPlan = {
  version: "1.0",
  video: {
    id: "artistic_illustration",
    width: 1920,
    height: 1080,
    fps: 30,
    duration_sec: DURATION,
  },
  clips: [
    ...beats.map(plate),
    {
      id: "window",
      start_sec: windowStart,
      end_sec: DURATION,
      src: "assets/images/batch1_img07_thesis_studio.png",
      fit: "cover",
      look: "film",
      motion: { type: "slow_zoom_in", intensity: 0.4 },
      transition_in: { type: "circle_pulse", duration_sec: 0.6 },
      layers: [
        {
          type: "video",
          src: SAMPLE,
          look: "vhs",
          playback_rate: 1.25,
          loop: true,
          volume: 0,
          x: 72,
          y: 44,
          width: 34,
        },
        {
          type: "callout",
          kicker: "Together",
          text: "Film plate, tape window",
          detail: "The shot is film. This inset is VHS.",
          placement: "center_left",
          animation: { type: "fade_up" },
        },
      ],
    },
  ],
};

export const ArtisticIllustration = ({ editPlan }: VideoCompositionProps) => {
  return <VideoComposition editPlan={editPlan} />;
};
