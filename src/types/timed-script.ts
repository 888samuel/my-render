import type { Seconds } from "./common";

export type TimedScriptSegment = {
  id: string;
  start_sec: Seconds;
  end_sec: Seconds;
  text: string;
};

export type TimedScript = {
  version: string;
  video_id: string;
  segments: TimedScriptSegment[];
};
