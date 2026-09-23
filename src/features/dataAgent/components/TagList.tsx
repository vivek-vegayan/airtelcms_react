import { Box, Chip, Typography, alpha, useTheme } from "@mui/material";
import { categoricalPalette } from "../../crqAnalytics/utils/chartPalette";
import type { WidgetData } from "../types/dataAgent.types";

export default function TagList({ data }: { data: WidgetData }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const palette = categoricalPalette(isDark);
  const col = data.columns[0];
  const values = data.rows.map((r) => String(r[col]));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {values.length} items
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
        {values.map((val, i) => {
          const color = palette[i % palette.length];
          return (
            <Chip
              key={`${val}-${i}`}
              label={val}
              size="small"
              sx={{
                bgcolor: alpha(color, isDark ? 0.22 : 0.12),
                color,
                fontWeight: 500,
                border: `1px solid ${alpha(color, isDark ? 0.35 : 0.25)}`,
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
