import { Box, useTheme } from "@mui/material";
import { useTabColorTokens } from "../../../../../style/theme";
import { StatCard } from "../../../../dashboard/components/StatCard";
import type { StatCardConfig } from "../../../../dashboard/types/dashboard.types";
import type { CancelledCrqSummary } from "../../../types/cancelledCrq.types";
import { stageLabel } from "../cancelledCrqFormat";

interface Props {
  summary?: CancelledCrqSummary;
  loading: boolean;
}

/**
 * Headline counters above the register, drawn with the same StatCard the
 * analytics dashboard uses so both screens share one tile style.
 *
 * These come from GET /crqworkflow/cancelled/summary rather than being
 * derived from the rows on screen: the table is server-paged, so a client
 * side count would only ever describe the current page and would silently
 * contradict the "Total cancelled" the user is reading it as.
 */
export const CancelledCrqStats = ({ summary, loading }: Props) => {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);

  // "—" while loading so the tiles keep their size instead of flashing 0.
  const num = (v: number | null | undefined) => (loading ? "—" : v ?? 0);

  const cards: StatCardConfig[] = [
    {
      key: "total",
      label: "Total cancelled",
      display: num(summary?.totalCancelled),
      sub: "Across every stage",
      tone: "danger",
      icon: "calendar",
    },
    {
      key: "last30",
      label: "Last 30 days",
      display: num(summary?.cancelledLast30Days),
      sub: "Rolling window",
      tone: "warning",
      icon: "clock",
    },
    {
      key: "month",
      label: "This month",
      display: num(summary?.cancelledThisMonth),
      sub: "Since the 1st",
      tone: "info",
      icon: "event",
    },
    {
      key: "domains",
      label: "Domains affected",
      display: num(summary?.affectedDomains),
      sub: "Distinct domains",
      tone: "accent",
      icon: "trending",
    },
    {
      key: "topStage",
      label: "Top stage",
      display: !loading && summary?.topStage ? stageLabel(summary.topStage) : "—",
      sub: summary?.topStage ? `${summary.topStageCount ?? 0} cancelled here` : "No data",
      tone: "accent",
      icon: "trending",
    },
    {
      key: "topReason",
      label: "Top reason",
      display: !loading && summary?.topReason ? summary.topReason : "—",
      sub: summary?.topReason ? `${summary.topReasonCount ?? 0} times` : "No data",
      tone: "danger",
      icon: "calendar",
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" },
        gap: "8px",
      }}
    >
      {/* Extra-small tiles: the register table is the focus of this page. */}
      {cards.map((c) => (
        <StatCard key={c.key} config={c} colors={colors} size="xs" />
      ))}
    </Box>
  );
};

export default CancelledCrqStats;
