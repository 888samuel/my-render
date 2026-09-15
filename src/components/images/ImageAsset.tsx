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
  const relativePath = layer.src ?? resolveLayerAsset(layer);
  const src = staticFile(relativePath.replace(/^\//, ""));
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

const resolveLayerAsset = (layer: ImageLayer): string => {
  if (layer.asset_id) {
    return resolveAsset(layer.asset_id);
  }

  throw new Error("ERROR:\nImage layer is missing asset_id or src.");
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
