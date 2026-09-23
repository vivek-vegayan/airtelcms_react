import { Box, IconButton, Typography, useTheme } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import {
  useGetCrqViewAllCircleRegionQuery,
  useGetCrqViewAllOpenDomainQuery,
  useGetCrqViewAllAgingHeatmapQuery,
  useGetCrqViewAllOpenVsClosedQuery,
  useGetCrqViewAllRunRateQuery,
} from "../api/crqAnalyticsApi";
import { GenericViewAllTable } from "./GenericViewAllTable";
import { CrqListTable } from "./CrqListTable";
import type { CRQAnalyticsFilterParams, TableViewConfig } from "../types/crqAnalytics.types";

interface Props {
  config: TableViewConfig;
  filters: CRQAnalyticsFilterParams;
  onBack: () => void;
  onRowClick: (crqNo: string) => void;
}

/** Full-screen destination for every "View All" button / chart drill-down
 * click — routes tableType to whichever backend query actually backs it.
 * skip: true keeps the unused queries from firing (rules of hooks require
 * calling all of them regardless of which tableType is active). */
export function CrqFullscreenTable({ config, filters, onBack, onRowClick }: Props) {
  const theme = useTheme();

  const circleRegion = useGetCrqViewAllCircleRegionQuery(
    { ...filters, groupBy: config.tableType === "CIRCLE_REGION" ? config.groupBy : "circle" },
    { skip: config.tableType !== "CIRCLE_REGION" },
  );
  const openDomain = useGetCrqViewAllOpenDomainQuery(filters, { skip: config.tableType !== "OPEN_CRQ_DOMAIN" });
  const agingHeatmap = useGetCrqViewAllAgingHeatmapQuery(
    { ...filters, heatmapMode: config.tableType === "AGING_HEATMAP" ? config.heatmapMode : "RECEIVED" },
    { skip: config.tableType !== "AGING_HEATMAP" },
  );
  const openVsClosed = useGetCrqViewAllOpenVsClosedQuery(filters, { skip: config.tableType !== "OPEN_VS_CLOSED" });
  const runRate = useGetCrqViewAllRunRateQuery(filters, { skip: config.tableType !== "RUN_RATE" });

  const renderBody = () => {
    switch (config.tableType) {
      case "CIRCLE_REGION":
        return <GenericViewAllTable response={circleRegion.data} isLoading={circleRegion.isFetching} isError={circleRegion.isError} />;
      case "OPEN_CRQ_DOMAIN":
        return <GenericViewAllTable response={openDomain.data} isLoading={openDomain.isFetching} isError={openDomain.isError} />;
      case "AGING_HEATMAP":
        return <GenericViewAllTable response={agingHeatmap.data} isLoading={agingHeatmap.isFetching} isError={agingHeatmap.isError} />;
      case "OPEN_VS_CLOSED":
        return <GenericViewAllTable response={openVsClosed.data} isLoading={openVsClosed.isFetching} isError={openVsClosed.isError} />;
      case "RUN_RATE":
        return <GenericViewAllTable response={runRate.data} isLoading={runRate.isFetching} isError={runRate.isError} />;
      case "CRQ_LIST":
        return (
          <CrqListTable
            filters={filters}
            drill={{ status: config.status, stage: config.stage, rejectionReason: config.rejectionReason }}
            onRowClick={onRowClick}
          />
        );
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton onClick={onBack} size="small">
          <ArrowBackRoundedIcon fontSize="small" />
        </IconButton>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: theme.palette.text.primary }}>{config.title}</Typography>
      </Box>
      {renderBody()}
    </Box>
  );
}
