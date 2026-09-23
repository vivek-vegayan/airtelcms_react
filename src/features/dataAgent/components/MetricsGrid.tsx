import { Box, Paper, Typography, useTheme } from "@mui/material";
import { abbreviateNumber } from "../utils/formatNumber";
import type { WidgetData } from "../types/dataAgent.types";

export default function MetricsGrid({ data }: { data: WidgetData }) {
  const theme = useTheme();
  const row = data.rows[0] ?? {};
  const metrics = data.columns.map((col) => ({ label: col, value: row[col] }));

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(metrics.length, 3) || 1}, 1fr)`,
        gap: 1,
      }}
    >
      {metrics.map((m) => {
        const num = Number(m.value);
        const display =
          m.value == null ? "—" : !Number.isNaN(num) ? abbreviateNumber(num) : String(m.value);
        return (
          <Paper key={m.label} variant="outlined" sx={{ p: 1.5, bgcolor: theme.palette.background.default }}>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
              {m.label}
            </Typography>
            <Typography variant="h6" fontWeight={600} noWrap>
              {display}
            </Typography>
          </Paper>
        );
      })}
    </Box>
  );
}
