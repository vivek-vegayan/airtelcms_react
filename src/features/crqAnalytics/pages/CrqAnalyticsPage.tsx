import { useState } from "react";
import { Box, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CommonContainer from "../../../components/common/CommonContainer";
import { useAnalyticsFilters } from "../hooks/useAnalyticsFilters";
import {
  useGetCrqOpenDomainQuery,
  useGetCrqRaisedVsClosedQuery,
  useGetCrqRunRateQuery,
  useGetCrqGroupBreakdownQuery,
  useGetCrqAgingHeatmapQuery,
} from "../api/crqAnalyticsApi";
import type { AgingHeatmapMode, AnalyticsNavState, GroupBreakdownDimension, TableViewConfig } from "../types/crqAnalytics.types";
import { AnalyticsFilterBar } from "../components/AnalyticsFilterBar";
import { ChartCard } from "../components/ChartCard";
import { BarChartCard } from "../components/BarChartCard";
import { RunRateChart } from "../components/RunRateChart";
import { AgingHeatmapGrid } from "../components/AgingHeatmapGrid";
import { CrqFullscreenTable } from "../components/CrqFullscreenTable";
import { CrqJourneyDetail } from "../components/CrqJourneyDetail";
import { seriesColor, categoryColor } from "../utils/chartPalette";

const GROUP_BY_OPTIONS: { value: GroupBreakdownDimension; label: string }[] = [
  { value: "region", label: "Region" },
  { value: "circle", label: "Circle" },
];

export default function CrqAnalyticsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const filterState = useAnalyticsFilters();
  const { filters } = filterState;
  const [selectedCrq, setSelectedCrq] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBreakdownDimension>("circle");
  const [heatmapMode, setHeatmapMode] = useState<AgingHeatmapMode>("RECEIVED");
  const [nav, setNav] = useState<AnalyticsNavState>({ view: "grid" });

  const openDomain = useGetCrqOpenDomainQuery(filters);
  const raisedVsClosed = useGetCrqRaisedVsClosedQuery(filters);
  const runRate = useGetCrqRunRateQuery(filters);
  const groupBreakdown = useGetCrqGroupBreakdownQuery({ ...filters, groupBy });
  const agingHeatmap = useGetCrqAgingHeatmapQuery({ ...filters, heatmapMode });

  const goToTable = (config: TableViewConfig) => setNav({ view: "table", tableConfig: config });

  // Clicking a CRQ row opens the full-screen journey page; going back from it
  // returns to the drill-down table that launched it.
  if (selectedCrq) {
    return (
      <CommonContainer>
        <CrqJourneyDetail crqNo={selectedCrq} onBack={() => setSelectedCrq(null)} />
      </CommonContainer>
    );
  }

  if (nav.view === "table") {
    return (
      <CommonContainer>
        <CrqFullscreenTable
          config={nav.tableConfig}
          filters={filters}
          onBack={() => setNav({ view: "grid" })}
          onRowClick={setSelectedCrq}
        />
      </CommonContainer>
    );
  }

  return (
    <CommonContainer>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <AnalyticsFilterBar {...filterState} />

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2 }}>
          <ChartCard
            title="Open CRQ by Domain"
            onViewAll={() => goToTable({ title: "Open CRQ — Domain Wise", tableType: "OPEN_CRQ_DOMAIN" })}
          >
            <BarChartCard
              labels={(openDomain.data ?? []).map((d) => d.domain)}
              series={[
                { label: "CCB", data: (openDomain.data ?? []).map((d) => d.ccb), color: seriesColor("ccb", isDark) },
                { label: "SE", data: (openDomain.data ?? []).map((d) => d.se), color: seriesColor("se", isDark) },
              ]}
              stacked
              isLoading={openDomain.isFetching}
              isError={openDomain.isError}
              onBarClick={(domain) => goToTable({ title: `CRQs in Stage: ${domain}`, tableType: "CRQ_LIST", stage: domain })}
            />
          </ChartCard>

          <ChartCard
            title="Raised vs Closed vs Rejected"
            onViewAll={() => goToTable({ title: "CRQ Open vs Closed — All CRQs", tableType: "OPEN_VS_CLOSED" })}
          >
            <BarChartCard
              labels={(raisedVsClosed.data ?? []).map((d) => d.label)}
              series={[
                { label: "Raised", data: (raisedVsClosed.data ?? []).map((d) => d.raised), color: seriesColor("raised", isDark) },
                { label: "Closed", data: (raisedVsClosed.data ?? []).map((d) => d.closed), color: seriesColor("closed", isDark) },
                { label: "Rejected", data: (raisedVsClosed.data ?? []).map((d) => d.rejected), color: seriesColor("rejected", isDark) },
              ]}
              isLoading={raisedVsClosed.isFetching}
              isError={raisedVsClosed.isError}
            />
          </ChartCard>
        </Box>

        <ChartCard
          title="Run Rate: Raised → Scheduling → Closed"
          onViewAll={() => goToTable({ title: "Run Rate — All CRQs", tableType: "RUN_RATE" })}
        >
          <RunRateChart rows={runRate.data ?? []} isLoading={runRate.isFetching} isError={runRate.isError} />
        </ChartCard>

        <ChartCard
          title="Circle / Region Breakdown"
          onViewAll={() =>
            goToTable({
              title: groupBy === "region" ? "Region Wise CRQ Analytics" : "Circle Wise CRQ Analytics",
              tableType: "CIRCLE_REGION",
              groupBy,
            })
          }
          action={
            <ToggleButtonGroup size="small" exclusive value={groupBy} onChange={(_e, v) => v && setGroupBy(v)}>
              {GROUP_BY_OPTIONS.map((opt) => (
                <ToggleButton key={opt.value} value={opt.value} sx={{ textTransform: "none", px: 1.5 }}>
                  {opt.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          }
        >
          <BarChartCard
            labels={(groupBreakdown.data ?? []).map((d) => d.group)}
            series={[
              { label: "Raised", data: (groupBreakdown.data ?? []).map((d) => d.raised), color: categoryColor(0, isDark) },
              { label: "Closed", data: (groupBreakdown.data ?? []).map((d) => d.closed), color: categoryColor(2, isDark) },
              { label: "Rejected", data: (groupBreakdown.data ?? []).map((d) => d.rejected), color: categoryColor(7, isDark) },
            ]}
            isLoading={groupBreakdown.isFetching}
            isError={groupBreakdown.isError}
          />
        </ChartCard>

        <ChartCard
          title="Aging Heatmap"
          height="auto"
          onViewAll={() => goToTable({ title: "CRQ Aging Heatmap — All CRQs", tableType: "AGING_HEATMAP", heatmapMode })}
          action={
            <ToggleButtonGroup size="small" exclusive value={heatmapMode} onChange={(_e, v) => v && setHeatmapMode(v)}>
              <ToggleButton value="RECEIVED" sx={{ textTransform: "none", px: 1.5 }}>
                Received
              </ToggleButton>
              <ToggleButton value="SCHEDULED" sx={{ textTransform: "none", px: 1.5 }}>
                Scheduled
              </ToggleButton>
            </ToggleButtonGroup>
          }
        >
          <AgingHeatmapGrid data={agingHeatmap.data} mode={heatmapMode} isLoading={agingHeatmap.isFetching} isError={agingHeatmap.isError} />
        </ChartCard>
      </Box>
    </CommonContainer>
  );
}
