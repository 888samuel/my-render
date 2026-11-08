import type { AudioTrack } from "../types/edit-plan";

export function listAudioTracks(
  audio: AudioTrack | AudioTrack[] | undefined,
): AudioTrack[] {
  if (!audio) {
    return [];
  }

  return Array.isArray(audio) ? audio : [audio];
}
