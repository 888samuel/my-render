import type { ReactNode } from "react";
import { Fade } from "./Fade";

type CrossfadeProps = {
  children: ReactNode;
  durationSec?: number;
};

export const Crossfade = ({ children, durationSec }: CrossfadeProps) => {
  return (
    <Fade direction="in" durationSec={durationSec}>
      {children}
    </Fade>
  );
};
