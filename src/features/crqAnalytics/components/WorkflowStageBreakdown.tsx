import { Box, Chip, Typography, useTheme } from "@mui/material";
import type { CRQWorkflowStageDto } from "../types/crqAnalytics.types";

interface Props {
  stages: CRQWorkflowStageDto[];
  mode: "total" | "open";
  onStageClick: (stage: string) => void;
}

/** Grid of per-stage cards (count, % of total, progress bar) — mirrors the old
 * dashboard's Total/Open KPI expand panel. Not a chart component because the
 * old design wasn't a chart here, it was clickable stat cards. */
export function WorkflowStageBreakdown({ stages, mode, onStageClick }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const data = stages.map((s) => ({ name: s.stage, count: mode === "total" ? s.totalCount : s.openCount }));
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((a, b) => a + b.count, 0) || 1;

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", mb: 1.5 }}>
        <Chip
          label={`${total} across ${data.length} stages`}
          size="small"
          sx={{ fontSize: 10, fontWeight: 600, bgcolor: `${theme.palette.primary.main}18`, color: theme.palette.primary.main }}
        />
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(155px,1fr))", gap: 1.5 }}>
        {data.map((s) => {
          const pct = Math.round((s.count / total) * 100);
          const ratio = s.count / maxVal;
          const barColor = ratio >= 0.75 ? theme.palette.error.main : ratio >= 0.5 ? theme.palette.warning.main : theme.palette.info.main;
          const isMax = s.count === maxVal;
          return (
            <Box
              key={s.name}
              onClick={() => onStageClick(s.name)}
              sx={{
                bgcolor: isDark ? "rgba(255,255,255,0.03)" : "background.paper",
                borderRadius: 2,
                p: 1.5,
                position: "relative",
                cursor: "pointer",
                border: `1px solid ${isMax ? barColor : theme.palette.divider}`,
                transition: "all 0.15s",
                "&:hover": { transform: "translateY(-2px)", boxShadow: `0 6px 20px ${barColor}25` },
              }}
            >
              {isMax && (
                <Box sx={{ position: "absolute", top: 6, right: 6, fontSize: 8, color: theme.palette.error.main, bgcolor: `${theme.palette.error.main}1F`, borderRadius: 0.5, px: 0.6, py: 0.1, fontWeight: 700 }}>
                  MAX
                </Box>
              )}
              <Typography sx={{ fontSize: 10, color: "text.secondary", mb: 0.8, lineHeight: 1.4, pr: isMax ? 4 : 0 }}>{s.name}</Typography>
              <Typography sx={{ fontSize: 22, fontWeight: 800, color: "text.primary", lineHeight: 1 }}>{s.count}</Typography>
              <Typography sx={{ fontSize: 10, color: "text.secondary", mb: 1 }}>{pct}% of total</Typography>
              <Box sx={{ height: 4, bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", borderRadius: 2, overflow: "hidden" }}>
                <Box sx={{ width: `${pct}%`, height: "100%", bgcolor: barColor, borderRadius: 2 }} />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
