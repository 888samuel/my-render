import { Html5Audio, Sequence, staticFile } from "remotion";
import { AbsoluteFill } from "../components/common/AbsoluteFill";
import { ClipRenderer } from "./ClipRenderer";
import { EditPlanProvider } from "./EditPlanContext";
import { EthiopicFont } from "../styles/EthiopicFont";
import { theme } from "../styles/theme";
import { secondsToFrames } from "../utils/time";
import { validateAssets } from "../validation/validateAssets";
import { validateEditPlan } from "../validation/validateEditPlan";
import type { EditPlan } from "../types/edit-plan";

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
        {editPlan.clips.map((clip) => (
          <ClipRenderer key={clip.id} clip={clip} fps={editPlan.video.fps} />
        ))}
        {editPlan.audio ? <VoiceOver audio={editPlan.audio} fps={editPlan.video.fps} /> : null}
      </AbsoluteFill>
    </EditPlanProvider>
  );
};

const VoiceOver = ({
  audio,
  fps,
}: {
  audio: NonNullable<EditPlan["audio"]>;
  fps: number;
}) => {
  const startSec = audio.start_sec ?? 0;
  const startFrame = secondsToFrames(startSec, fps);
  const track = (
    <Html5Audio src={staticFile(audio.src.replace(/^\//, ""))} />
  );

  if (startFrame <= 0) {
    return track;
  }

  return <Sequence from={startFrame}>{track}</Sequence>;
};
