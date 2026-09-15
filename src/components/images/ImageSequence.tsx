type ImageSequenceProps = {
  assetId: string;
};

export const ImageSequence = ({ assetId }: ImageSequenceProps) => {
  throw new Error(
    `ERROR:\nImage sequences are not implemented yet (asset_id: "${assetId}").`,
  );
};
