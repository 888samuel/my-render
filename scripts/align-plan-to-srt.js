/**
 * Align an edit plan to an SRT by moving existing times.
 *
 *   node scripts/align-plan-to-srt.js src/data/edit_plan.json video.srt
 *   node scripts/align-plan-to-srt.js video.srt
 *
 * Only start, end, and video duration change. Text, pictures, titles,
 * transitions, and the number of clips and layers stay as they are.
 */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const DEFAULT_PLAN = path.join(root, "src/data/edit_plan.json");
const CUE_MATCH = 0.6;
const TEXT_COVERAGE = 0.5;
const TEXT_AVERAGE = 0.7;
const GAP = 0.35;

function createTiming(fps) {
  const frameOf = (sec) => Math.round(sec * fps);
  const secOf = (frame) => Math.round((frame / fps) * 1000) / 1000;
  return { fps, frameOf, secOf };
}

function cleanText(text) {
  return String(text || "")
    .replace(/^\uFEFF/, "")
    .replace(/^["']+|["']+$/g, "")
    .replace(/\*+/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function normalize(text) {
  return cleanText(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/ +/g, " ")
    .trim();
}

function dice(a, b) {
  if (a === b) return a ? 1 : 0;
  const left = a.split(" ").filter(Boolean);
  const right = b.split(" ").filter(Boolean);
  if (!left.length || !right.length) return 0;
  const counts = new Map();
  for (const word of right) counts.set(word, (counts.get(word) || 0) + 1);
  let shared = 0;
  for (const word of left) {
    const have = counts.get(word) || 0;
    if (have > 0) {
      shared += 1;
      counts.set(word, have - 1);
    }
  }
  return (2 * shared) / (left.length + right.length);
}

function usage() {
  return `Usage: node scripts/align-plan-to-srt.js <plan.json> <file.srt> [--out plan.json]
       node scripts/align-plan-to-srt.js <file.srt> [--out plan.json]

Moves existing times onto the SRT. Text, pictures, titles, and transitions
stay as they are. --out defaults to the plan path.`;
}

function parseArgs(argv) {
  const positional = [];
  const opts = {
    planPath: DEFAULT_PLAN,
    srtPath: "",
    outPath: "",
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out") {
      opts.outPath = argv[i + 1];
      i += 1;
      if (!opts.outPath) throw new Error("Missing path after --out\n" + usage());
    } else if (arg === "--help" || arg === "-h") {
      opts.help = true;
    } else if (arg.startsWith("--")) {
      throw new Error("Unknown option " + arg + "\n" + usage());
    } else {
      positional.push(arg);
    }
  }
  if (opts.help) return opts;
  if (positional.length === 1 && /\.srt$/i.test(positional[0])) {
    opts.srtPath = positional[0];
  } else if (positional.length === 2) {
    opts.planPath = positional[0];
    opts.srtPath = positional[1];
  } else {
    throw new Error(usage());
  }
  opts.planPath = path.resolve(opts.planPath);
  opts.srtPath = path.resolve(opts.srtPath);
  opts.outPath = path.resolve(opts.outPath || opts.planPath);
  return opts;
}

function parseSrt(raw, fps = 30) {
  const timing = createTiming(fps);
  const cues = String(raw)
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n\r?\n/)
    .map((block) => {
      const lines = block.split(/\r?\n/).filter((line) => line.length);
      const timeLine = lines.find((line) => line.includes("-->"));
      if (!timeLine) return null;
      const [startRaw, endRaw] = timeLine.split("-->");
      const startFrame = timing.frameOf(parseTs(startRaw));
      const endFrame = Math.max(startFrame + 1, timing.frameOf(parseTs(endRaw)));
      return {
        startFrame,
        endFrame,
        start: timing.secOf(startFrame),
        end: timing.secOf(endFrame),
        text: cleanText(lines.slice(lines.indexOf(timeLine) + 1).join("\n")),
      };
    })
    .filter(Boolean);
  cues.forEach((cue, index) => {
    cue.index = index + 1;
  });
  return cues;
}

function parseTs(value) {
  const match = String(value)
    .trim()
    .match(/(\d+):(\d+):(\d+)[,.](\d+)/);
  if (!match) throw new Error("Bad SRT time: " + value);
  const ms = match[4].padEnd(3, "0").slice(0, 3);
  return +match[1] * 3600 + +match[2] * 60 + +match[3] + +ms / 1000;
}

function hasPicture(clip) {
  if (clip.asset_id || (Array.isArray(clip.media) && clip.media.length)) return true;
  return (clip.layers || []).some((layer) =>
    layer.type === "image" ||
    layer.type === "video" ||
    layer.type === "image_sequence" ||
    layer.type === "media",
  );
}

function isVisualizerClip(clip) {
  const id = String(clip.id || "");
  if (/visuali[sz]er|^viz$/i.test(id) && !hasPicture(clip)) return true;
  const layers = clip.layers || [];
  return (
    layers.length > 0 &&
    layers.every((layer) => layer.type === "graphic" && layer.graphic === "audio_visualizer")
  );
}

function isSubtitleClip(clip) {
  if (hasPicture(clip) || isVisualizerClip(clip)) return false;
  const id = String(clip.id || "");
  if (/subtitle/i.test(id)) return true;
  const layers = clip.layers || [];
  return (
    layers.length > 0 &&
    layers.every((layer) => layer.type === "text" && (!layer.variant || layer.variant === "subtitle"))
  );
}

function isCaption(layer, clip) {
  if (!layer || layer.type !== "text") return false;
  if (layer.variant === "subtitle") return true;
  return Boolean(clip && isSubtitleClip(clip));
}

function snap(time, timing) {
  return timing.secOf(timing.frameOf(time));
}

function alignTexts(oldCues, newCues) {
  const left = oldCues.map((cue) => normalize(cue.text));
  const right = newCues.map((cue) => normalize(cue.text));
  const oldCount = left.length;
  const newCount = right.length;
  if (!oldCount || !newCount) return { ok: false, pairs: [], score: 0 };
  if (oldCount === newCount && left.every((text, index) => text === right[index])) {
    return { ok: true, pairs: left.map((_, index) => [index, index]), score: 1 };
  }
  if (oldCount * newCount > 4_000_000) return { ok: false, pairs: [], score: 0 };

  const cols = newCount + 1;
  const at = (row, col) => row * cols + col;
  const scores = new Float64Array((oldCount + 1) * cols);
  const back = new Uint8Array((oldCount + 1) * cols);
  for (let row = 1; row <= oldCount; row += 1) {
    scores[at(row, 0)] = -GAP * row;
    back[at(row, 0)] = 2;
  }
  for (let col = 1; col <= newCount; col += 1) {
    scores[at(0, col)] = -GAP * col;
    back[at(0, col)] = 3;
  }
  for (let row = 1; row <= oldCount; row += 1) {
    for (let col = 1; col <= newCount; col += 1) {
      let best = scores[at(row - 1, col)] - GAP;
      let how = 2;
      const skipNew = scores[at(row, col - 1)] - GAP;
      if (skipNew > best) {
        best = skipNew;
        how = 3;
      }
      const similarity = dice(left[row - 1], right[col - 1]);
      if (similarity >= CUE_MATCH) {
        const matched = scores[at(row - 1, col - 1)] + similarity;
        if (matched > best) {
          best = matched;
          how = 1;
        }
      }
      scores[at(row, col)] = best;
      back[at(row, col)] = how;
    }
  }

  const pairs = [];
  let row = oldCount;
  let col = newCount;
  while (row > 0 || col > 0) {
    const how = back[at(row, col)];
    if (how === 1) {
      pairs.push([row - 1, col - 1]);
      row -= 1;
      col -= 1;
    } else if (how === 2) row -= 1;
    else if (how === 3) col -= 1;
    else break;
  }
  pairs.reverse();
  const average = pairs.length
    ? pairs.reduce((sum, pair) => sum + dice(left[pair[0]], right[pair[1]]), 0) / pairs.length
    : 0;
  const ok = pairs.length >= TEXT_COVERAGE * Math.min(oldCount, newCount) && average >= TEXT_AVERAGE;
  return { ok, pairs: ok ? pairs : [], score: Math.round(average * 1000) / 1000 };
}

function warpFrom(points) {
  const unique = [];
  for (const point of [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])) {
    if (unique.length && unique[unique.length - 1][0] === point[0]) unique[unique.length - 1] = point;
    else unique.push(point);
  }
  return (time) => {
    if (time <= unique[0][0]) return unique[0][1];
    for (let index = 1; index < unique.length; index += 1) {
      const [start, from] = unique[index - 1];
      const [end, to] = unique[index];
      if (time <= end) {
        if (end === start) return to;
        return from + ((time - start) / (end - start)) * (to - from);
      }
    }
    return unique[unique.length - 1][1];
  };
}

function shiftTimes(node, warp, timing) {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) shiftTimes(item, warp, timing);
    return;
  }
  for (const key of Object.keys(node)) {
    if (key === "transition_in" || key === "transition_out") continue;
    const value = node[key];
    if ((key === "start_sec" || key === "end_sec") && typeof value === "number") {
      node[key] = snap(warp(value), timing);
    } else if (value && typeof value === "object") {
      shiftTimes(value, warp, timing);
    }
  }
}

