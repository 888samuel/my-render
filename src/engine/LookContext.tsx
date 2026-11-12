import { createContext, useContext } from "react";
import type { VideoLook } from "../types/common";

const LookContext = createContext<VideoLook>("none");

export const LookProvider = LookContext.Provider;

/** The shot grade, already resolved from the clip and the video default. */
export function useInheritedLook(): VideoLook {
  return useContext(LookContext);
}
