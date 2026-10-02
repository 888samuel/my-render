import { AbsoluteFill } from "../common/AbsoluteFill";
import { SafeArea } from "../common/SafeArea";
import { Entrance } from "../text/AnimatedText";
import { theme } from "../../styles/theme";
import type { LayerPlacement } from "../../types/common";
import type { TextAnimation } from "../../types/edit-plan";

type LowerThirdProps = {
  title: string;
  subtitle?: string;
  animation?: TextAnimation;
  placement?: LayerPlacement;
};

export const LowerThird = ({
  title,
  subtitle,
  animation,
  placement = "bottom_left",
}: LowerThirdProps) => {
  return (
    <AbsoluteFill>
      <SafeArea placement={placement}>
        <Entrance animation={animation}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: theme.spacing.xs,
              maxWidth: 980,
            }}
          >
            <div
              style={{
                width: 64,
                height: 4,
                backgroundColor: theme.colors.accent,
                marginBottom: theme.spacing.xs,
              }}
            />
            <div
              style={{
                color: theme.colors.text,
                fontFamily: theme.fonts.display,
                fontSize: theme.fontSize.statement,
                fontWeight: 600,
                letterSpacing: "-0.01em",
                lineHeight: 1.25,
                textShadow: "0 2px 12px rgba(0,0,0,0.55)",
                whiteSpace: "pre-line",
              }}
            >
              {title}
            </div>
            {subtitle ? (
              <div
                style={{
                  color: theme.colors.textMuted,
                  fontFamily: theme.fonts.body,
                  fontSize: theme.fontSize.caption,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {subtitle}
              </div>
            ) : null}
          </div>
        </Entrance>
      </SafeArea>
    </AbsoluteFill>
  );
};

type ChapterCardProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  animation?: TextAnimation;
};

export const ChapterCard = ({
  eyebrow,
  title,
  subtitle,
  animation,
}: ChapterCardProps) => {
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, rgba(6,7,10,0.55) 0%, rgba(6,7,10,0.72) 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Entrance animation={animation}>
        <div
          style={{
            textAlign: "center",
            maxWidth: 1400,
            padding: theme.spacing.lg,
          }}
        >
          {eyebrow ? (
            <div
              style={{
                color: theme.colors.accent,
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSize.caption,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                marginBottom: theme.spacing.md,
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <div
            style={{
              color: theme.colors.text,
              fontFamily: theme.fonts.display,
              fontSize: theme.fontSize.title,
              fontWeight: 500,
              lineHeight: 1.2,
              whiteSpace: "pre-line",
            }}
          >
            {title}
          </div>
          {subtitle ? (
            <div
              style={{
                color: theme.colors.textMuted,
                fontFamily: theme.fonts.body,
                fontSize: theme.fontSize.body,
                marginTop: theme.spacing.md,
                lineHeight: 1.35,
                whiteSpace: "pre-line",
              }}
            >
              {subtitle}
            </div>
          ) : null}
        </div>
      </Entrance>
    </AbsoluteFill>
  );
};
