import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const inputPath = resolve(
  process.argv[2] ?? "C:/Users/hp/Downloads/edit_plan.json",
);
const outputPath = resolve(
  process.argv[3] ?? "src/data/edit-plan.json",
);

const TITLE_HOOKS = new Set([
  "core_premise_title_drop",
  "chapter_1_title",
  "roadmap_reveal",
  "reframe_misconception",
  "climactic_line",
]);

const TEXT_ANIMATION_MAP = {
  none: "none",
  fade_in: "fade_in",
  fade_up: "fade_up",
  slide_up: "slide_up",
  scale_up: "scale_up",
  kinetic_pop: "scale_in",
  typewriter: "word_reveal",
  glow_reveal: "fade_in",
  pulse_reveal: "scale_in",
  strike_through_highlight: "fade_in",
  number_counter_pop: "scale_in",
  ember_burst_reveal: "scale_in",
  digital_ticker_reverse: "fade_in",
  stamp_down: "scale_in",
  split_divider_anim: "fade_in",
  royal_slide_in: "slide_left",
  shadow_fade: "fade_in",
  ominous_glow: "fade_in",
  red_strike_in: "slide_left",
  ring_clamp_anim: "scale_in",
  slow_creep_reveal: "fade_in",
  quote_card_drop: "fade_in",
  disintegrate_text: "fade_in",
  silver_coin_counter_anim: "scale_in",
  red_stamp_overlay: "scale_in",
  text_shatter_impact: "scale_in",
  slow_haunting_fade: "fade_in",
};

const round = (value) => Math.round(value * 1000) / 1000;

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, "..");
const imagesDir = resolve(projectRoot, "public/assets/images");
const audioDir = resolve(projectRoot, "public/assets/audio");

const imageFiles = readdirSync(imagesDir);
const audioFiles = readdirSync(audioDir);

const resolveImageSrc = (assetId) => {
  const match = imageFiles.find(
    (file) =>
      file === `${assetId}.png` ||
      (file.startsWith(`${assetId}_`) && file.toLowerCase().endsWith(".png")),
  );

  if (!match) {
    return `assets/images/${assetId}.png`;
  }

  return `assets/images/${match}`;
};

const resolveAudioSrc = () => {
  if (audioFiles.includes("output.mp3")) {
    return "assets/audio/output.mp3";
  }
  if (audioFiles.includes("voiceover.wav")) {
    return "assets/audio/voiceover.wav";
  }
  return "assets/audio/output.mp3";
};

const beats = JSON.parse(readFileSync(inputPath, "utf8"));
if (!Array.isArray(beats)) {
  throw new Error("Planner JSON must be an array of beats.");
}

const durationSec = round(Math.max(...beats.map((beat) => beat.end_sec)));

const mapTextAnimation = (animation) => {
  return TEXT_ANIMATION_MAP[animation] ?? "fade_in";
};

const highlightInText = (text, words) => {
  if (!text || !Array.isArray(words)) {
    return undefined;
  }

  return words.find((word) => word && text.includes(word));
};

const parseQuote = (text) => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const attributionLine = lines.find((line) => line.startsWith("-"));
  const body = lines
    .filter((line) => line !== attributionLine)
    .join("\n")
    .replace(/^[“"']+|[”"']+$/g, "")
    .trim();

  return {
    text: body || text,
    attribution: attributionLine
      ? attributionLine.replace(/^-+\s*/, "").trim()
      : undefined,
  };
};

const isQuoteBeat = (beat, text) => {
  return (
    beat.on_screen_text?.animation === "quote_card_drop" ||
    text.includes("“") ||
    text.includes('"')
  );
};

const isTitleBeat = (beat, text) => {
  const hook = beat.retention?.hook ?? "";
  if (TITLE_HOOKS.has(hook)) {
    return true;
  }

  const position = beat.on_screen_text?.position;
  return (
    position === "center" &&
    (text.includes("\n") || text.includes(" | ") || /THE |PART /.test(text))
  );
};

const clips = beats.map((beat) => {
  const layers = [
    {
      id: `${beat.id}-image`,
      type: "image",
      asset_id: beat.asset_id,
      src: resolveImageSrc(beat.asset_id),
      fit: "cover",
      overlay: "dark_gradient",
      motion: {
        type: beat.camera_motion?.type ?? "static",
        intensity: beat.camera_motion?.intensity ?? 0.25,
      },
    },
  ];

  const screen = beat.on_screen_text ?? {};
  const text = typeof screen.text === "string" ? screen.text.trim() : "";
  const position = screen.position ?? "center";

  if (text && position !== "none") {
    const animationType = mapTextAnimation(screen.animation);
    const textStart = round(beat.start_sec + 0.2);
    const requestedEnd = round(textStart + (screen.duration_sec || 2.5));
    const textEnd = round(Math.min(beat.end_sec, requestedEnd));
    const highlight = highlightInText(text, beat.emphasis?.words);
    const base = {
      id: `${beat.id}-text`,
      start_sec: textStart,
      end_sec: Math.max(textStart + 0.2, textEnd),
      placement: position,
      animation: { type: animationType },
    };

    if (isQuoteBeat(beat, text)) {
      const quote = parseQuote(text);
      layers.push({
        ...base,
        type: "quote",
        text: quote.text,
        ...(quote.attribution ? { attribution: quote.attribution } : {}),
      });
    } else if (isTitleBeat(beat, text)) {
      layers.push({
        ...base,
        type: "title",
        text,
      });
    } else if (beat.emphasis?.enabled && highlight) {
      layers.push({
        ...base,
        type: "highlighted_text",
        text,
        highlight,
      });
    } else {
      layers.push({
        ...base,
        type: "text",
        text,
      });
    }
  }

  const transitionType = beat.transition?.type ?? "hard_cut";
  const transitionDuration = beat.transition?.duration_sec ?? 0;
  const transition = {
    type: transitionType,
    ...(transitionDuration > 0 ? { duration_sec: transitionDuration } : {}),
  };

  const clip = {
    id: beat.id,
    start_sec: round(beat.start_sec),
    end_sec: round(beat.end_sec),
    layers,
  };

  if (transitionType === "fade_to_black") {
    clip.transition_out = transition;
  } else if (transitionType !== "hard_cut" && transitionType !== "none") {
    clip.transition_in = transition;
  }

  return clip;
});

clips.push({
  id: "clip_visualizer",
  start_sec: 0,
  end_sec: durationSec,
  layers: [
    {
      id: "visualizer",
      type: "graphic",
      graphic: "audio_visualizer",
      variant: "bars",
    },
  ],
});

const plan = {
  version: "1.0",
  video: {
    id: "silence-of-god-part-1",
    width: 1920,
    height: 1080,
    fps: 30,
    duration_sec: durationSec,
  },
  audio: {
    src: resolveAudioSrc(),
    start_sec: 0,
  },
  clips,
};

writeFileSync(outputPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");
console.log(`Wrote ${clips.length} clips (${durationSec}s) to ${outputPath}`);
