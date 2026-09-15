import { AbsoluteFill } from "../common/AbsoluteFill";
import { SafeArea } from "../common/SafeArea";
import { RevealText } from "./AnimatedText";
import { theme } from "../../styles/theme";
import type { LayerPlacement } from "../../types/common";
import type { TextAnimation } from "../../types/edit-plan";

type TitleProps = {
  text: string;
  animation?: TextAnimation;
  placement?: LayerPlacement;
  variant?: "title" | "statement";
};

export const Title = ({
  text,
  animation,
  placement = "center",
  variant = "title",
}: TitleProps) => {
  const fontSize =
    variant === "statement" ? theme.fontSize.statement : theme.fontSize.title;

  return (
    <AbsoluteFill>
      <SafeArea placement={placement}>
        <RevealText
          text={text}
          animation={animation}
          align={placement === "left" || placement === "lower_third" ? "left" : "center"}
          style={{
            color: theme.colors.text,
            fontFamily: theme.fonts.display,
            fontSize,
            fontWeight: 500,
            fontStyle: variant === "statement" ? "italic" : "normal",
            letterSpacing: variant === "statement" ? "0.01em" : "-0.03em",
            lineHeight: 1.18,
            maxWidth: variant === "statement" ? 1200 : 1400,
          }}
        />
      </SafeArea>
    </AbsoluteFill>
  );
};
