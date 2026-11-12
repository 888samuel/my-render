import { VIDEO_LOOKS, type VideoLook } from "../types/common";

type PictureStyle = {
  filter?: string;
  transform?: string;
};

const LOOKS = new Set<string>(VIDEO_LOOKS);

/** Names a plan can write when it means one of the canonical looks. */
const ALIASES: Record<string, VideoLook> = {
  cinematic: "cinema",
  letterbox: "cinema",
  vintage: "film",
  grain: "film",
  bw: "noir",
  black_and_white: "noir",
  mono: "noir",
  gold: "golden",
  amber: "golden",
  teal_orange: "teal",
  blockbuster: "teal",
  washed: "fade",
  vintage_print: "fade",
  retro: "vhs",
  tape: "vhs",
  soft: "dream",
  ethereal: "dream",
  poster: "ink",
  graphic: "ink",
};

export function isVideoLook(value: string): value is VideoLook {
  return LOOKS.has(value);
}

/** Canonical look. Unknown names fail the render instead of silently doing nothing. */
export function normalizeLook(look: string | undefined): VideoLook {
  if (look === undefined) {
    return "none";
  }

  const key = look.trim().toLowerCase();
  if (key === "" || key === "none") {
    return "none";
  }

  if (isVideoLook(key)) {
    return key;
  }

  const alias = ALIASES[key];
  if (alias) {
    return alias;
  }

  throw new Error(
    `ERROR:\nUnknown look "${look}". Use cinema, film, noir, golden, teal, fade, vhs, dream, or ink.`,
  );
}

/** CSS filter for the picture itself. Overlays sit on top of this. */
export function lookFilter(look: VideoLook): string | undefined {
  switch (look) {
    case "none":
      return undefined;
    case "cinema":
      return "contrast(1.12) saturate(0.86) brightness(0.94)";
    case "film":
      return "sepia(0.22) contrast(1.08) saturate(0.78) brightness(1.02)";
    case "noir":
      return "grayscale(1) contrast(1.38) brightness(0.9)";
    case "golden":
      return "sepia(0.4) saturate(1.32) contrast(1.06) brightness(1.05)";
    case "teal":
      return "contrast(1.12) saturate(1.22) brightness(0.96) hue-rotate(-8deg)";
    case "fade":
      return "contrast(0.86) saturate(0.62) brightness(1.12) sepia(0.14)";
    case "vhs":
      return "contrast(1.18) saturate(1.4) brightness(1.04) hue-rotate(-12deg)";
    case "dream":
      return "contrast(0.92) saturate(0.72) brightness(1.08)";
    case "ink":
      return "contrast(1.65) saturate(0.16) brightness(0.98)";
  }
}

/** How tall the black bars are, as a fraction of the frame. */
export function letterboxFraction(look: VideoLook): number {
  return look === "cinema" ? 0.11 : 0;
}

/**
 * A small tape wobble. Same frame always returns the same shift,
 * so the render stays deterministic.
 */
export function vhsShift(frame: number): { x: number; y: number } {
  return {
    x: Math.sin(frame * 0.9) * 1.6,
    y: Math.cos(frame * 0.4) * 0.7,
  };
}

/** Wrapper style for the picture. Empty when the shot has no grade. */
export function lookPictureStyle(
  look: VideoLook,
  frame: number,
): PictureStyle {
  const filter = lookFilter(look);
  if (look === "vhs") {
    const shift = vhsShift(frame);
    return {
      filter,
      transform: `translate(${String(shift.x)}px, ${String(shift.y)}px) scale(1.035)`,
    };
  }

  if (!filter) {
    return {};
  }

  return { filter };
}
