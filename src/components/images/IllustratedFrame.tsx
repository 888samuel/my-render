import type { CSSProperties, ReactNode } from "react";
import { Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { ArtisticLook } from "../video/ArtisticLook";
import { lookPictureStyle, normalizeLook } from "../../engine/artisticLook";
import { useInheritedLook } from "../../engine/LookContext";
import { ImageMotion } from "./ImageMotion";
import { theme } from "../../styles/theme";
import { lerpFrames } from "../../utils/interpolate";
import { secondsToFrames } from "../../utils/time";
import type { ImageFit, ImageOverlay } from "../../types/common";
import type { Motion } from "../../types/edit-plan";

type IllustratedFrameProps = {
  src?: string;
  /** Replaces the still. Used for video frames that share this crop and grade. */
  media?: ReactNode;
  durationInFrames: number;
  fit?: ImageFit;
  motion?: Motion;
  overlay?: ImageOverlay;
  /** Omit to use the shot grade. "none" leaves this picture clean. */
  look?: string;
  opacity?: number;
  zIndex?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export const IllustratedFrame = ({
  src,
  media,
  durationInFrames,
  fit = "cover",
  motion,
  overlay,
  look: lookProp,
  opacity = 1,
  zIndex,
  x,
  y,
  width,
  height,
}: IllustratedFrameProps) => {
  const frame = useCurrentFrame();
  const inherited = useInheritedLook();
  const look = lookProp !== undefined ? normalizeLook(lookProp) : inherited;
  const placed = x !== undefined || y !== undefined || width !== undefined;
  const cropScale = !placed && fit === "centered_crop" ? 1.18 : 1;

  if (!media && !src) {
    throw new Error("ERROR:\nFrame is missing a picture.");
  }

  const image = media ?? (
    <Img
      src={staticFile((src ?? "").replace(/^\//, ""))}
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

  const picture = (
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
  const moving =
    look === "none" ? (
      picture
    ) : (
      <div
        style={{
          width: "100%",
          height: placed ? "auto" : "100%",
          ...lookPictureStyle(look, frame),
        }}
      >
        {picture}
      </div>
    );
  const grade = look === "none" ? null : <ArtisticLook look={look} />;

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
        {grade}
        <FrameGrade overlay={overlay} />
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
      {grade}
    </div>
  );
};

const ReadabilityScrim = () => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${theme.colors.overlay} 0%, rgba(6, 7, 10, 0.1) 40%, ${theme.colors.overlayBottom} 100%)`,
      }}
    />
  );
};

const FrameGrade = ({ overlay }: { overlay?: ImageOverlay }) => {
  if (!overlay || overlay === "none") {
    return null;
  }

  if (overlay === "dark_gradient") {
    return (
      <AbsoluteFill
        style={{
          background: `linear-gradient(180deg, ${theme.colors.overlay} 0%, rgba(6, 7, 10, 0.18) 38%, ${theme.colors.overlayBottom} 100%)`,
        }}
      />
    );
  }

  if (overlay === "spotlight") {
    return (
      <>
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at 50% 40%, rgba(6,7,10,0.02) 0%, rgba(6,7,10,0.2) 46%, rgba(6,7,10,0.72) 100%)",
          }}
        />
        <ReadabilityScrim />
      </>
    );
  }

  const warm = overlay === "warm";

  return (
    <>
      <AbsoluteFill
        style={{
          background: warm
            ? "radial-gradient(ellipse at center, rgba(140, 86, 32, 0.2) 0%, rgba(6,7,10,0.08) 42%, rgba(6,7,10,0.62) 100%)"
            : "radial-gradient(ellipse at center, rgba(6,7,10,0) 36%, rgba(6,7,10,0.55) 100%)",
        }}
      />
      <ReadabilityScrim />
      <CropMarks />
    </>
  );
};

const CropMarks = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = lerpFrames(frame, 0, secondsToFrames(0.7, fps), 0, 1);
  const arm = 34;
  const inset = 42;
  const edge = `1.5px solid rgba(196, 165, 116, ${String(0.75 * opacity)})`;
  const corner = (style: CSSProperties) => (
    <div
      style={{
        position: "absolute",
        width: arm,
        height: arm,
        ...style,
      }}
    />
  );

  return (
    <AbsoluteFill>
      {corner({ top: inset, left: inset, borderTop: edge, borderLeft: edge })}
      {corner({ top: inset, right: inset, borderTop: edge, borderRight: edge })}
      {corner({
        bottom: inset,
        left: inset,
        borderBottom: edge,
        borderLeft: edge,
      })}
      {corner({
        bottom: inset,
        right: inset,
        borderBottom: edge,
        borderRight: edge,
      })}
    </AbsoluteFill>
  );
};
