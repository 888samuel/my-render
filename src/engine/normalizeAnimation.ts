import type { TextAnimationType } from "../types/common";
import type { TextAnimation } from "../types/edit-plan";

type AnimInput = TextAnimation | TextAnimationType | string | undefined | null;

/**
 * LLMs often emit animation as a bare string ("fade_up").
 * Normalize to { type } so render never crashes.
 */
export function normalizeTextAnimationInput(
  animation: AnimInput,
  fallback: TextAnimationType = "fade_in",
): TextAnimation {
  if (!animation) {
    return { type: fallback };
  }
  if (typeof animation === "string") {
    return { type: animation as TextAnimationType };
  }
  if (typeof animation === "object" && typeof animation.type === "string") {
    return animation;
  }
  return { type: fallback };
}
