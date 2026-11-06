const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { alignPlan, createTiming } = require("./align-plan-to-srt");

const timing = createTiming(30);

function stamp(sec) {
  const ms = Math.round(sec * 1000);
  const pad = (value, width = 2) => String(value).padStart(width, "0");
  return `${pad(Math.floor(ms / 3600000))}:${pad(Math.floor(ms / 60000) % 60)}:${pad(Math.floor(ms / 1000) % 60)},${pad(ms % 1000, 3)}`;
}

function toSrt(cues) {
  return cues
    .map((cue, index) => `${index + 1}\n${stamp(cue.start)} --> ${stamp(cue.end)}\n${cue.text}\n`)
    .join("\n");
}

function leadStart(cueStart) {
  return timing.secOf(timing.frameOf(cueStart) - timing.frameOf(0.467));
}

function caption(start, end, text) {
  return {
    type: "text",
    text,
    variant: "subtitle",
    placement: "bottom_center",
    start_sec: start,
    end_sec: end,
    animation: { type: "none", auto_exit: false },
  };
}

function scene(id, start, end, asset, card, extra = {}) {
  const clip = {
    id,
    start_sec: start,
    end_sec: end,
    transition_in: {
      type: id.endsWith("1") ? "fade_in_from_black" : "cross_dissolve",
      duration_sec: id.endsWith("1") ? 0.8 : 0.467,
    },
    transition_out: extra.last
      ? { type: "fade_to_black", duration_sec: 0.8 }
      : { type: "cross_dissolve", duration_sec: 0.467 },
    layers: [
      {
        type: "image",
        asset_id: asset,
        src: `assets/images/${asset}.png`,
        fit: "cover",
      },
      card,
      ...(extra.layers || []),
    ],
  };
  if (extra.start_cue != null) clip.start_cue = extra.start_cue;
  return clip;
}

function withoutTimes(plan) {
  const copy = JSON.parse(JSON.stringify(plan));
  const walk = (node) => {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    for (const key of Object.keys(node)) {
      if (key === "transition_in" || key === "transition_out") continue;
      if (key === "start_sec" || key === "end_sec") delete node[key];
      else if (key === "duration_sec" && node.fps != null) delete node[key];
      else walk(node[key]);
    }
  };
  walk(copy);
  return copy;
}

function basePlan(captions) {
  const cues = [
    ["alpha one", 0.5, 2],
    ["alpha two", 2.2, 4],
    ["beta one", 4.5, 6],
    ["beta two", 6.2, 8],
    ["gamma one", 8.5, 10],
    ["gamma two", 10.2, 12],
  ];
  return {
    version: "1.0",
    video: { id: "sample_cut", width: 1920, height: 1080, fps: 30, duration_sec: 12 },
    audio: { src: "assets/audio/sample.mp3", start_sec: 0 },
    clips: [
      scene("s001", 0, leadStart(4.5), "river_dawn", {
        type: "chapter_card",
        title: "Opening",
        start_sec: 0.5,
        end_sec: 4,
      }),
      scene("s002", leadStart(4.5), leadStart(8.5), "market_stall", {
        type: "lower_third",
        title: "The stall",
        start_sec: 4.5,
        end_sec: 6,
      }, {
        layers: [
          {
            type: "callout",
            text: "Mid line",
            start_sec: 5,
            end_sec: 5.4,
          },
        ],
      }),
      scene("s003", leadStart(8.5), 12, "night_road", {
        type: "chapter_card",
        title: "Close",
        start_sec: 8.5,
        end_sec: 12,
      }, { last: true }),
      {
        id: "clip_subtitles",
        start_sec: 0,
        end_sec: 12,
        layers: captions || cues.map(([text, start, end]) => caption(start, end, text)),
      },
      {
        id: "clip_visualizer",
        start_sec: 0,
        end_sec: 12,
        layers: [{ type: "graphic", graphic: "audio_visualizer", variant: "bars" }],
      },
    ],
  };
}

const retimed = [
  { start: 1, end: 3, text: "alpha one" },
  { start: 3.2, end: 6, text: "alpha two" },
  { start: 10, end: 12, text: "beta one" },
  { start: 12.5, end: 15, text: "beta two" },
  { start: 20, end: 22, text: "gamma one" },
  { start: 22.5, end: 25, text: "gamma two" },
];

function clipById(plan, id) {
  return plan.clips.find((clip) => clip.id === id);
}

function cardOf(clip) {
  return clip.layers.find((layer) => layer.type === "chapter_card" || layer.type === "lower_third");
}

