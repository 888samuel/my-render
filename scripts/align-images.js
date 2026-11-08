/**
 * Place images on src/data/edit_plan.json from an SRT and a cue manifest.
 *
 *   node scripts/align-images.js video.srt images.json
 *   node scripts/align-images.js images.json video.srt
 *
 * Run scripts/align-plan-to-srt.js first. This pass rewrites the picture on
 * each image layer. Subtitles, titles, transitions, and clip times stay.
 * Cue numbers are the numbers written in the SRT, starting at 1.
 */
const fs = require("fs");
const path = require("path");
const { parseSrt } = require("./align-plan-to-srt");

const root = path.resolve(__dirname, "..");
const DEFAULT_PLAN = path.join(root, "src/data/edit_plan.json");
const DEFAULT_IMAGES = path.join(root, "public/assets/images");

const FITS = new Set(["contain", "cover", "centered_crop"]);
const OVERLAYS = new Set(["none", "dark_gradient", "vignette", "spotlight", "warm"]);
const MOTIONS = new Set([
  "none",
  "static",
  "static_hold",
  "slow_zoom_in",
  "slow_zoom_out",
  "zoom_in",
  "zoom_out",
  "pan_left",
  "pan_right",
  "pan_up",
  "pan_down",
  "pan_diagonal",
  "tilt_up",
  "tilt_down",
  "subtle_movement",
  "drift",
  "breathe",
  "float",
  "pop_in",
  "slide_in",
  "ken_burns",
  "focus_pull",
  "orbit",
  "sway",
]);

function usage() {
  return `Usage: node scripts/align-images.js <file.srt> <images.json>
       node scripts/align-images.js <images.json> <file.srt>

Reads src/data/edit_plan.json and writes that same file.
Each manifest row names a picture and the inclusive SRT cues it covers.
Optional fit, overlay, and motion are copied onto the image layer.
--out writes a copy instead. --images defaults to public/assets/images.`;
}

function parseArgs(argv) {
  const positional = [];
  const opts = {
    planPath: DEFAULT_PLAN,
    srtPath: "",
    manifestPath: "",
    outPath: "",
    imagesDir: DEFAULT_IMAGES,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--out" || arg === "--images" || arg === "--plan") {
      const value = argv[i + 1];
      i += 1;
      if (!value) throw new Error("Missing path after " + arg + "\n" + usage());
      if (arg === "--out") opts.outPath = value;
      else if (arg === "--plan") opts.planPath = value;
      else opts.imagesDir = value;
    } else if (arg === "--help" || arg === "-h") {
      opts.help = true;
    } else if (arg.startsWith("--")) {
      throw new Error("Unknown option " + arg + "\n" + usage());
    } else {
      positional.push(arg);
    }
  }
  if (opts.help) return opts;
  if (positional.length !== 2) throw new Error(usage());
  for (const file of positional) {
    if (/\.srt$/i.test(file)) {
      if (opts.srtPath) throw new Error("Pass one SRT file.\n" + usage());
      opts.srtPath = file;
    } else if (/\.json$/i.test(file)) {
      if (opts.manifestPath) throw new Error("Pass one image manifest.\n" + usage());
      opts.manifestPath = file;
    } else {
      throw new Error("Expected an SRT file and an image manifest.\n" + usage());
    }
  }
  if (!opts.srtPath || !opts.manifestPath) {
    throw new Error("Expected an SRT file and an image manifest.\n" + usage());
  }
  opts.planPath = path.resolve(opts.planPath);
  opts.srtPath = path.resolve(opts.srtPath);
  opts.manifestPath = path.resolve(opts.manifestPath);
  opts.imagesDir = path.resolve(opts.imagesDir);
  opts.outPath = path.resolve(opts.outPath || opts.planPath);
  return opts;
}

function imageFileName(file) {
  const name = String(file || "").trim();
  if (!name || name !== path.basename(name) || name === "." || name === "..") {
    throw new Error("Image file must be a file name, not a path: " + file);
  }
  return name;
}

function cueSpans(raw, cues) {
  const blocks = String(raw)
    .replace(/^\uFEFF/, "")
    .trim()
    .split(/\r?\n\r?\n/);
  const numbers = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).filter((line) => line.length);
    if (!lines.some((line) => line.includes("-->"))) continue;
    const head = lines[0].trim();
    numbers.push(/^\d+$/.test(head) ? Number(head) : null);
  }
  if (numbers.length !== cues.length || numbers.some((value) => value == null)) return cues;
  const seen = new Set();
  numbers.forEach((value, index) => {
    if (seen.has(value)) throw new Error("SRT cue " + value + " is repeated.");
    seen.add(value);
    cues[index].index = value;
  });
  return cues;
}

function compactCues(nums) {
  if (!nums.length) return "";
  const parts = [];
  let start = nums[0];
  let prev = nums[0];
  for (let i = 1; i <= nums.length; i += 1) {
    const value = nums[i];
    if (value === prev + 1) {
      prev = value;
      continue;
    }
    parts.push(start === prev ? String(start) : start + "-" + prev);
    start = value;
    prev = value;
  }
  return parts.join(", ");
}

