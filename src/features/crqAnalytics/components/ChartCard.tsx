import type { ReactNode } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { useTabColorTokens } from "../../../style/theme";
import { getCardSx } from "../../dashboard/constants/dashboard.styles";

interface Props {
  title: string;
  action?: ReactNode;
  /** Opens this chart's dedicated full-screen table when provided — mirrors the
   * "View All" button every chart card had in the old dashboard. */
  onViewAll?: () => void;
  /** Fixed pixel height for chart canvases; pass "auto" for content that sizes itself (tables). */
  height?: number | string;
  children: ReactNode;
}

export function ChartCard({ title, action, onViewAll, height = 300, children }: Props) {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);

  return (
    <Box sx={{ ...getCardSx(colors), p: "16px 18px", display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: colors.textPrimary }}>{title}</Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {action}
          {onViewAll && (
            <Box
              component="button"
              onClick={onViewAll}
              sx={{
                background: "none",
                border: `1px solid ${theme.palette.primary.main}55`,
                borderRadius: 1,
                cursor: "pointer",
                color: theme.palette.primary.main,
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                px: 1,
                py: 0.6,
                "&:hover": { bgcolor: `${theme.palette.primary.main}14` },
              }}
            >
              View All
            </Box>
          )}
        </Box>
      </Box>
      <Box sx={{ height, position: "relative" }}>{children}</Box>
    </Box>
  );
}
