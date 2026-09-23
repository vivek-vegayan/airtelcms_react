import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useTabColorTokens } from "../../../style/theme";
import { StatCard } from "../../dashboard/components/StatCard";
import type { StatCardConfig, ToneKey } from "../../dashboard/types/dashboard.types";
import type { CRQKpiSummaryDto } from "../types/crqAnalytics.types";
import { formatTrend } from "../utils/formatters";

const slaTone = (score: number | null): ToneKey => (score == null ? "info" : score >= 90 ? "success" : score >= 75 ? "warning" : "danger");

export type ExpandableKpiKey = "total" | "open" | "rejected" | "sla";
const EXPANDABLE_KEYS: ExpandableKpiKey[] = ["total", "open", "rejected", "sla"];

interface Props {
  kpi: CRQKpiSummaryDto;
  activeKey: ExpandableKpiKey | null;
  onCardClick: (key: ExpandableKpiKey) => void;
}

/** "Closed" is a plain stat, not expandable — matches the old dashboard's
 * behavior where clicking Total/Open/Rejected/SLA toggled a breakdown panel
 * below, but Closed had nothing to expand into. */
export function KpiCardsRow({ kpi, activeKey, onCardClick }: Props) {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);

  const cards: StatCardConfig[] = [
    {
      key: "total",
      label: "Total CRQ",
      display: kpi.totalCrq ?? "—",
      sub: "In selected range",
      tone: "accent",
      icon: "event",
      delta: formatTrend(kpi.totalTrendPct) ?? undefined,
    },
    {
      key: "open",
      label: "Open CRQ",
      display: kpi.openCrq ?? "—",
      sub: "Currently active",
      tone: "info",
      icon: "clock",
      delta: formatTrend(kpi.openTrendPct) ?? undefined,
    },
    {
      key: "closed",
      label: "Closed CRQ",
      display: kpi.closedCrq ?? "—",
      sub: "Completed",
      tone: "success",
      icon: "trending",
      delta: formatTrend(kpi.closedTrendPct) ?? undefined,
    },
    {
      key: "rejected",
      label: "Rejected",
      display: kpi.rejected ?? "—",
      sub: "Rejected / cancelled",
      tone: "danger",
      icon: "calendar",
      delta: formatTrend(kpi.rejectedTrendPct) ?? undefined,
    },
    {
      key: "sla",
      label: "SLA Score",
      display: kpi.slaScore != null ? `${kpi.slaScore.toFixed(1)}%` : "—",
      sub: "Overall compliance",
      tone: slaTone(kpi.slaScore),
      icon: "trending",
      delta: formatTrend(kpi.slaTrendPct) ?? undefined,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" },
        gap: "14px",
      }}
    >
      {cards.map((c) => {
        const expandable = EXPANDABLE_KEYS.includes(c.key as ExpandableKpiKey);
        const isActive = activeKey === c.key;
        return (
          <Box
            key={c.key}
            role={expandable ? "button" : undefined}
            tabIndex={expandable ? 0 : undefined}
            onClick={expandable ? () => onCardClick(c.key as ExpandableKpiKey) : undefined}
            onKeyDown={expandable ? (e) => e.key === "Enter" && onCardClick(c.key as ExpandableKpiKey) : undefined}
            sx={{
              cursor: expandable ? "pointer" : "default",
              outline: isActive ? `2px solid ${theme.palette.primary.main}` : "none",
              outlineOffset: 2,
              borderRadius: "14px",
              transition: "outline-color .2s",
            }}
          >
            <StatCard config={c} colors={colors} />
          </Box>
        );
      })}
    </Box>
  );
}
