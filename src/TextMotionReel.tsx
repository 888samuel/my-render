import { AbsoluteFill, Img, Sequence, staticFile } from "remotion";
import { RevealText } from "./components/text/AnimatedText";
import { EthiopicFont } from "./styles/EthiopicFont";
import { theme } from "./styles/theme";
import type { TextAnimationType } from "./types/common";

const FPS = 30;
const TOTAL_FRAMES = 40 * FPS;

type Beat = {
  type: TextAnimationType;
  label: string;
  text: string;
  image: string;
};

const BEATS: Beat[] = [
  {
    type: "voice_words",
    label: "Voice words",
    text: "Small habits shape the life you keep.",
    image: "assets/images/batch1_img01_hook_scrolling.png",
  },
  {
    type: "follow",
    label: "Follow highlight",
    text: "The spoken word takes the accent color.",
    image: "assets/images/batch1_img02_hook_clock.png",
  },
  {
    type: "dim_past",
    label: "Past words dim",
    text: "Earlier words rest while this one speaks.",
    image: "assets/images/batch1_img03_hook_window.png",
  },
  {
    type: "word_box",
    label: "Moving box",
    text: "A box sits behind the current word.",
    image: "assets/images/batch1_img10_habit1_laptop.png",
  },
  {
    type: "wipe",
    label: "Wipe",
    text: "The line uncovers from start to end.",
    image: "assets/images/batch1_img13_habit3_journal.png",
  },
  {
    type: "underline",
    label: "Underline",
    text: "A line draws under the spoken words.",
    image: "assets/images/batch1_img17_habit5_mirror.png",
  },
  {
    type: "ghost",
    label: "Ghost fill",
    text: "The faint line fills in as it is said.",
    image: "assets/images/batch2_img27_habit10_forest.png",
  },
  {
    type: "word_rise",
    label: "Word rise",
    text: "Each word rises when its moment starts.",
    image: "assets/images/batch2_img30_habit11_sunrise_sky.png",
  },
  {
    type: "focus",
    label: "Focus",
    text: "Each word sharpens as the voice arrives.",
    image: "assets/images/batch2_img40_habit16_clean_desk.png",
  },
  {
    type: "lines",
    label: "Line by line",
    text: "One wrapped line\nappears at a time\nthen the next.",
    image: "assets/images/batch3_img48_habit20_lake.png",
  },
  {
    type: "clauses",
    label: "Clauses",
    text: "Start small. Stay with it. Let it grow.",
    image: "assets/images/batch3_img59_habit26_exercise.png",
  },
  {
    type: "punch",
    label: "Word punch",
    text: "The current word leans forward a little.",
    image: "assets/images/batch4_img67_habit30_balcony.png",
  },
  {
    type: "decode",
    label: "Decode",
    text: "Letters lock in as the line is spoken.",
    image: "assets/images/batch4_img77_outro_sunlit_path.png",
  },
  {
    type: "stroke",
    label: "Stroke",
    text: "Each letter draws itself across the cue.",
    image: "assets/images/batch4_img71_habit32_fountain_pen.png",
  },
];

const baseSpan = Math.floor(TOTAL_FRAMES / BEATS.length);
const extraSpans = TOTAL_FRAMES - baseSpan * BEATS.length;

function spanFor(index: number): { from: number; duration: number } {
  let from = 0;
  for (let i = 0; i < index; i += 1) {
    from += baseSpan + (i < extraSpans ? 1 : 0);
  }
  return { from, duration: baseSpan + (index < extraSpans ? 1 : 0) };
}

export const TextMotionReel = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.colors.background }}>
      <EthiopicFont />
      {BEATS.map((beat, index) => {
        const span = spanFor(index);
        return (
          <Sequence
            key={beat.type}
            from={span.from}
            durationInFrames={span.duration}
            name={beat.label}
          >
            <BeatSlide beat={beat} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
const BeatSlide = ({ beat }: { beat: Beat }) => {
  return (
    <AbsoluteFill>
      <Img
        src={staticFile(beat.image)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <AbsoluteFill style={{ backgroundColor: "rgba(6, 7, 10, 0.62)" }} />
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "84px 120px 0",
        }}
      >
        <div
          style={{
            color: theme.colors.accent,
            fontFamily: theme.fonts.body,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          {beat.label}
        </div>
        <div style={{ width: "100%", marginTop: 72 }}>
          <RevealText
            text={beat.text}
            animation={{ type: beat.type }}
            align="center"
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.display,
              fontSize: 68,
              fontWeight: 500,
              lineHeight: 1.28,
              letterSpacing: "-0.02em",
              maxWidth: 1500,
              margin: "0 auto",
              whiteSpace: "pre-line",
              textShadow: "0 3px 22px rgba(0,0,0,0.85)",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
