import type { CSSProperties } from "react";
import { useCurrentFrame } from "remotion";
import type { VideoLook } from "../../types/common";
import { letterboxFraction } from "../../engine/artisticLook";

type ArtisticLookProps = {
  look: VideoLook;
};

/**
 * Grain, washes, scanlines, and letterbox sitting on top of a graded picture.
 * The picture's own filter lives on its wrapper, so titles above this stay clean.
 */
export const ArtisticLook = ({ look }: ArtisticLookProps) => {
  const frame = useCurrentFrame();

  if (look === "none") {
    return null;
  }

  const bars = letterboxFraction(look);
  const grain = grainOpacity(look);
  const step = Math.floor(frame / 2);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <Wash look={look} />
      {grain > 0 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: grain,
            mixBlendMode: "overlay",
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.55) 0.6px, transparent 0.7px), radial-gradient(rgba(0,0,0,0.55) 0.6px, transparent 0.7px)",
            backgroundSize: "3px 3px, 5px 5px",
            backgroundPosition: `${String((step * 3) % 7)}px ${String((step * 5) % 7)}px, ${String((step * 2) % 5)}px ${String((step * 4) % 6)}px`,
          }}
        />
      ) : null}
      {look === "vhs" ? <VhsTexture frame={frame} /> : null}
      {bars > 0 ? (
        <>
          <div style={barStyle("top", bars)} />
          <div style={barStyle("bottom", bars)} />
        </>
      ) : null}
    </div>
  );
};

const Wash = ({ look }: { look: VideoLook }) => {
  const style = washStyle(look);
  if (!style) {
    return null;
  }

  return <div style={{ position: "absolute", inset: 0, ...style }} />;
};

function washStyle(look: VideoLook): CSSProperties | null {
  switch (look) {
    case "none":
      return null;
    case "cinema":
      return {
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,0) 42%, rgba(8,16,28,0.5) 100%)",
      };
    case "film":
      return {
        background:
          "radial-gradient(ellipse at center, rgba(170,110,40,0.16) 0%, rgba(20,8,0,0.42) 100%)",
      };
    case "noir":
      return {
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,0) 28%, rgba(0,0,0,0.72) 100%)",
      };
    case "golden":
      return {
        background:
          "radial-gradient(ellipse at 50% 42%, rgba(255,196,90,0.42), rgba(120,48,8,0.2) 72%)",
        mixBlendMode: "soft-light",
      };
    case "teal":
      return {
        background:
          "linear-gradient(165deg, rgba(255,150,70,0.55) 0%, rgba(0,0,0,0) 42%, rgba(0,120,130,0.62) 100%)",
        mixBlendMode: "soft-light",
      };
    case "fade":
      return {
        background: "rgba(226, 214, 196, 0.2)",
      };
    case "vhs":
      return {
        background:
          "linear-gradient(90deg, rgba(255,40,80,0.16), transparent 18%, transparent 82%, rgba(40,220,255,0.16))",
        mixBlendMode: "screen",
      };
    case "dream":
      return {
        background:
          "radial-gradient(ellipse at 50% 42%, rgba(255,255,255,0.38) 0%, rgba(190,170,230,0.16) 46%, rgba(30,20,60,0.34) 100%)",
      };
    case "ink":
      return {
        background:
          "radial-gradient(ellipse at center, rgba(0,0,0,0) 46%, rgba(0,0,0,0.55) 100%)",
      };
  }
}

function grainOpacity(look: VideoLook): number {
  switch (look) {
    case "film":
      return 0.34;
    case "fade":
      return 0.22;
    case "vhs":
      return 0.26;
    case "noir":
      return 0.16;
    case "cinema":
      return 0.12;
    case "none":
    case "golden":
    case "teal":
    case "dream":
    case "ink":
      return 0;
  }
}

const VhsTexture = ({ frame }: { frame: number }) => {
  const band = (frame * 2.4) % 100;

  return (
    <>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(to bottom, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 1px, transparent 1px, transparent 4px)",
          opacity: 0.45,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: `${String(band)}%`,
          height: 10,
          background: "rgba(255,255,255,0.22)",
        }}
      />
    </>
  );
};

function barStyle(edge: "top" | "bottom", fraction: number): CSSProperties {
  return {
    position: "absolute",
    left: 0,
    right: 0,
    [edge]: 0,
    height: `${String(fraction * 100)}%`,
    background: "#050506",
  };
}
