import "./index.css";
import { Composition } from "remotion";
import type { CalculateMetadataFunction } from "remotion";
import { VideoComposition } from "./Composition";
import { getVideoDurationSeconds } from "./engine/Timeline";
import { secondsToFrames } from "./utils/time";
import type { EditPlan } from "./types/edit-plan";
import editPlanJson from "./data/edit-plan.json";

const editPlan = editPlanJson as EditPlan;

const calculateMetadata: CalculateMetadataFunction<{
  editPlan: EditPlan;
}> = ({ props }) => {
  const plan = props.editPlan;
  const fps = plan.video.fps;

  return {
    fps,
    width: plan.video.width,
    height: plan.video.height,
    durationInFrames: secondsToFrames(getVideoDurationSeconds(plan), fps),
  };
};

export const RemotionRoot = () => {
  return (
    <Composition
      id="VideoComposition"
      component={VideoComposition}
      durationInFrames={150}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ editPlan }}
      calculateMetadata={calculateMetadata}
    />
  );
};
