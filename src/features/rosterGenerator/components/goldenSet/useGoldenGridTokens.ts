import { alpha, type Theme } from "@mui/material";
import type { GoldenGridTokens } from "./goldenGrid.types";

export function useGoldenGridTokens(theme: Theme): GoldenGridTokens {
  const isDark = theme.palette.mode === "dark";
  return {
    isDark,
    accent: theme.palette.primary.main,
    accentDim: alpha(theme.palette.primary.main, 0.08),
    accentBorder: alpha(theme.palette.primary.main, 0.35),
    success: theme.palette.success.main,
    successDim: alpha(theme.palette.success.main, 0.08),
    textPrimary: theme.palette.text.primary,
    textSecondary: theme.palette.text.secondary,
    textDim: alpha(theme.palette.text.secondary, 0.6),
    border: theme.palette.divider,
    surface: theme.palette.background.paper,
    surface2: isDark ? "rgba(255,255,255,0.04)" : "rgba(13,27,42,0.028)",
    bg: theme.palette.background.default,
    radius: "8px",
    radiusL: "12px",
    radiusXL: "16px",
  };
}
