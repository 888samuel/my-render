import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";
import type { CameraMove } from "../types/edit-plan";
import { lerpFrames } from "../utils/interpolate";

export type CameraOffset = {
  translateX: number;
  translateY: number;
  scale: number;
};

const IDENTITY: CameraOffset = { translateX: 0, translateY: 0, scale: 1 };

const CameraOffsetContext = createContext<CameraOffset>(IDENTITY);

export const useCameraOffset = (): CameraOffset => useContext(CameraOffsetContext);

type CameraRigProps = {
  camera?: CameraMove;
  durationInFrames: number;
  children: ReactNode;
};

export const CameraRig = ({ camera, durationInFrames, children }: CameraRigProps) => {
  const frame = useCurrentFrame();

  return (
    <CameraOffsetContext.Provider value={sampleCamera(camera, frame, durationInFrames)}>
      {children}
    </CameraOffsetContext.Provider>
  );
};

export function sampleCamera(
  camera: CameraMove | undefined,
  frame: number,
  durationInFrames: number,
): CameraOffset {
  if (!camera) {
    return IDENTITY;
  }

  const gain = Math.min(1.6, Math.max(0, camera.intensity ?? 1));
  const end = Math.max(1, durationInFrames - 1);
  const travel = lerpFrames(frame, 0, end, 0, 1);

  switch (camera.type) {
    case "push_in":
      return { translateX: 0, translateY: 0, scale: 1 + 0.08 * gain * travel };
    case "pull_out":
      return { translateX: 0, translateY: 0, scale: 1 + 0.08 * gain * (1 - travel) };
    case "drift_left":
      return {
        translateX: lerpFrames(frame, 0, end, 3.2 * gain, -3.2 * gain),
        translateY: 0,
        scale: 1 + 0.04 * gain,
      };
    case "drift_right":
      return {
        translateX: lerpFrames(frame, 0, end, -3.2 * gain, 3.2 * gain),
        translateY: 0,
        scale: 1 + 0.04 * gain,
      };
    case "rise":
      return {
        translateX: 0,
        translateY: lerpFrames(frame, 0, end, 2.4 * gain, -2.4 * gain),
        scale: 1 + 0.03 * gain,
      };
    case "settle":
      return {
        translateX: 0,
        translateY: lerpFrames(frame, 0, end, 1.4 * gain, 0),
        scale: 1 + 0.05 * gain * (1 - travel),
      };
    default:
      return IDENTITY;
  }
}
