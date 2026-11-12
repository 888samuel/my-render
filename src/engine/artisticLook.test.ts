import assert from "node:assert/strict";
import test from "node:test";
import { validateEditPlan } from "../validation/validateEditPlan";
import type { EditPlan } from "../types/edit-plan";
import {
  letterboxFraction,
  lookFilter,
  normalizeLook,
  vhsShift,
} from "./artisticLook";
import { normalizeTransitionType } from "./normalizeTransition";

test("look names and aliases resolve", () => {
  assert.equal(normalizeLook(undefined), "none");
  assert.equal(normalizeLook("cinema"), "cinema");
  assert.equal(normalizeLook("Cinematic"), "cinema");
  assert.equal(normalizeLook("black_and_white"), "noir");
  assert.equal(normalizeLook("tape"), "vhs");
  assert.throws(() => normalizeLook("watercolor"), /Unknown look/);
});

test("grades stay distinct and the tape wobble is stable", () => {
  assert.match(lookFilter("noir") ?? "", /grayscale/);
  assert.match(lookFilter("golden") ?? "", /sepia/);
  assert.equal(lookFilter("none"), undefined);
  assert.equal(letterboxFraction("cinema"), 0.11);
  assert.equal(letterboxFraction("film"), 0);

  const once = vhsShift(12);
  assert.deepEqual(vhsShift(12), once);
  assert.notDeepEqual(vhsShift(0), once);
});

test("artistic cuts are their own transitions", () => {
  assert.equal(normalizeTransitionType("flash_cut"), "flash");
  assert.equal(normalizeTransitionType("circle_pulse"), "circle");
  assert.equal(normalizeTransitionType("whip_pan"), "whip");
  assert.equal(normalizeTransitionType("glitch_cut"), "glitch");
  assert.equal(normalizeTransitionType("hard_cut"), "none");
});

test("a plan can set a film look and a bad look is rejected", () => {
  const plan: EditPlan = {
    version: "1.0",
    video: {
      id: "t",
      width: 1920,
      height: 1080,
      fps: 30,
      duration_sec: 2,
      look: "film",
    },
    clips: [
      {
        id: "shot",
        start_sec: 0,
        end_sec: 2,
        source: "video",
        src: "assets/videos/sample-bars.mp4",
        look: "noir",
        layers: [
          {
            type: "video",
            src: "assets/videos/sample-bars.mp4",
            look: "vhs",
            volume: 0,
            x: 70,
            y: 40,
            width: 28,
          },
        ],
      },
    ],
  };

  validateEditPlan(plan);

  const shot = plan.clips[0];
  if (!shot) {
    throw new Error("missing shot");
  }

  assert.throws(() => {
    validateEditPlan({
      ...plan,
      clips: [{ ...shot, look: "watercolor" as "noir" }],
    });
  }, /Unknown look/);
});