test("moves existing times onto the same spoken lines and leaves everything else", () => {
  const source = basePlan();
  const { plan, report } = alignPlan(source, toSrt(retimed));
  assert.equal(report.mode, "text");
  assert.equal(plan.video.id, "sample_cut");
  assert.equal(plan.audio.src, "assets/audio/sample.mp3");
  assert.equal(plan.video.duration_sec, 25);
  assert.equal(plan.clips.length, source.clips.length);
  assert.equal(clipById(plan, "s001").layers[0].asset_id, "river_dawn");
  assert.equal(clipById(plan, "s002").start_sec, 6.267);
  assert.equal(clipById(plan, "s003").start_sec, 15.333);
  assert.equal(clipById(plan, "s001").end_sec, clipById(plan, "s002").start_sec);
  assert.equal(clipById(plan, "s003").end_sec, 25);
  assert.equal(clipById(plan, "s002").transition_in.duration_sec, 0.467);
  assert.equal(cardOf(clipById(plan, "s001")).start_sec, 1);
  assert.equal(cardOf(clipById(plan, "s001")).end_sec, 6);
  assert.equal(cardOf(clipById(plan, "s001")).title, "Opening");
  assert.equal(cardOf(clipById(plan, "s002")).start_sec, 10);
  assert.equal(cardOf(clipById(plan, "s002")).end_sec, 12);
  assert.equal(cardOf(clipById(plan, "s003")).start_sec, 20);
  assert.equal(cardOf(clipById(plan, "s003")).end_sec, 25);
  const callout = clipById(plan, "s002").layers.find((layer) => layer.type === "callout");
  assert.equal(callout.start_sec, 10.667);
  assert.equal(callout.end_sec, 11.2);
  assert.equal(clipById(plan, "s001").transition_in.duration_sec, 0.8);
  assert.equal(clipById(plan, "s003").transition_out.type, "fade_to_black");
  assert.equal(clipById(plan, "s003").transition_out.duration_sec, 0.8);
  const subs = clipById(plan, "clip_subtitles");
  assert.equal(subs.end_sec, 25);
  assert.deepEqual(
    subs.layers.map((layer) => [layer.text, layer.start_sec, layer.end_sec]),
    retimed.map((cue) => [cue.text, cue.start, cue.end]),
  );
  assert.equal(clipById(plan, "clip_visualizer").end_sec, 25);
  assert.deepEqual(withoutTimes(plan), withoutTimes(source));
});

test("aligns a second, unrelated plan", () => {
  const plan = {
    version: "1.0",
    video: { id: "market_walk", width: 1080, height: 1920, fps: 30, duration_sec: 8 },
    audio: { src: "assets/audio/walk.wav", start_sec: 0 },
    clips: [
      scene("a1", 0, leadStart(3), "harbor", {
        type: "chapter_card",
        title: "Harbor",
        start_sec: 0.4,
        end_sec: 2.5,
      }),
      scene("a2", leadStart(3), 8, "lanes", {
        type: "lower_third",
        title: "Lanes",
        start_sec: 3,
        end_sec: 8,
      }, { last: true }),
      {
        id: "clip_subtitles",
        start_sec: 0,
        end_sec: 8,
        layers: [
          caption(0.4, 2.5, "ንገበያ ንወጽእ"),
          caption(3, 5, "ኣብ መንገዲ እዩ"),
          caption(5.2, 8, "ደሓር ንምለስ"),
        ],
      },
    ],
  };
  const srt = toSrt([
    { start: 1, end: 4, text: "ንገበያ ንወጽእ" },
    { start: 6, end: 9, text: "ኣብ መንገዲ እዩ" },
    { start: 9.5, end: 14, text: "ደሓር ንምለስ" },
  ]);
  const { plan: aligned, report } = alignPlan(plan, srt);
  assert.equal(report.mode, "text");
  assert.equal(aligned.video.id, "market_walk");
  assert.equal(aligned.audio.src, "assets/audio/walk.wav");
  assert.equal(clipById(aligned, "a1").layers[0].asset_id, "harbor");
  assert.equal(clipById(aligned, "a2").start_sec, 4.133);
  assert.equal(clipById(aligned, "a2").end_sec, 14);
  assert.equal(cardOf(clipById(aligned, "a1")).title, "Harbor");
  assert.deepEqual(
    clipById(aligned, "clip_subtitles").layers.map((layer) => layer.text),
    ["ንገበያ ንወጽእ", "ኣብ መንገዲ እዩ", "ደሓር ንምለስ"],
  );
});

