import assert from "node:assert/strict";
import test from "node:test";
import { resolveVideoAsset } from "./AssetResolver";
import {
  assertPlayback,
  footageWindow,
  isVideoSrc,
  mediaKind,
  resolvePlayback,
  sampleFootage,
} from "./videoPlayback";
import { validateAssets } from "../validation/validateAssets";
import { validateEditPlan } from "../validation/validateEditPlan";
import type { EditPlan } from "../types/edit-plan";
import editPlanJson from "../data/edit_plan.json";

test("video paths and asset ids", () => {
  assert.equal(isVideoSrc("assets/videos/interview.mp4"), true);
  assert.equal(isVideoSrc("assets/images/still.PNG"), false);
  assert.equal(isVideoSrc("https://cdn.example.com/a.webm?token=1"), true);
  assert.equal(mediaKind({ src: "assets/videos/a.mov" }), "video");
  assert.equal(mediaKind({ asset_id: "vid_12" }), "video");
  assert.equal(mediaKind({ asset_id: "img_012", source: "image" }), "image");
  assert.equal(mediaKind({ src: "assets/videos/a.mp4", source: "image" }), "image");
  assert.equal(resolveVideoAsset("vid001"), "assets/videos/vid_001.mp4");
  assert.equal(resolveVideoAsset("vid_12"), "assets/videos/vid_012.mp4");
  assert.equal(
    resolveVideoAsset("assets/videos/custom.mkv"),
    "assets/videos/custom.mkv",
  );
});

test("trim and speed land on the right source frame", () => {
  const playback = resolvePlayback({
    trim_start_sec: 1.2,
    trim_end_sec: 3.2,
    playback_rate: 2,
    volume: 0,
  });
  assert.equal(playback.muted, true);
  assert.equal(playback.playbackRate, 2);

  const window = footageWindow(playback, 4, 30);
  assert.equal(window.trimStartSec, 1.2);
  assert.equal(window.trimEndSec, 3.2);
  assert.equal(window.contentFrames, 30);

  const first = sampleFootage({
    timelineFrame: 0,
    fps: 30,
    window,
    playbackRate: 2,
    loop: false,
  });
  assert.equal(first.holding, false);
  assert.equal(first.frame, 36);

  const held = sampleFootage({
    timelineFrame: 30,
    fps: 30,
    window,
    playbackRate: 2,
    loop: false,
  });
  assert.equal(held.holding, true);

  const looped = sampleFootage({
    timelineFrame: 30,
    fps: 30,
    window,
    playbackRate: 2,
    loop: true,
  });
  assert.equal(looped.holding, false);
  assert.equal(looped.frame, first.frame);
});

test("the current edit plan still validates", () => {
  const plan = editPlanJson as EditPlan;
  validateEditPlan(plan);
  validateAssets(plan);
});

test("a video plan is accepted and a bad speed is rejected", () => {
  const plan: EditPlan = {
    version: "1.0",
    video: { id: "t", width: 1920, height: 1080, fps: 30, duration_sec: 2 },
    audio: [
      { src: "assets/audio/natty3.mp3", volume: 0.8 },
      { src: "assets/audio/bed.mp3", start_sec: 0, end_sec: 2, trim_start_sec: 1 },
    ],
    clips: [
      {
        id: "shot",
        start_sec: 0,
        end_sec: 2,
        source: "video",
        src: "assets/videos/sample-bars.mp4",
        trim_start_sec: 0.2,
        layers: [
          {
            type: "video",
            src: "assets/videos/sample-bars.mp4",
            x: 70,
            y: 40,
            width: 30,
            volume: 0,
          },
        ],
      },
    ],
  };

  validateEditPlan(plan);
  validateAssets(plan);

  assert.throws(
    () => assertPlayback({ playback_rate: 0 }, "Clip"),
    /playback_rate/,
  );
  const shot = plan.clips[0];
  if (!shot) {
    throw new Error("missing shot");
  }
  assert.throws(() => {
    validateEditPlan({
      ...plan,
      clips: [{ ...shot, playback_rate: 40, layers: [] }],
    });
  }, /playback_rate/);
});