function captionLayers(plan) {
  const layers = [];
  for (const clip of plan.clips) {
    for (const layer of clip.layers || []) {
      if (isCaption(layer, clip)) layers.push(layer);
    }
  }
  layers.sort(
    (a, b) => (a.start_sec || 0) - (b.start_sec || 0) || (a.end_sec || 0) - (b.end_sec || 0),
  );
  return layers;
}

function alignPlan(source, srtText) {
  if (!source || !Array.isArray(source.clips)) throw new Error("Edit plan has no clips.");
  const plan = JSON.parse(JSON.stringify(source));
  const fps = plan.video && Number(plan.video.fps);
  if (!Number.isFinite(fps) || fps <= 0) throw new Error("Edit plan has no frame rate.");
  const timing = createTiming(fps);
  const newCues = parseSrt(srtText, fps);
  if (!newCues.length) throw new Error("No SRT cues.");

  const layers = captionLayers(plan);
  const oldCues = layers.map((layer) => ({
    start: snap(layer.start_sec || 0, timing),
    end: snap(layer.end_sec ?? layer.start_sec ?? 0, timing),
    text: cleanText(layer.text),
  }));
  const originalDuration = plan.video && plan.video.duration_sec;
  const oldDuration = Math.max(
    typeof originalDuration === "number" ? originalDuration : 0,
    ...plan.clips.map((clip) => clip.end_sec || 0),
    0,
  );
  if (!(oldDuration > 0)) throw new Error("Edit plan has no duration.");
  const newDuration = newCues[newCues.length - 1].end;

  let mode = layers.length ? "scale" : "time";
  let pairs = [];
  let textScore = 0;
  if (layers.length) {
    const aligned = alignTexts(oldCues, newCues);
    textScore = aligned.score;
    if (aligned.ok) {
      mode = "text";
      pairs = aligned.pairs;
    } else if (oldCues.length === newCues.length) {
      mode = "index";
      pairs = oldCues.map((_, index) => [index, index]);
    }
  }

  const points = [
    [0, 0],
    [oldDuration, newDuration],
  ];
  for (const [oldIndex, newIndex] of pairs) {
    points.push([oldCues[oldIndex].start, newCues[newIndex].start]);
    points.push([oldCues[oldIndex].end, newCues[newIndex].end]);
  }
  const warp = warpFrom(points);
  shiftTimes(plan, warp, timing);
  if (plan.video && typeof originalDuration === "number") {
    plan.video.duration_sec = snap(warp(originalDuration), timing);
  }
  for (const [oldIndex, newIndex] of pairs) {
    layers[oldIndex].start_sec = newCues[newIndex].start;
    layers[oldIndex].end_sec = newCues[newIndex].end;
  }

  for (let index = 1; index < pairs.length; index += 1) {
    const previous = newCues[pairs[index - 1][1]];
    const next = newCues[pairs[index][1]];
    if (next.startFrame < previous.endFrame) {
      throw new Error("SRT cues overlap at #" + next.index);
    }
  }
  for (const clip of plan.clips) {
    if (
      typeof clip.start_sec === "number" &&
      typeof clip.end_sec === "number" &&
      clip.end_sec <= clip.start_sec
    ) {
      throw new Error(`Clip "${clip.id}" collapsed while aligning.`);
    }
  }

  const warnings = [];
  if (mode === "index") {
    warnings.push("Cue counts match but the words differ, so times follow that cue order. Text is unchanged.");
  } else if (mode === "scale") {
    warnings.push("Subtitle text did not match the SRT, so the timeline is scaled to the SRT. Nothing was added or removed.");
  } else if (mode === "time") {
    warnings.push("The plan has no subtitles, so the timeline is scaled to the SRT.");
  }

  return {
    plan,
    report: {
      mode,
      textScore,
      cues: newCues.length,
      captions: layers.length,
      duration: plan.video && plan.video.duration_sec,
      warnings,
    },
  };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(usage());
    return;
  }
  const plan = JSON.parse(fs.readFileSync(opts.planPath, "utf8"));
  const srtRaw = fs.readFileSync(opts.srtPath, "utf8");
  const { plan: aligned, report } = alignPlan(plan, srtRaw);
  fs.writeFileSync(opts.outPath, JSON.stringify(aligned, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

module.exports = {
  alignPlan,
  parseSrt,
  parseArgs,
  createTiming,
};
