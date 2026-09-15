type FlowDiagramProps = {
  stepCount: number;
};

export const FlowDiagram = ({ stepCount }: FlowDiagramProps) => {
  throw new Error(
    `ERROR:\nFlow diagrams are not implemented yet (${String(stepCount)} steps).`,
  );
};
