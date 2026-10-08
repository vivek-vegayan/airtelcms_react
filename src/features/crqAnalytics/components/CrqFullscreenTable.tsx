import { useState } from "react";
import { alpha, Box, CircularProgress, IconButton, Typography, useTheme } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import {
  useGetCrqViewAllCircleRegionQuery,
  useGetCrqViewAllOpenDomainQuery,
  useGetCrqViewAllAgingHeatmapQuery,
  useGetCrqViewAllOpenVsClosedQuery,
  useGetCrqViewAllRunRateQuery,
  useLazyGetCrqAnalyticsListQuery,
} from "../api/crqAnalyticsApi";
import { GenericViewAllTable } from "./GenericViewAllTable";
import { CRQ_LIST_EXCEL_COLUMNS, CrqListTable } from "./CrqListTable";
import { exportRowsToExcel } from "../utils/excelExport";
import type { CRQAnalyticsFilterParams, CRQTableRowDto, TableViewConfig } from "../types/crqAnalytics.types";

const CRQ_LIST_EXPORT_PAGE_SIZE = 1000;

/** "Circle Wise CRQ Analytics" → "Circle_Wise_CRQ_Analytics" for sheet/file names. */
const toFileSafe = (title: string) => title.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "") || "crq_analytics";

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
  const [fetchCrqList] = useLazyGetCrqAnalyticsListQuery();
  const [exporting, setExporting] = useState(false);

  const activeViewAll =
    config.tableType === "CIRCLE_REGION"
      ? circleRegion
      : config.tableType === "OPEN_CRQ_DOMAIN"
        ? openDomain
        : config.tableType === "AGING_HEATMAP"
          ? agingHeatmap
          : config.tableType === "OPEN_VS_CLOSED"
            ? openVsClosed
            : config.tableType === "RUN_RATE"
              ? runRate
              : undefined;

  const exportDisabled =
    exporting || (activeViewAll !== undefined && (activeViewAll.isFetching || !activeViewAll.data?.data?.length));

  // View All tables are fully loaded already, so export what's on screen. The
  // CRQ list is server-paginated, so pull every page before writing the file.
  const handleExport = async () => {
    const name = toFileSafe(config.title);
    setExporting(true);
    try {
      if (activeViewAll) {
        const headers = activeViewAll.data?.headers ?? [];
        await exportRowsToExcel(
          activeViewAll.data?.data ?? [],
          headers.map((h) => ({ key: h, header: h })),
          name.slice(0, 31),
          name,
        );
      } else if (config.tableType === "CRQ_LIST") {
        const rows: CRQTableRowDto[] = [];
        for (let page = 0; ; page++) {
          const res = await fetchCrqList({
            ...filters,
            status: config.status,
            stage: config.stage,
            rejectionReason: config.rejectionReason,
            page,
            size: CRQ_LIST_EXPORT_PAGE_SIZE,
          }).unwrap();
          const batch = res.data ?? [];
          rows.push(...batch);
          if (batch.length < CRQ_LIST_EXPORT_PAGE_SIZE || rows.length >= res.totalCount) break;
        }
        await exportRowsToExcel(rows, CRQ_LIST_EXCEL_COLUMNS, name.slice(0, 31), name);
      }
    } finally {
      setExporting(false);
    }
  };

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

        <Box
          component="button"
          onClick={handleExport}
          disabled={exportDisabled}
          sx={{
            ml: "auto",
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            background: "none",
            border: "1px solid",
            borderColor: "success.main",
            borderRadius: 1,
            cursor: exportDisabled ? "default" : "pointer",
            opacity: exportDisabled ? 0.5 : 1,
            color: "success.main",
            fontSize: "0.7rem",
            fontWeight: 700,
            px: 1.2,
            py: 0.6,
            "&:hover": { bgcolor: exportDisabled ? "transparent" : alpha(theme.palette.success.main, 0.08) },
          }}
        >
          {exporting ? <CircularProgress size={13} color="inherit" /> : <DownloadRoundedIcon sx={{ fontSize: 15 }} />}
          {exporting ? "Exporting…" : "Export to Excel"}
        </Box>
      </Box>
      {renderBody()}
    </Box>
  );
}
