import { Box, Typography, useTheme } from "@mui/material";
import { PieChartCard } from "./PieChartCard";
import type { CRQRejectionReasonDto } from "../types/crqAnalytics.types";

interface Props {
  reasons: CRQRejectionReasonDto[];
  isLoading?: boolean;
  onReasonClick: (reason: string) => void;
}

/** Pie chart + full clickable reason list side by side — mirrors the old
 * dashboard's rejection panel (chart for the top slices, list for everything). */
export function RejectionReasonsPanel({ reasons, isLoading, onReasonClick }: Props) {
  const theme = useTheme();
  const sorted = [...reasons].sort((a, b) => b.count - a.count);

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" }, gap: 2 }}>
      <Box sx={{ height: 260 }}>
        <PieChartCard
          slices={sorted.map((r) => ({ label: r.reason, value: r.count }))}
          isLoading={isLoading}
          onSliceClick={onReasonClick}
        />
      </Box>
      <Box
        sx={{
          borderRadius: 2,
          border: `1px solid ${theme.palette.divider}`,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: 260,
        }}
      >
        <Box sx={{ px: 1.5, py: 1, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.action.hover }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700 }}>All Reasons</Typography>
        </Box>
        <Box sx={{ overflowY: "auto", flex: 1 }}>
          {sorted.map((r, i) => (
            <Box
              key={r.reason}
              onClick={() => onReasonClick(r.reason)}
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                px: 1.5,
                py: 1,
                cursor: "pointer",
                borderBottom: `1px solid ${theme.palette.divider}`,
                "&:hover": { bgcolor: theme.palette.action.hover },
              }}
            >
              <Typography sx={{ fontSize: 10.5, color: "text.secondary", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {i + 1}. {r.reason}
              </Typography>
              <Typography sx={{ fontSize: 10.5, fontWeight: 700 }}>
                {r.count} ({r.pct.toFixed(0)}%)
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
