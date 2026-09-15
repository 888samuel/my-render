import { Img, staticFile } from "remotion";
import { AbsoluteFill } from "../common/AbsoluteFill";
import { ImageMotion } from "./ImageMotion";
import { resolveAsset } from "../../engine/AssetResolver";
import { theme } from "../../styles/theme";
import type { ImageLayer } from "../../types/edit-plan";

type ImageAssetProps = {
  layer: ImageLayer;
};

export const ImageAsset = ({ layer }: ImageAssetProps) => {
  const fit = layer.fit ?? "cover";
  const src = staticFile(resolveAsset(layer.asset_id));
  const cropScale = fit === "centered_crop" ? 1.18 : 1;

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: theme.colors.background }}>
      <ImageMotion motion={layer.motion}>
        <div
          style={{
            width: "100%",
            height: "100%",
            transform: `scale(${String(cropScale)})`,
          }}
        >
          <Img
            src={src}
            style={{
              width: "100%",
              height: "100%",
              objectFit: fit === "contain" ? "contain" : "cover",
              objectPosition: "center center",
            }}
          />
        </div>
      </ImageMotion>
      {layer.overlay === "dark_gradient" ? <DarkGradient /> : null}
    </AbsoluteFill>
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
