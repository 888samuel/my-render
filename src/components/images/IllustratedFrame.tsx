import { Img, staticFile } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { ImageMotion } from "./ImageMotion";
import { theme } from "../../styles/theme";
import type { ImageFit, ImageOverlay } from "../../types/common";
import type { Motion } from "../../types/edit-plan";

type IllustratedFrameProps = {
  src: string;
  durationInFrames: number;
  fit?: ImageFit;
  motion?: Motion;
  overlay?: ImageOverlay;
  opacity?: number;
  zIndex?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export const IllustratedFrame = ({
  src,
  durationInFrames,
  fit = "cover",
  motion,
  overlay,
  opacity = 1,
  zIndex,
  x,
  y,
  width,
  height,
}: IllustratedFrameProps) => {
  const placed = x !== undefined || y !== undefined || width !== undefined;
  const publicSrc = staticFile(src.replace(/^\//, ""));
  const cropScale = !placed && fit === "centered_crop" ? 1.18 : 1;

  const image = (
    <Img
      src={publicSrc}
      style={
        placed
          ? {
              display: "block",
              width: "100%",
              height: height !== undefined ? "100%" : "auto",
              objectFit: "contain",
            }
          : {
              width: "100%",
              height: "100%",
              objectFit: fit === "contain" ? "contain" : "cover",
              objectPosition: "center center",
            }
      }
    />
  );

  const moving = (
    <ImageMotion
      motion={motion}
      durationInFrames={durationInFrames}
      fill={!placed}
      opacity={opacity}
    >
      {placed ? (
        image
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${String(cropScale)})`,
          }}
        >
          {image}
        </div>
      )}
    </ImageMotion>
  );

  if (!placed) {
    return (
      <AbsoluteFill
        style={{
          overflow: "hidden",
          backgroundColor: theme.colors.background,
          zIndex,
        }}
      >
        {moving}
        {overlay === "dark_gradient" ? <DarkGradient /> : null}
      </AbsoluteFill>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        left: `${String(x ?? 50)}%`,
        top: `${String(y ?? 58)}%`,
        width: `${String(width ?? 32)}%`,
        height: height !== undefined ? `${String(height)}%` : undefined,
        transform: "translate(-50%, -50%)",
        zIndex,
      }}
    >
      {moving}
    </div>
  );
};

const DarkGradient = () => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${theme.colors.overlay} 0%, rgba(6, 7, 10, 0.18) 38%, ${theme.colors.overlayBottom} 100%)`,
      }}
    />
  );
};
