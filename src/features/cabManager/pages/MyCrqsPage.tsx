import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { useAppTable } from "../../../components/ui/AppTable";
import { useEffect, useMemo, useState } from "react";
import { useTabColorTokens } from "../../../style/theme";
import { useGetMyCrqsQuery} from "../api/cabManagerApiSlice";
import { MyCrqDetailDrawer } from "../components/shared/MyCrqDetailDrawer";
import { CabKpiCard } from "../components/dashboard/CabKpiCard";
import { errMsg } from "../components/shared/errMsg";
import type { Crq, DashboardKpi } from "../types/types";

export function MyCrqsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const colors = useTabColorTokens(theme);
  const [mounted, setMounted] = useState(false);
  const { data, isLoading, isError, error, refetch } = useGetMyCrqsQuery();
  // const { data: services } = useGetCabServicesQuery();

  // The whole row, not just an id: the detail proc is keyed on serviceApprovalId
  // while the SPOC/FE and Conflict modals still need the CRQ number, and the row
  // also carries serviceApprovalStatus, which the detail proc no longer returns.
  const [selected, setSelected] = useState<Crq | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const kpis = useMemo<DashboardKpi[]>(() => {
    if (!data) return [];
    return [
      {
        label: "Awaiting Your Action",
        value: data.stats.awaitingMe,
        foot: "Needs review now",
        accent: "blue",
      },
      {
        label: "Approved This Week",
        value: data.stats.approvedThisWeek,
        foot: "Completed successfully",
        accent: "green",
      },
      {
        label: "Rejected This Week",
        value: data.stats.rejectedThisWeek,
        foot: "Sent back for changes",
        accent: "orange",
      },
    ];
  }, [data]);

  const columns = useMemo<MRT_ColumnDef<Crq>[]>(
    () => [
      {
        accessorKey: "crqNo",
        header: "CRQ ID",
        size: 160,
        Cell: ({ row }) => (
          <Box>
            <Typography
              sx={{
                fontFamily: "'Roboto Mono', monospace",
                fontSize: 12.5,
                color: "primary.main",
                fontWeight: 500,
              }}
            >
              {row.original.crqNo}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {row.original.domainName} · {row.original.circleCode}
            </Typography>
          </Box>
        ),
      },
      {
        accessorKey: "domainName",
        header: "Domain",
        size: 150,
        Cell: ({ row }) => (
          <Box>
            <Typography variant="body2">{row.original.domainName}</Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Circle {row.original.circleCode}
            </Typography>
          </Box>
        ),
      },
      {
              accessorKey: "currentStage",
              header: "Stage",
              size: 150,
              Cell: ({ row }) => (
                <Typography variant="body2">
                  {/* {serviceNameByCode.get(row.original.currentStage) ?? row.original.currentStage} */}
                   {row.original.currentStage}
                </Typography>
              ),
            },
      
      {
        accessorKey: "stageStatus",
        header: "Stage Status",
        size: 160,
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue<string>()}
            color="warning"
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        accessorKey: "serviceCode",
        header: "Service",
        size: 150,
        Cell: ({ row }) => (
          <Typography variant="body2">
            {/* {serviceNameByCode.get(row.original.serviceCode) ??
              row.original.serviceCode} */}
             {row.original.serviceCode}
          </Typography>
        ),
      },
      {
        accessorKey: "serviceApprovalStatus",
        header: "Service Status",
        size: 170,
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue<string>()}
            color="warning"
            size="small"
            variant="outlined"
          />
        ),
      },
    ],
    [],
  );

  const table = useAppTable({
    columns,
    data: data?.rows ?? [],
    getRowId: (row) => String(row.serviceApprovalId),
    state: { isLoading },
    appTable: {
      emptyTitle: "No CRQs assigned to you",
      emptyDescription: "Nothing is waiting on you right now.",
      // Wrapped in the page's own bordered Paper below.
      frame: false,
    },
    initialState: { density: "compact" },
    enableTopToolbar: false,
    muiTableBodyRowProps: ({ row }) => ({
      hover: true,
      onClick: () => setSelected(row.original),
      sx: {
        cursor: "pointer",
        "&:hover td": {
          backgroundColor: alpha(
            theme.palette.primary.main,
            isDark ? 0.08 : 0.04,
          ),
        },
        transition: "background-color 100ms ease",
      },
    }),
  });

  if (isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => void refetch()}>
            Retry
          </Button>
        }
      >
        {errMsg(error)}
      </Alert>
    );
  }
  if (isLoading || !data) {
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={52} width={280} />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 2,
          }}
        >
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={112}
              sx={{ borderRadius: "14px" }}
            />
          ))}
        </Box>
        <Skeleton variant="rounded" height={400} />
      </Stack>
    );
  }

  return (
    <Box>
      {/* Stats */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
          gap: 2,
          mb: 3,
        }}
      >
        {kpis.map((k, i) => (
          <CabKpiCard
            key={k.label}
            kpi={k}
            colors={colors}
            mounted={mounted}
            delay={0.04 * i}
          />
        ))}
      </Box>

      {/* Table */}
      <Paper
        sx={{ border: "1px solid", borderColor: "divider", overflow: "hidden" }}
        elevation={0}
      >
        <MaterialReactTable table={table} />
      </Paper>

      <MyCrqDetailDrawer crq={selected} onClose={() => setSelected(null)} />
    </Box>
  );
}
