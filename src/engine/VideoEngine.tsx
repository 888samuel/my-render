import { Html5Audio, Sequence, staticFile } from "remotion";
import { AbsoluteFill } from "../components/common/AbsoluteFill";
import { ClipRenderer } from "./ClipRenderer";
import { EditPlanProvider } from "./EditPlanContext";
import { listAudioTracks } from "./audioTracks";
import { resolvePlayback } from "./videoPlayback";
import { EthiopicFont } from "../styles/EthiopicFont";
import { theme } from "../styles/theme";
import { secondsToFrames } from "../utils/time";
import { validateAssets } from "../validation/validateAssets";
import { validateEditPlan } from "../validation/validateEditPlan";
import type { AudioTrack, EditPlan } from "../types/edit-plan";

type VideoEngineProps = {
  editPlan: EditPlan;
};

export const VideoEngine = ({ editPlan }: VideoEngineProps) => {
  validateEditPlan(editPlan);
  validateAssets(editPlan);

  return (
    <EditPlanProvider value={editPlan}>
      <AbsoluteFill
        style={{
          backgroundColor: theme.colors.background,
        }}
      >
        <EthiopicFont />
        {editPlan.clips.map((clip, index) => (
          <ClipRenderer
            key={clip.id}
            clip={clip}
            nextClip={editPlan.clips[index + 1]}
            fps={editPlan.video.fps}
          />
        ))}
        {listAudioTracks(editPlan.audio).map((track, index) => (
          <AudioBed
            key={`${track.src}-${String(index)}`}
            audio={track}
            fps={editPlan.video.fps}
          />
        ))}
      </AbsoluteFill>
    </EditPlanProvider>
  );
};

const AudioBed = ({
  audio,
  fps,
}: {
  audio: AudioTrack;
  fps: number;
}) => {
  const startSec = audio.start_sec ?? 0;
  const startFrame = secondsToFrames(startSec, fps);
  const playback = resolvePlayback(audio);
  const trimBefore =
    playback.trimStartSec > 0 ? secondsToFrames(playback.trimStartSec, fps) : undefined;
  // Loop math inside Html5Audio uses the out-point. A one-shot bed is cut
  // with the sequence length so speed still reaches that out-point.
  const trimAfter =
    playback.loop && playback.trimEndSec !== undefined
      ? secondsToFrames(playback.trimEndSec, fps)
      : undefined;
  const gain = () => (playback.muted ? 0 : playback.volume);
  const track = (
    <Html5Audio
      src={staticFile(audio.src.replace(/^\//, ""))}
      trimBefore={trimBefore}
      trimAfter={trimAfter}
      playbackRate={playback.playbackRate === 1 ? undefined : playback.playbackRate}
      volume={gain}
      muted={playback.muted ? true : undefined}
      loop={playback.loop ? true : undefined}
    />
  );
  const durationInFrames = audioDuration(audio, playback.playbackRate, fps);

  if (startFrame <= 0 && durationInFrames === undefined) {
    return track;
  }

  return (
    <Sequence from={startFrame} durationInFrames={durationInFrames}>
      {track}
    </Sequence>
  );
};

function audioDuration(
  audio: AudioTrack,
  playbackRate: number,
  fps: number,
): number | undefined {
  const startFrame = secondsToFrames(audio.start_sec ?? 0, fps);
  let durationInFrames: number | undefined;

  if (audio.end_sec !== undefined) {
    durationInFrames = Math.max(1, secondsToFrames(audio.end_sec, fps) - startFrame);
  }

  if (audio.trim_end_sec !== undefined && !audio.loop) {
    const trimFrames = Math.max(
      1,
      secondsToFrames(
        (audio.trim_end_sec - (audio.trim_start_sec ?? 0)) / playbackRate,
        fps,
      ),
    );
    durationInFrames =
      durationInFrames === undefined ? trimFrames : Math.min(durationInFrames, trimFrames);
  }

  return durationInFrames;
}
