import { Box, Skeleton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTabColorTokens } from "../../../style/theme";
import { StatCard } from "../../dashboard/components/StatCard";
import type { StatCardConfig } from "../../dashboard/types/dashboard.types";
import type { ReassignStats as Stats } from "../types/crqReassign.types";

interface Props {
  stats?: Stats;
  loading: boolean;
  batchId: string | null;
}

/** Header numbers from CRQ_SP_REASSIGN_STATS, in the same StatCard row as the Analytics dashboard. */
export const ReassignStats = ({ stats, loading, batchId }: Props) => {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);
  const n = (v: number | null | undefined) => v ?? 0;

  const cards: StatCardConfig[] = [
    { key: "queue", label: "CRQs in Queue", display: n(stats?.crq_in_queue), sub: "Open CRQs", tone: "accent", icon: "event" },
    { key: "gaps", label: "Unassigned Stages", display: n(stats?.unassigned_stages), sub: "Across all open CRQs", tone: "danger", icon: "clock" },
    { key: "cab", label: "CAB Pending", display: n(stats?.cab_pending), sub: "Awaiting CAB decision", tone: "warning", icon: "calendar" },
    {
      key: "span",
      label: "Span 2 Dates",
      display: n(stats?.crq_spanning_2_dates),
      sub: "Confirmed runs past midnight",
      tone: "info",
      icon: "calendar",
    },
    {
      key: "publish",
      label: "Pending Publish",
      display: n(stats?.pending_publish),
      sub: batchId ? "In this draft batch" : "In all open batches",
      tone: "success",
      icon: "trending",
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" },
        gap: "10px",
      }}
    >
      {cards.map((c) =>
        loading ? (
          <Skeleton key={c.key} variant="rounded" height={72} sx={{ borderRadius: "10px" }} />
        ) : (
          <StatCard key={c.key} config={c} colors={colors} size="small" />
        ),
      )}
    </Box>
  );
};

export default ReassignStats;
