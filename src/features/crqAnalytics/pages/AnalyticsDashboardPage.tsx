import { useState } from "react";
import { Box, Collapse, Skeleton } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CommonContainer from "../../../components/common/CommonContainer";
import { useAnalyticsFilters } from "../hooks/useAnalyticsFilters";
import { useGetCrqAnalyticsDashboardQuery, useGetCrqEngineerUtilizationQuery } from "../api/crqAnalyticsApi";
import { AnalyticsFilterBar } from "../components/AnalyticsFilterBar";
import { KpiCardsRow, type ExpandableKpiKey } from "../components/KpiCardsRow";
import { WorkflowStageBreakdown } from "../components/WorkflowStageBreakdown";
import { RejectionReasonsPanel } from "../components/RejectionReasonsPanel";
import { ChartCard } from "../components/ChartCard";
import { BarChartCard } from "../components/BarChartCard";
import { EngineerUtilizationPanel } from "../components/EngineerUtilizationPanel";
import { CrqFullscreenTable } from "../components/CrqFullscreenTable";
import { CrqJourneyDetail } from "../components/CrqJourneyDetail";
import { EmptyOrErrorState } from "../components/EmptyOrErrorState";
import { seriesColor } from "../utils/chartPalette";
import type { AnalyticsNavState, TableViewConfig } from "../types/crqAnalytics.types";

export default function AnalyticsDashboardPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const filterState = useAnalyticsFilters();
  const { filters } = filterState;
  const [selectedCrq, setSelectedCrq] = useState<string | null>(null);
  const [nav, setNav] = useState<AnalyticsNavState>({ view: "grid" });

  const { data, isFetching, isError } = useGetCrqAnalyticsDashboardQuery(filters);
  const engineerUtilization = useGetCrqEngineerUtilizationQuery(filters);

  const [activePanel, setActivePanel] = useState<ExpandableKpiKey | null>(null);

  const handleCardClick = (key: ExpandableKpiKey) => setActivePanel((p) => (p === key ? null : key));
  const goToTable = (config: TableViewConfig) => setNav({ view: "table", tableConfig: config });

  const drillToStage = (stage: string) => goToTable({ title: `CRQs in Stage: ${stage}`, tableType: "CRQ_LIST", stage });
  const drillToReason = (reason: string) => goToTable({ title: `Rejected CRQs — ${reason}`, tableType: "CRQ_LIST", rejectionReason: reason });

  // Clicking a CRQ row opens the full-screen journey page; going back from it
  // returns to whichever view (grid or drill-down table) launched it.
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

        {isFetching && !data && (
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", lg: "repeat(5, 1fr)" }, gap: "14px" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={120} />
            ))}
          </Box>
        )}

        {isError && !isFetching && <EmptyOrErrorState kind="error" message="Couldn't load the dashboard. Try adjusting the filters." />}

        {data && (
          <>
            <KpiCardsRow kpi={data.kpi} activeKey={activePanel} onCardClick={handleCardClick} />

            <Collapse in={activePanel !== null} unmountOnExit>
              <ChartCard
                title={
                  activePanel === "rejected" ? "Rejection Reasons" : activePanel === "sla" ? "SLA Breaches by Stage" : "Workflow Stage Breakdown"
                }
                height="auto"
              >
                {(activePanel === "total" || activePanel === "open") && (
                  <WorkflowStageBreakdown stages={data.workflowStages} mode={activePanel} onStageClick={drillToStage} />
                )}
                {activePanel === "rejected" && (
                  <RejectionReasonsPanel reasons={data.rejectionReasons} isLoading={isFetching} onReasonClick={drillToReason} />
                )}
                {activePanel === "sla" && (
                  <Box sx={{ height: 280 }}>
                    <BarChartCard
                      labels={data.slaDomains.map((d) => d.stageName)}
                      series={[{ label: "SLA Breaches", data: data.slaDomains.map((d) => d.slaBreachCount), color: seriesColor("slaBreach", isDark) }]}
                      isLoading={isFetching}
                      onBarClick={drillToStage}
                    />
                  </Box>
                )}
              </ChartCard>
            </Collapse>

            <ChartCard title="Engineer Utilization" height="auto">
              <EngineerUtilizationPanel
                rows={engineerUtilization.data ?? []}
                isLoading={engineerUtilization.isFetching}
                isError={engineerUtilization.isError}
              />
            </ChartCard>
          </>
        )}
      </Box>
    </CommonContainer>
  );
}
