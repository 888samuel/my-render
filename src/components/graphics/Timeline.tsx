type TimelineProps = {
  eventCount: number;
};

export const Timeline = ({ eventCount }: TimelineProps) => {
  throw new Error(
    `ERROR:\nTimeline graphics are not implemented yet (${String(eventCount)} events).`,
  );
};
