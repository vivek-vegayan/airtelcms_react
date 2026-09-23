import { Box, Typography } from "@mui/material";
import { EmptyOrErrorState } from "./EmptyOrErrorState";
import type { AgingHeatmapMode, CRQAgingBucketDto } from "../types/crqAnalytics.types";

interface Props {
  data: CRQAgingBucketDto[] | undefined;
  mode: AgingHeatmapMode;
  isLoading?: boolean;
  isError?: boolean;
}

/** <2 Days is low-risk for RECEIVED CRQs (just arrived) but high-risk for
 * SCHEDULED ones (should have moved on by now) — the color ramp reverses
 * between modes, exactly as in the old dashboard. */
const bucketColor = (bucket: string, value: number, mode: AgingHeatmapMode): string => {
  if (value === 0) return "#e5e7eb";
  const receivedRamp: Record<string, string> = {
    "<2 Days": "#22c55e",
    "2-4 Days": "#eab308",
    "4-6 Days": "#f59e0b",
    "6-8 Days": "#de6f34",
    ">8 Days": "#dc2626",
  };
  const scheduledRamp: Record<string, string> = {
    "<2 Days": "#dc2626",
    "2-4 Days": "#de6f34",
    "4-6 Days": "#f59e0b",
    "6-8 Days": "#eab308",
    ">8 Days": "#22c55e",
  };
  return (mode === "RECEIVED" ? receivedRamp : scheduledRamp)[bucket] ?? "#94a3b8";
};

export function AgingHeatmapGrid({ data, mode, isLoading, isError }: Props) {
  if (isError) return <EmptyOrErrorState kind="error" />;
  if (!isLoading && (!data || data.length === 0)) return <EmptyOrErrorState kind="empty" />;
  if (!data) return null;

  const highRisk = data.find((d) => d.bucket === ">8 Days");
  const totalHighRisk = (highRisk?.ccb ?? 0) + (highRisk?.se ?? 0);

  return (
    <Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "130px 1fr 1fr", gap: 1, mb: 0.5 }}>
        <Box />
        {["CCB", "SE"].map((col) => (
          <Typography key={col} sx={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "text.secondary", pb: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
            {col}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {data.map((row) => (
          <Box key={row.bucket} sx={{ display: "grid", gridTemplateColumns: "130px 1fr 1fr", gap: 1, alignItems: "center" }}>
            <Typography sx={{ fontSize: 11, color: "text.secondary", fontWeight: row.bucket === ">8 Days" ? 700 : 400 }}>{row.bucket}</Typography>
            {[row.ccb, row.se].map((val, i) => (
              <Box key={i} sx={{ bgcolor: bucketColor(row.bucket, val, mode), borderRadius: 1.5, py: 1, textAlign: "center" }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{val}</Typography>
              </Box>
            ))}
          </Box>
        ))}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5 }}>
        <Typography sx={{ fontSize: 10, color: "text.secondary" }}>Low</Typography>
        <Box sx={{ flex: 1, height: 6, borderRadius: 3, background: "linear-gradient(90deg,#22c55e,#84cc16,#eab308,#f59e0b,#f97316,#ef4444,#dc2626)" }} />
        <Typography sx={{ fontSize: 10, color: "text.secondary" }}>High</Typography>
      </Box>
      {totalHighRisk > 0 && (
        <Box sx={{ mt: 1.5, p: 1, bgcolor: "rgba(239,68,68,0.1)", borderRadius: 1.5, border: "1px solid rgba(239,68,68,0.25)" }}>
          <Typography sx={{ fontSize: 11, color: "#dc2626", fontWeight: 600 }}>
            High Risk CRQs (&gt;8 Days): <strong>{totalHighRisk}</strong>
          </Typography>
        </Box>
      )}
    </Box>
  );
}
