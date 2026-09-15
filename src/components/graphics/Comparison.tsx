type ComparisonProps = {
  leftTitle: string;
  rightTitle: string;
};

export const Comparison = ({ leftTitle, rightTitle }: ComparisonProps) => {
  throw new Error(
    `ERROR:\nComparison graphics are not implemented yet (${leftTitle} / ${rightTitle}).`,
  );
};
