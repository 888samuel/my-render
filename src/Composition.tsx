import { VideoEngine } from "./engine/VideoEngine";
import type { EditPlan } from "./types/edit-plan";

export type VideoCompositionProps = {
  editPlan: EditPlan;
};

export const VideoComposition = ({ editPlan }: VideoCompositionProps) => {
  return <VideoEngine editPlan={editPlan} />;
};
