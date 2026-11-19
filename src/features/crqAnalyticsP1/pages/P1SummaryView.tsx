import { Box } from "@mui/material";
import { useGetP1BreakdownQuery, useGetP1SummaryQuery } from "../api/crqAnalyticsP1Api";
import { Section } from "../components/P1Bits";
import { useP1 } from "../hooks/useP1Context";
import { DailyStatusCard, ExecutiveCard, KeyNumbersCard, PeriodCard } from "./summary/OverviewCards";
import { CancelGeoCard, CancelMonthCard, CancelSideCard, CancelWhereCard, CancelWhyCard, FlowCard, InOutCard } from "./summary/FlowStopCards";
import { CircleTeamCard, DayNightCard, GeoStatusCard, RescheduleMonthCard, RescheduleReasonCard, Trend7Card } from "./summary/BreakdownCards";

const SECTIONS = [
  { id: "p1-sec-over", label: "Overview" },
  { id: "p1-sec-geo", label: "Circle & region" },
  { id: "p1-sec-flow", label: "Flow" },
  { id: "p1-sec-dn", label: "Day / Night" },
  { id: "p1-sec-rs", label: "Reschedules" },
  { id: "p1-sec-canc", label: "Cancelled & rejected" },
];

/** Summary: how CRQs ended (CRQ_AN_SP_P1_RESULTS + CRQ_AN_SP_P1_BREAKDOWN, each its own endpoint). */
export default function P1SummaryView() {
  const { f, months, colors } = useP1();
  const t = colors.tokens;
  const args = { ...f.filterParams, from: f.range.from, to: f.range.to, months };
  const overview = useGetP1SummaryQuery(args);
  const breakdown = useGetP1BreakdownQuery(args);
  const r = { data: overview.data, loading: overview.isFetching && !overview.data, error: overview.isError };
  const b = { data: breakdown.data, loading: breakdown.isFetching && !breakdown.data, error: breakdown.isError };

  return (
    <>
      <Box
        component="nav"
        aria-label="Jump to section"
        sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, p: "8px 14px", borderRadius: "12px", border: `1px solid ${t.border}`, background: t.surface }}
      >
        <Box sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: t.textSecondary, mr: 0.75 }}>Jump to</Box>
        {SECTIONS.map((s) => (
          <Box
            key={s.id}
            component="button"
            type="button"
            onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" })}
            sx={{
              all: "unset",
              cursor: "pointer",
              fontSize: 12,
              px: "10px",
              py: "4px",
              borderRadius: t.radiusPill,
              border: `1px solid ${t.border}`,
              color: t.textPrimary,
              "&:hover": { borderColor: t.accent, color: t.accent },
              "&:focus-visible": { outline: `2px solid ${t.accent}` },
            }}
          >
            {s.label}
          </Box>
        ))}
      </Box>

      <Section id="p1-sec-over" title="Overview" />
      <ExecutiveCard {...r} />
      <KeyNumbersCard {...r} />
      <Trend7Card {...b} />
      <PeriodCard {...r} />
      <DailyStatusCard {...r} />

      <Section id="p1-sec-geo" title="Circle & region" />
      <GeoStatusCard {...b} />
      <CircleTeamCard {...b} />

      <Section id="p1-sec-flow" title="Flow" />
      <FlowCard {...r} />
      <InOutCard {...r} />

      <Section id="p1-sec-dn" title="Day / Night" />
      <DayNightCard {...b} />

      <Section id="p1-sec-rs" title="Reschedules" />
      <RescheduleMonthCard {...b} />
      <RescheduleReasonCard {...b} />

      <Section id="p1-sec-canc" title="Cancelled & rejected" />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "repeat(2, minmax(0,1fr))" }, gap: 2, alignItems: "start" }}>
        <CancelSideCard {...r} />
        <CancelMonthCard {...r} />
      </Box>
      <CancelWhyCard {...r} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0,1fr)", lg: "repeat(2, minmax(0,1fr))" }, gap: 2, alignItems: "start" }}>
        <CancelWhereCard {...r} />
        <CancelGeoCard
          circles={overview.data?.stopByCircle}
          regions={breakdown.data?.stopByRegion}
          loading={r.loading || b.loading}
          error={r.error || b.error}
        />
      </Box>
    </>
  );
}
