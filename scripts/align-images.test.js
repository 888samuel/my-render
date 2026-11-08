const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { alignImages, parseArgs } = require("./align-images");

function stamp(sec) {
  const ms = Math.round(sec * 1000);
  const pad = (value, width = 2) => String(value).padStart(width, "0");
  return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)},${pad(ms % 1000, 3)}`;
}

function toSrt(cues) {
  return cues
    .map((cue, index) => `${cue.index || index + 1}\n${stamp(cue.start)} --> ${stamp(cue.end)}\n${cue.text}\n`)
    .join("\n");
}

function imageLayer(name) {
  return {
    type: "image",
    asset_id: name,
    src: `assets/images/${name}.png`,
    fit: "cover",
    overlay: "dark_gradient",
    motion: { type: "slow_zoom_out", intensity: 0.3 },
    x: 0,
  };
}

function clip(id, start, end, name, text) {
  return {
    id,
    start_sec: start,
    end_sec: end,
    transition_in: { type: "cross_dissolve", duration_sec: 0.4 },
    layers: [
      imageLayer(name),
      {
        type: "text",
        text,
        variant: "subtitle",
        start_sec: start,
        end_sec: end,
        placement: "bottom_center",
      },
      {
        type: "chapter_card",
        title: "Keep this title",
        start_sec: start,
        end_sec: end,
      },
    ],
  };
}

function plan() {
  return {
    version: "1.0",
    video: { id: "demo", width: 1920, height: 1080, fps: 30, duration_sec: 8 },
    audio: { src: "assets/audio/voice.mp3", start_sec: 0 },
    clips: [
      clip("s1", 0, 2, "old_a", "one"),
      clip("s2", 2, 4, "old_a", "two"),
      clip("s3", 4.6, 7, "old_b", "three"),
      clip("s4", 7, 8, "old_c", "four"),
    ],
  };
}

const spoken = [
  { start: 0, end: 2, text: "one" },
  { start: 2, end: 4, text: "two" },
  { start: 4, end: 7, text: "three" },
  { start: 7, end: 8, text: "four" },
];

function withImages(files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "align-images-"));
  for (const file of files) fs.writeFileSync(path.join(dir, file), "");
  return dir;
}

function run(manifest, files, source = plan(), cues = spoken) {
  const imagesDir = withImages(files);
  return alignImages(source, toSrt(cues), manifest, { imagesDir });
}

function layer(aligned, id, type) {
  return aligned.clips.find((item) => item.id === id).layers.find((item) => item.type === type);
}

test("puts each picture on the clips inside its cue range", () => {
  const source = plan();
  const before = JSON.parse(JSON.stringify(source));
  const { plan: aligned, report } = run(
    {
      version: "1.0",
      images: [
        {
          file: "hook.png",
          cues: { start: 1, end: 2 },
          fit: "contain",
          overlay: "vignette",
          motion: { type: "ken_burns", intensity: 0.28 },
        },
        { file: "habit.png", cues: { start: 3, end: 3 } },
      ],
    },
    ["hook.png", "habit.png"],
    source,
  );

  assert.deepEqual(source, before);
  assert.equal(layer(aligned, "s1", "image").src, "assets/images/hook.png");
  assert.equal(layer(aligned, "s1", "image").asset_id, "hook");
  assert.equal(layer(aligned, "s1", "image").fit, "contain");
  assert.equal(layer(aligned, "s1", "image").overlay, "vignette");
  assert.deepEqual(layer(aligned, "s1", "image").motion, { type: "ken_burns", intensity: 0.28 });
  assert.equal(layer(aligned, "s1", "image").x, 0);
  assert.equal(layer(aligned, "s2", "image").src, "assets/images/hook.png");
  assert.equal(layer(aligned, "s3", "image").src, "assets/images/habit.png");
  assert.equal(layer(aligned, "s3", "image").asset_id, "habit");
  assert.equal(layer(aligned, "s3", "image").fit, "cover");
  assert.equal(layer(aligned, "s3", "image").overlay, "dark_gradient");
  assert.deepEqual(layer(aligned, "s3", "image").motion, { type: "slow_zoom_out", intensity: 0.3 });
  assert.equal(layer(aligned, "s4", "image").src, "assets/images/old_c.png");
  assert.equal(layer(aligned, "s1", "text").text, "one");
  assert.equal(layer(aligned, "s1", "chapter_card").title, "Keep this title");
  assert.equal(aligned.clips[2].start_sec, 4.6);
  assert.deepEqual(aligned.clips[2].transition_in, source.clips[2].transition_in);
  assert.equal(aligned.video.duration_sec, 8);
  assert.equal(report.clipsUpdated, 3);
  assert.equal(report.clipsKept, 1);
  assert.equal(report.uncovered, "4");
  assert.deepEqual(report.assignments, [
    { file: "hook.png", cues: "1-2", clips: 2 },
    { file: "habit.png", cues: "3", clips: 1 },
  ]);
});

test("a clip that leads the next cue takes the upcoming picture", () => {
  const source = {
    ...plan(),
    clips: [clip("lead", 3.6, 6, "old_b", "three")],
  };
  const { plan: aligned } = run(
    {
      images: [
        { file: "a.png", cues: { start: 1, end: 2 } },
        { file: "b.png", cues: { start: 3, end: 4 } },
      ],
    },
    ["a.png", "b.png"],
    source,
  );
  assert.equal(layer(aligned, "lead", "image").src, "assets/images/b.png");
});

test("a gap before the next picture uses that picture", () => {
  const source = {
    ...plan(),
    clips: [clip("gap", 2.1, 2.7, "old", "between")],
  };
  const { plan: aligned } = run(
    {
      images: [
        { file: "a.png", cues: { start: 1, end: 1 } },
        { file: "b.png", cues: { start: 2, end: 2 } },
      ],
    },
    ["a.png", "b.png"],
    source,
    [
      { start: 0, end: 2, text: "one" },
      { start: 3, end: 5, text: "two" },
    ],
  );
  assert.equal(layer(aligned, "gap", "image").src, "assets/images/b.png");
});

test("an uncovered cue keeps the picture already on the clip", () => {
  const source = {
    ...plan(),
    clips: [clip("mid", 3, 5, "stay", "middle")],
  };
  const { plan: aligned } = run(
    {
      images: [
        { file: "a.png", cues: { start: 1, end: 1 } },
        { file: "c.png", cues: { start: 3, end: 3 } },
      ],
    },
    ["a.png", "c.png"],
    source,
    [
      { start: 0, end: 2, text: "one" },
      { start: 2, end: 6, text: "two" },
      { start: 6, end: 8, text: "three" },
    ],
  );
  assert.equal(layer(aligned, "mid", "image").src, "assets/images/stay.png");
  assert.equal(layer(aligned, "mid", "image").asset_id, "stay");
});

test("the same file can return in a later range", () => {
  const { plan: aligned } = run(
    {
      images: [
        { file: "hook.png", cues: { start: 1, end: 1 } },
        { file: "habit.png", cues: { start: 2, end: 2 } },
        { file: "hook.png", cues: { start: 3, end: 4 } },
      ],
    },
    ["hook.png", "habit.png"],
  );
  assert.equal(layer(aligned, "s1", "image").src, "assets/images/hook.png");
  assert.equal(layer(aligned, "s2", "image").src, "assets/images/habit.png");
  assert.equal(layer(aligned, "s4", "image").src, "assets/images/hook.png");
});

test("text-only clips are left untouched", () => {
  const source = plan();
  source.clips.push({
    id: "words",
    start_sec: 0,
    end_sec: 2,
    layers: [{ type: "text", text: "only words", variant: "subtitle" }],
  });
  const { plan: aligned } = run({ images: [{ file: "hook.png", cues: { start: 1, end: 4 } }] }, ["hook.png"], source);
  const words = aligned.clips.find((item) => item.id === "words");
  assert.deepEqual(words.layers, [{ type: "text", text: "only words", variant: "subtitle" }]);
});

test("two images cannot claim the same cue", () => {
  assert.throws(
    () =>
      run(
        {
          images: [
            { file: "a.png", cues: { start: 1, end: 2 } },
            { file: "b.png", cues: { start: 2, end: 3 } },
          ],
        },
        ["a.png", "b.png"],
      ),
    /a\.png and b\.png both claim cue 2/,
  );
});

test("a missing picture stops the aligner", () => {
  assert.throws(
    () => run({ images: [{ file: "gone.png", cues: { start: 1, end: 1 } }] }, []),
    /Missing image file:\ngone\.png/,
  );
});

test("a cue past the SRT stops the aligner", () => {
  assert.throws(
    () => run({ images: [{ file: "a.png", cues: { start: 1, end: 9 } }] }, ["a.png"]),
    /a\.png claims cue 5, and that cue is not in the SRT/,
  );
});

test("an unknown motion stops the aligner", () => {
  assert.throws(
    () =>
      run(
        { images: [{ file: "a.png", cues: { start: 1, end: 1 }, motion: { type: "spin" } }] },
        ["a.png"],
      ),
    /unknown motion "spin"/,
  );
});

test("the srt and the manifest are enough to target edit_plan", () => {
  const fromSrt = parseArgs(["voice.srt", "images.json"]);
  const fromManifest = parseArgs(["images.json", "voice.srt"]);
  assert.match(fromSrt.planPath, /edit_plan\.json$/);
  assert.equal(fromSrt.outPath, fromSrt.planPath);
  assert.match(fromSrt.srtPath, /voice\.srt$/);
  assert.match(fromSrt.manifestPath, /images\.json$/);
  assert.equal(fromManifest.srtPath, fromSrt.srtPath);
  assert.equal(fromManifest.manifestPath, fromSrt.manifestPath);
  assert.equal(fromManifest.planPath, fromSrt.planPath);
});

test("cli writes a copy and leaves the input plan in place", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "align-images-cli-"));
  const imagesDir = path.join(dir, "images");
  fs.mkdirSync(imagesDir);
  fs.writeFileSync(path.join(imagesDir, "hook.png"), "");
  const planPath = path.join(dir, "plan.json");
  const srtPath = path.join(dir, "voice.srt");
  const manifestPath = path.join(dir, "images.json");
  const outPath = path.join(dir, "aligned.json");
  fs.writeFileSync(planPath, JSON.stringify(plan()));
  fs.writeFileSync(srtPath, toSrt(spoken));
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({ images: [{ file: "hook.png", cues: { start: 1, end: 4 } }] }),
  );
  const runCli = spawnSync(
    process.execPath,
    [
      path.join(__dirname, "align-images.js"),
      manifestPath,
      srtPath,
      "--plan",
      planPath,
      "--images",
      imagesDir,
      "--out",
      outPath,
    ],
    { encoding: "utf8" },
  );
  assert.equal(runCli.status, 0, runCli.stderr);
  assert.match(runCli.stdout, /"clipsUpdated": 4/);
  const written = JSON.parse(fs.readFileSync(outPath, "utf8"));
  assert.equal(written.clips[0].layers[0].src, "assets/images/hook.png");
  assert.equal(JSON.parse(fs.readFileSync(planPath, "utf8")).clips[0].layers[0].src, "assets/images/old_a.png");
});

test("cli does not write when an image file is missing", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "align-images-miss-"));
  const planPath = path.join(dir, "plan.json");
  const srtPath = path.join(dir, "voice.srt");
  const manifestPath = path.join(dir, "images.json");
  const outPath = path.join(dir, "aligned.json");
  fs.writeFileSync(planPath, JSON.stringify(plan()));
  fs.writeFileSync(srtPath, toSrt(spoken));
  fs.writeFileSync(
    manifestPath,
    JSON.stringify({ images: [{ file: "gone.png", cues: { start: 1, end: 1 } }] }),
  );
  const runCli = spawnSync(
    process.execPath,
    [
      path.join(__dirname, "align-images.js"),
      srtPath,
      manifestPath,
      "--plan",
      planPath,
      "--images",
      path.join(dir, "empty"),
      "--out",
      outPath,
    ],
    { encoding: "utf8" },
  );
  assert.equal(runCli.status, 1);
  assert.match(runCli.stderr, /Missing image file/);
  assert.equal(fs.existsSync(outPath), false);
});