function validateManifest(manifest, cueIndexes) {
  if (Array.isArray(manifest)) {
    throw new Error('Image manifest needs an images array. Wrap the rows as {"version":"1.0","images":[...]}.');
  }
  if (!manifest || !Array.isArray(manifest.images)) {
    throw new Error("Image manifest needs an images array.");
  }
  const claimed = new Map();
  const entries = [];
  for (const image of manifest.images) {
    const file = imageFileName(image && image.file);
    const cues = image && image.cues;
    const cueStart = cues && cues.start;
    const cueEnd = cues && cues.end;
    if (!Number.isInteger(cueStart) || !Number.isInteger(cueEnd)) {
      throw new Error(file + " needs integer cues.start and cues.end.");
    }
    if (cueStart < 1 || cueEnd < cueStart) {
      throw new Error(file + " has an invalid cue range " + cueStart + "-" + cueEnd + ".");
    }
    for (let cue = cueStart; cue <= cueEnd; cue += 1) {
      if (!cueIndexes.has(cue)) {
        throw new Error(file + " claims cue " + cue + ", and that cue is not in the SRT.");
      }
      const owner = claimed.get(cue);
      if (owner) throw new Error(owner + " and " + file + " both claim cue " + cue + ".");
      claimed.set(cue, file);
    }
    const entry = { file, cueStart, cueEnd, clips: 0 };
    if (image.fit != null) {
      if (!FITS.has(image.fit)) throw new Error(file + ' has unknown fit "' + image.fit + '".');
      entry.fit = image.fit;
    }
    if (image.overlay != null) {
      if (!OVERLAYS.has(image.overlay)) throw new Error(file + ' has unknown overlay "' + image.overlay + '".');
      entry.overlay = image.overlay;
    }
    if (image.motion != null) {
      const motion = image.motion;
      if (!motion || !MOTIONS.has(motion.type)) {
        throw new Error(file + ' has unknown motion "' + (motion && motion.type) + '".');
      }
      entry.motion = { type: motion.type };
      if (motion.intensity != null) {
        if (typeof motion.intensity !== "number" || !Number.isFinite(motion.intensity)) {
          throw new Error(file + " has a bad motion intensity.");
        }
        entry.motion.intensity = motion.intensity;
      }
    }
    entries.push(entry);
  }
  return { entries, claimed };
}

function checkFiles(entries, imagesDir) {
  const missing = [];
  const seen = new Set();
  for (const entry of entries) {
    if (seen.has(entry.file)) continue;
    seen.add(entry.file);
    const full = path.join(imagesDir, entry.file);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) missing.push(entry.file);
  }
  if (missing.length) {
    throw new Error("Missing image file:\n" + missing.join("\n"));
  }
}

function imageForClip(cues, byCue, clip) {
  const mid = (clip.start_sec + clip.end_sec) / 2;
  const inside = cues.find((cue) => mid >= cue.start && mid < cue.end);
  if (inside) return byCue.get(inside.index) || null;
  const next = cues.find((cue) => cue.start > mid);
  if (next && byCue.has(next.index)) return byCue.get(next.index);
  for (let i = cues.length - 1; i >= 0; i -= 1) {
    if (cues[i].end <= mid && byCue.has(cues[i].index)) return byCue.get(cues[i].index);
  }
  return null;
}

function applyImage(layer, entry) {
  layer.src = "assets/images/" + entry.file;
  layer.asset_id = entry.file.replace(/\.[^.]+$/, "");
  if (entry.fit) layer.fit = entry.fit;
  if (entry.overlay) layer.overlay = entry.overlay;
  if (entry.motion) layer.motion = { type: entry.motion.type };
  if (entry.motion && entry.motion.intensity != null) layer.motion.intensity = entry.motion.intensity;
}

function alignImages(plan, srtRaw, manifest, options = {}) {
  const fps = plan && plan.video && plan.video.fps ? plan.video.fps : 30;
  const cues = cueSpans(srtRaw, parseSrt(srtRaw, fps));
  if (!cues.length) throw new Error("The SRT has no cues.");
  const cueIndexes = new Set(cues.map((cue) => cue.index));
  const { entries, claimed } = validateManifest(manifest, cueIndexes);
  checkFiles(entries, options.imagesDir || DEFAULT_IMAGES);
  const byCue = new Map();
  for (const entry of entries) {
    for (let cue = entry.cueStart; cue <= entry.cueEnd; cue += 1) byCue.set(cue, entry);
  }

  const next = JSON.parse(JSON.stringify(plan));
  let clipsUpdated = 0;
  let clipsKept = 0;
  for (const clip of next.clips || []) {
    const images = (clip.layers || []).filter((layer) => layer && layer.type === "image");
    if (!images.length) continue;
    if (typeof clip.start_sec !== "number" || typeof clip.end_sec !== "number") {
      clipsKept += 1;
      continue;
    }
    const entry = imageForClip(cues, byCue, clip);
    if (!entry) {
      clipsKept += 1;
      continue;
    }
    for (const layer of images) applyImage(layer, entry);
    entry.clips += 1;
    clipsUpdated += 1;
  }

  const uncoveredCues = cues
    .map((cue) => cue.index)
    .filter((cue) => !claimed.has(cue))
    .sort((a, b) => a - b);

  return {
    plan: next,
    report: {
      images: entries.length,
      cues: cues.length,
      clipsUpdated,
      clipsKept,
      uncovered: compactCues(uncoveredCues),
      assignments: entries.map((entry) => ({
        file: entry.file,
        cues: entry.cueStart === entry.cueEnd ? String(entry.cueStart) : entry.cueStart + "-" + entry.cueEnd,
        clips: entry.clips,
      })),
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
  const manifest = JSON.parse(fs.readFileSync(opts.manifestPath, "utf8"));
  const { plan: aligned, report } = alignImages(plan, srtRaw, manifest, {
    imagesDir: opts.imagesDir,
  });
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
  alignImages,
  parseArgs,
  usage,
};