test("keeps cue numbers when the line count matches but the words do not", () => {
  const renamed = retimed.map((cue, index) => ({
    ...cue,
    text: "line " + (index + 1) + " rewritten",
  }));
  const { plan, report } = alignPlan(basePlan(), toSrt(renamed));
  assert.equal(report.mode, "index");
  assert.equal(clipById(plan, "s002").start_sec, 6.267);
  assert.equal(clipById(plan, "s003").start_sec, 15.333);
  assert.equal(clipById(plan, "clip_subtitles").layers[0].text, "alpha one");
  assert.equal(clipById(plan, "clip_subtitles").layers[0].start_sec, 1);
  assert.match(report.warnings[0], /Text is unchanged/);
});

test("follows the same fraction of the runtime when the plan has no captions", () => {
  const plan = basePlan();
  plan.clips = plan.clips.filter((clip) => clip.id !== "s003" && clip.id !== "clip_subtitles");
  clipById(plan, "s001").end_sec = 4;
  clipById(plan, "s002").start_sec = 4;
  clipById(plan, "s002").end_sec = 12;
  clipById(plan, "s002").transition_out = { type: "fade_to_black", duration_sec: 0.8 };
  plan.video.duration_sec = 12;
  const { plan: aligned, report } = alignPlan(
    plan,
    toSrt([
      { start: 0.5, end: 2, text: "one" },
      { start: 4, end: 7, text: "two" },
      { start: 9, end: 12, text: "three" },
      { start: 14, end: 18, text: "four" },
      { start: 19.5, end: 20, text: "five" },
    ]),
  );
  assert.equal(report.mode, "time");
  assert.equal(clipById(aligned, "s002").start_sec, 6.667);
  assert.equal(clipById(aligned, "clip_subtitles"), undefined);
  assert.equal(clipById(aligned, "s002").transition_out.duration_sec, 0.8);
  assert.equal(aligned.video.duration_sec, 20);
});

test("keeps extra fields and does not retarget a scene", () => {
  const plan = basePlan();
  clipById(plan, "s002").start_cue = 5;
  const { plan: aligned } = alignPlan(plan, toSrt(retimed));
  assert.equal(clipById(aligned, "s002").start_cue, 5);
  assert.equal(clipById(aligned, "s002").start_sec, 6.267);
  assert.equal(cardOf(clipById(aligned, "s002")).title, "The stall");
});

test("a second pass leaves the aligned plan unchanged", () => {
  const srt = toSrt(retimed);
  const first = alignPlan(basePlan(), srt).plan;
  const second = alignPlan(first, srt).plan;
  assert.deepEqual(second, first);
});

test("places a scene by its share of the cue list when the words and counts differ", () => {
  const plan = basePlan();
  plan.clips = plan.clips.filter((clip) => clip.id !== "s003");
  clipById(plan, "s002").start_sec = leadStart(6.2);
  clipById(plan, "s002").end_sec = 12;
  clipById(plan, "s002").transition_out = { type: "fade_to_black", duration_sec: 0.8 };
  const { plan: aligned, report } = alignPlan(
    plan,
    toSrt([
      { start: 2, end: 5, text: "totally different opening" },
      { start: 8, end: 11, text: "another unmatched line" },
    ]),
  );
  assert.equal(report.mode, "scale");
  assert.equal(clipById(aligned, "s002").start_sec, 5.267);
  assert.equal(aligned.video.duration_sec, 11);
  assert.equal(clipById(aligned, "clip_subtitles").layers.length, 6);
  assert.equal(clipById(aligned, "clip_subtitles").layers[0].text, "alpha one");
  assert.match(report.warnings[0], /Nothing was added or removed/);
});

test("cli writes the plan and does not copy the srt", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "align-plan-"));
  const planPath = path.join(dir, "plan.json");
  const srtPath = path.join(dir, "voice.srt");
  const outPath = path.join(dir, "aligned.json");
  fs.writeFileSync(planPath, JSON.stringify(basePlan()));
  fs.writeFileSync(srtPath, toSrt(retimed));
  const run = spawnSync(
    process.execPath,
    [path.join(__dirname, "align-plan-to-srt.js"), planPath, srtPath, "--out", outPath],
    { encoding: "utf8" },
  );
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /"mode": "text"/);
  const written = JSON.parse(fs.readFileSync(outPath, "utf8"));
  assert.equal(written.video.duration_sec, 25);
  assert.deepEqual(fs.readdirSync(dir).sort(), ["aligned.json", "plan.json", "voice.srt"]);
  assert.equal(JSON.parse(fs.readFileSync(planPath, "utf8")).video.duration_sec, 12);
});
