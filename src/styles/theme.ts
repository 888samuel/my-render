export const theme = {
  colors: {
    background: "#0B0C10",
    surface: "#14161C",
    text: "#F3EFE6",
    textMuted: "#A8A29A",
    accent: "#C4A574",
    overlay: "rgba(6, 7, 10, 0.28)",
    overlayBottom: "rgba(6, 7, 10, 0.72)",
  },
  fonts: {
    display:
      '"Noto Sans Ethiopic", Ebrima, Nyala, Georgia, "Times New Roman", serif',
    body: '"Noto Sans Ethiopic", Ebrima, Inter, "Segoe UI", system-ui, sans-serif',
  },
  fontSize: {
    title: 72,
    statement: 46,
    body: 34,
    list: 40,
    caption: 22,
  },
  spacing: {
    xs: 8,
    sm: 16,
    md: 32,
    lg: 64,
    xl: 96,
  },
  layout: {
    safeMargin: 96,
  },
  animation: {
    entranceSec: 0.7,
    exitSec: 0.45,
    staggerSec: 0.7,
    wordStaggerSec: 0.08,
    transitionSec: 0.5,
  },
} as const;
