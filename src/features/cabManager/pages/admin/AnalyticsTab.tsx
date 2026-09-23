import { Box, Paper, Skeleton, Typography } from "@mui/material";
import { useGetAdminAnalyticsQuery } from "../../api/cabManagerApiSlice";

const LEVEL_COLOR: Record<"low" | "mid" | "high", { bg: string; fg: string; label: string }> = {
  low:  { bg: "#E8F5E9", fg: "#2E7D32", label: "Healthy" },
  mid:  { bg: "#FFF4E5", fg: "#ED6C02", label: "Watch"   },
  high: { bg: "#FDECEA", fg: "#D32F2F", label: "Critical" },
};

export function AdminAnalyticsTab() {
  const { data, isLoading } = useGetAdminAnalyticsQuery();

  if (isLoading || !data) {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={96} />)}
      </Box>
    );
  }

  const tiles = [
    { label: "Total CRQs",       value: data.total,     color: "text.primary" },
    { label: "Approved",         value: data.approved,  color: "#2E7D32" },
    { label: "Rejected",         value: data.rejected,  color: "#C62828" },
    { label: "SLA breach risk",  value: data.breachRisk, color: "#ED6C02" },
  ];

  return (
    <Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, mb: 3 }}>
        {tiles.map((t) => (
          <Paper key={t.label} sx={{ p: 2.5, border: "1px solid", borderColor: "divider" }} elevation={0}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>{t.label}</Typography>
            <Typography sx={{ fontSize: 28, fontWeight: 400, color: t.color, mt: 1 }}>{t.value}</Typography>
          </Paper>
        ))}
      </Box>

      <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }} elevation={0}>
        <Typography sx={{ fontWeight: 500, mb: 2 }}>SLA Breach Heatmap — by domain</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1.5 }}>
          {data.heat.map((h) => {
            const c = LEVEL_COLOR[h.level];
            return (
              <Paper key={h.domain} sx={{ p: 2, bgcolor: c.bg, textAlign: "center", border: "1px solid", borderColor: "divider" }} elevation={0}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{h.domain}</Typography>
                <Typography sx={{ fontSize: 26, color: c.fg, fontFamily: "'Roboto Mono', monospace", my: 1 }}>{h.breach}/{h.total}</Typography>
                <Typography variant="caption" sx={{ color: c.fg, fontWeight: 500 }}>{c.label}</Typography>
              </Paper>
            );
          })}
        </Box>
      </Paper>
    </Box>
  );
}
