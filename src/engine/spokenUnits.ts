import type { TextAnimationType } from "../types/common";

export type SpokenKind =
  | "voice_words"
  | "follow"
  | "dim_past"
  | "word_box"
  | "wipe"
  | "underline"
  | "ghost"
  | "word_rise"
  | "focus"
  | "lines"
  | "clauses"
  | "punch"
  | "decode"
  | "stroke";

const CUE_TEXT = new Set<TextAnimationType>([
  "voice",
  "voice_words",
  "follow",
  "dim_past",
  "word_box",
  "wipe",
  "underline",
  "ghost",
  "word_rise",
  "focus",
  "lines",
  "clauses",
  "punch",
  "decode",
  "stroke",
]);

const SPOKEN_KIND = new Set<SpokenKind>([
  "voice_words",
  "follow",
  "dim_past",
  "word_box",
  "wipe",
  "underline",
  "ghost",
  "word_rise",
  "focus",
  "lines",
  "clauses",
  "punch",
  "decode",
  "stroke",
]);

/** Animations that play across the layer window, which is the spoken cue. */
export function isCueTextAnimation(type: TextAnimationType): boolean {
  return CUE_TEXT.has(type);
}

export function isSpokenKind(type: TextAnimationType): type is SpokenKind {
  return SPOKEN_KIND.has(type as SpokenKind);
}

export type WeightedUnit = {
  text: string;
  start: number;
  end: number;
};

/** 0 at the first frame of the cue, 1 on the last. */
export function spokenProgress(frame: number, durationInFrames: number): number {
  if (durationInFrames <= 1) return 1;
  return Math.min(1, Math.max(0, frame / (durationInFrames - 1)));
}

export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter((word) => word.length > 0);
}

/** Phrases split on sentence punctuation, including Ge'ez marks. */
export function splitClauses(text: string): string[] {
  const parts = text.split(/([.!?።፨፣፤;:]+)/u);
  const clauses: string[] = [];
  let current = "";
  for (const part of parts) {
    if (!part) continue;
    if (/^[.!?።፨፣፤;:]+$/u.test(part)) {
      current += part;
      const trimmed = current.trim();
      if (trimmed) clauses.push(trimmed);
      current = "";
      continue;
    }
    current += part;
  }
  const tail = current.trim();
  if (tail) clauses.push(tail);
  return clauses.length > 0 ? clauses : [text.trim()];
}

/** Explicit newlines, or three even groups when the line is one paragraph. */
export function splitLines(text: string): string[] {
  if (text.includes("\n")) {
    const lines = text
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    if (lines.length > 0) return lines;
  }
  const words = splitWords(text);
  if (words.length <= 6) return [text.trim()];
  const size = Math.ceil(words.length / 3);
  const lines: string[] = [];
  for (let index = 0; index < words.length; index += size) {
    lines.push(words.slice(index, index + size).join(" "));
  }
  return lines;
}

/** Each part owns a slice of the cue proportional to its letter count. */
export function weightedUnits(parts: string[]): WeightedUnit[] {
  const clean = parts.filter((part) => part.trim().length > 0);
  if (clean.length === 0) return [];
  const weights = clean.map((part) =>
    Math.max(1, Array.from(part.replace(/\s/g, "")).length),
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = 0;
  return clean.map((text, index) => {
    const weight = weights[index] ?? 1;
    const start = cursor / total;
    cursor += weight;
    return { text, start, end: cursor / total };
  });
}

export function activeIndex(units: WeightedUnit[], progress: number): number {
  if (units.length === 0) return -1;
  let index = 0;
  for (let i = 0; i < units.length; i += 1) {
    const unit = units[i];
    if (unit && progress >= unit.start) index = i;
  }
  return index;
}

/** 0 before a unit starts, then rises to 1 across a short entrance. */
export function entranceProgress(
  frame: number,
  fps: number,
  unitStart: number,
  durationInFrames: number,
  windowSec = 0.35,
): number {
  if (durationInFrames <= 1) return 1;
  const startFrame = unitStart * (durationInFrames - 1);
  const window = Math.max(1, Math.round(fps * windowSec));
  return Math.min(1, Math.max(0, (frame - startFrame) / window));
}
