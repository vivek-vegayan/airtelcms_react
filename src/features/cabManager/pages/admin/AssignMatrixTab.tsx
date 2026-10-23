import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Skeleton,
  Table, TableBody, TableCell, TableHead, TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { useAppTable, useViewportPageSize } from "../../../../components/ui/AppTable";
import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useMemo, useState } from "react";
import {
  useGetAssignMatrixQuery,
  useGetAssignRulesQuery,
  useGetServiceRulesQuery,
  useLazyGetServiceRulesQuery,
} from "../../api/cabManagerApiSlice";
import { ExportExcelButton } from "../../components/shared/ExportExcelButton";
import { exportRowsToExcel, type ExcelColumn } from "../../../crqAnalytics/utils/excelExport";
import {
  APPROVAL_AUTHORITIES,
  APPROVERS,
  ASSIGN_DOMAINS,
  ASSIGN_STAGES,
  SERVICE_CIRCLES,
  SERVICE_TYPES,
} from "../../data/cabManager.mock";
import type { ServiceApprovalRule } from "../../types/types";
import { AddServiceRuleModal } from "../../components/modals/AddServiceRuleModal";

// Toolbar button look shared with PlanViewTable.
const TOOLBAR_BUTTON_SX = {
  fontSize: 12,
  py: 0.5,
  px: 1.5,
  borderRadius: 1.5,
  textTransform: "none",
  fontWeight: 600,
} as const;

const SERVICE_RULE_EXPORT_COLUMNS: ExcelColumn[] = [
  { header: "Service Type", key: "service", width: 22 },
  { header: "Circle", key: "circle", width: 12 },
  { header: "L1", key: "l1", width: 24 },
  { header: "L1 Escalation Time", key: "l1EscalationTime", width: 18 },
  { header: "L2", key: "l2", width: 24 },
  { header: "L2 Escalation Time", key: "l2EscalationTime", width: 18 },
  { header: "L3", key: "l3", width: 24 },
  { header: "L3 Escalation Time", key: "l3EscalationTime", width: 18 },
  { header: "Active", key: "active", width: 10 },
];
const SERVICE_RULE_EXPORT_PAGE_SIZE = 500;

export function AdminAssignMatrixTab() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const matrix      = useGetAssignMatrixQuery();
  const rules       = useGetAssignRulesQuery();
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  // Row being edited — same dialog and upsert API as "Add service Approval".
  const [editServiceRow, setEditServiceRow] = useState<ServiceApprovalRule | null>(null);

  // Server-side paging: pageIndex is 0-based both here and in Spring's Pageable,
  // so it goes over the wire as-is.
  // Rows per page: 10 by default, more when a tall screen has room for them.
  const viewportPageSize = useViewportPageSize();
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: Math.max(10, viewportPageSize),
  });
  const serviceRules = useGetServiceRulesQuery({
    page: pagination.pageIndex,
    size: pagination.pageSize,
  });
  const serviceRuleRows = serviceRules.data?.content ?? [];
  const serviceRuleTotal = serviceRules.data?.totalElements ?? 0;
  const [fetchServiceRules] = useLazyGetServiceRulesQuery();

  const matrixByStage = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};
    matrix.data?.forEach((c) => { (map[c.stage] ??= {})[c.domain] = c.approver; });
    return map;
  }, [matrix.data]);

  const serviceRuleColumns = useMemo<MRT_ColumnDef<ServiceApprovalRule>[]>(
    () => [
      // Only Service Type and Circle are filterable (defaultColumn turns the
      // rest off); faceted values feed the multi-select dropdown.
      { accessorKey: "service", header: "Service Type", size: 160, enableColumnFilter: true, filterVariant: "multi-select" },
      { accessorKey: "circle", header: "Circle", size: 100, enableColumnFilter: true, filterVariant: "multi-select" },
      ...(
        [
          ["l1", "L1", "#2E7D32", "l1EscalationTime"],
          ["l2", "L2", "#ED6C02", "l2EscalationTime"],
          ["l3", "L3", "#C62828", "l3EscalationTime"],
        ] as const
      ).flatMap(([key, label, color, timeKey]): MRT_ColumnDef<ServiceApprovalRule>[] => [
        {
          accessorKey: key,
          header: label,
          size: 140,
          muiTableHeadCellProps: { sx: { color } },
          Cell: ({ row }) => row.original[key] || "—",
        },
        ...(timeKey
          ? [
              {
                accessorKey: timeKey,
                header: `${label} Escalation Time`,
                size: 130,
                muiTableHeadCellProps: { sx: { color } },
                // TIME arrives as "HH:mm:ss"; show "HH:mm".
                Cell: ({ row }) => (
                  <Typography sx={{ fontFamily: "'Roboto Mono', monospace", fontSize: 12.5 }}>
                    {row.original[timeKey]?.slice(0, 5) || "—"}
                  </Typography>
                ),
              } satisfies MRT_ColumnDef<ServiceApprovalRule>,
            ]
          : []),
      ]),
      {
        accessorKey: "active",
        header: "Active",
        size: 90,
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: "center" },
        Cell: ({ row }) => (row.original.active ? "Yes" : "No"),
      },
    ],
    []
  );

  // The list is server-paged, so pull every page before writing the file, then
  // apply the Service Type / Circle column filters the user has set on screen.
  // Only runs on click, so reading serviceRuleTable (declared below) is safe.
  async function handleExport() {
    const all: ServiceApprovalRule[] = [];
    for (let page = 0; ; page++) {
      const res = await fetchServiceRules({ page, size: SERVICE_RULE_EXPORT_PAGE_SIZE }).unwrap();
      all.push(...res.content);
      if (res.last || res.content.length === 0 || all.length >= res.totalElements) break;
    }
    const filters = serviceRuleTable.getState().columnFilters;
    const rows = all
      .filter((r) =>
        filters.every(({ id, value }) => {
          const picked = Array.isArray(value) ? value : value == null ? [] : [value];
          return picked.length === 0 || picked.includes(r[id as keyof ServiceApprovalRule]);
        }),
      )
      .map((r) => ({
        ...r,
        l1EscalationTime: r.l1EscalationTime?.slice(0, 5) ?? "",
        l2EscalationTime: r.l2EscalationTime?.slice(0, 5) ?? "",
        l3EscalationTime: r.l3EscalationTime?.slice(0, 5) ?? "",
        active: r.active ? "Yes" : "No",
      }));
    await exportRowsToExcel(rows, SERVICE_RULE_EXPORT_COLUMNS, "Approval Flow", "CAB_Assignment_Matrix");
  }

  // Same table setup as PlanViewTable (/scheduler/planviewandsetup).
  const serviceRuleTable = useAppTable({
    columns: serviceRuleColumns,
    data: serviceRuleRows,
    getRowId: (row) => row.id,
    state: {
      isLoading: serviceRules.isLoading,
      showProgressBars: serviceRules.isFetching && !serviceRules.isLoading,
      pagination,
    },
    initialState: {
      density: "compact",
    },
    // No global search; per-column filters only where a column opts in.
    enableGlobalFilter: false,
    defaultColumn: { enableColumnFilter: false },
    manualPagination: true,
    rowCount: serviceRuleTotal,
    onPaginationChange: setPagination,
    enableFacetedValues: true,

    // ── Column menu (⋮): sort, filter by, reset size, hide / show columns ──
    // useAppTable turns the menu off by default; this grid opts back in.
    enableColumnActions: true,
    enableSorting: true,
    enableColumnFilters: true,
    columnFilterDisplayMode: "subheader",
    enableColumnResizing: true,
    // "grid" keeps columns stretching to fill the width while resizable.
    layoutMode: "grid",
    columnResizeMode: "onEnd",
    enableHiding: true,

    // ── Enable Action Column (Edit) ──────────────────────────────────────────
    enableRowActions: true,
    positionActionsColumn: "last",
    renderRowActions: ({ row }) => (
      <Tooltip title="Edit Row">
        <IconButton
          size="small"
          onClick={() => setEditServiceRow(row.original)}
          sx={{ color: "text.secondary" }}
        >
          <EditOutlinedIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    ),

    // Title lives in the table toolbar instead of a separate header bar above it.
    // Count is the server total, not an active-only tally — the list is
    // server-paged, so a client-side tally would only cover this page.
    renderTopToolbarCustomActions: () => (
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1, flexWrap: "wrap", minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>Impacted Party Approval Flow</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {serviceRuleTotal} rules
          {/* Hidden on narrow screens so the toolbar stays one line. */}
          <Box component="span" sx={{ display: { xs: "none", md: "inline" } }}>
            {" "}· L1 is the primary approver; L2/L3 are escalation tiers
          </Box>
        </Typography>
      </Box>
    ),

    renderToolbarInternalActions: () => (
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
        <Tooltip title="Refresh">
          <span>
            <IconButton
              size="small"
              onClick={() => void serviceRules.refetch()}
              disabled={serviceRules.isFetching}
              sx={{ p: "5px" }}
            >
              <RefreshIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </span>
        </Tooltip>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon sx={{ fontSize: 14 }} />}
          onClick={() => setAddServiceOpen(true)}
          disableElevation
          sx={TOOLBAR_BUTTON_SX}
        >
          Add Service Approval
        </Button>
        <ExportExcelButton
          onExport={handleExport}
          disabled={serviceRuleTotal === 0}
          sx={TOOLBAR_BUTTON_SX}
        />
      </Box>
    ),

    muiTableContainerProps: {
      // Body is as tall as its rows, so the pager sits right under the last row
      // (no blank gap). It may grow up to the screen's free height, then
      // scrolls inside. Narrow screens reserve more: the toolbar and pager
      // wrap to two lines there.
      sx: {
        maxHeight: {
          xs: "max(200px, calc(100vh - 360px))",
          md: "max(240px, calc(100vh - 290px))",
        },
      },
    },
    muiTableBodyRowProps: ({ row }) => ({
      sx: {
        opacity: row.original.active ? 1 : 0.6,
        "&:hover td": {
          backgroundColor: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.04),
        },
        transition: "background-color 100ms ease",
      },
    }),
    muiTopToolbarProps: {
      sx: {
        px: 1.5,
        py: 0.75,
        minHeight: 46,
        borderBottom: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        "& .MuiTextField-root": { minWidth: 200 },
      },
    },
    muiLinearProgressProps: { color: "primary", sx: { height: 2 } },
    muiSkeletonProps: { height: 22, sx: { borderRadius: 1 } },

    renderEmptyRowsFallback: () => (
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, py: 5 }}>
        <InfoOutlinedIcon sx={{ fontSize: 34, color: "text.disabled" }} />
        <Typography variant="body2" fontWeight={600} color="text.secondary">
          No service approval rules found
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ mb: 2 }}>
          Try adjusting the Service Type or Circle filter.
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon sx={{ fontSize: 14 }} />}
          onClick={() => setAddServiceOpen(true)}
          disableElevation
          sx={TOOLBAR_BUTTON_SX}
        >
          Add First Rule
        </Button>
      </Box>
    ),
  });

  return (
    <Box>
      {/* <Box sx={{ maxWidth: 620, mb: 2 }}>
        <Typography sx={{ fontWeight: 500, fontSize: 16 }}>Approval Assignment Matrix</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Define who approves each CRQ by approval stage and domain. Exception rules below override
          this matrix for specific circle and impact combinations.
        </Typography>
      </Box> */}

      {/* Stage × Domain matrix */}
      {/* <Paper sx={{ mb: 4, border: "1px solid", borderColor: "divider", overflow: "auto" }} elevation={0}>
        {matrix.isLoading ? (
          <Box sx={{ p: 2 }}><Skeleton variant="rounded" height={240} /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#FAFAFA" }}>
                <TableCell>Approval Stage</TableCell>
                {ASSIGN_DOMAINS.map((d) => <TableCell key={d}>{d}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              {ASSIGN_STAGES.map((s) => (
                <TableRow key={s}>
                  <TableCell sx={{ fontWeight: 500 }}>{s}</TableCell>
                  {ASSIGN_DOMAINS.map((d) => (
                    <TableCell key={d}>
                      <TextField select size="small" value={matrixByStage[s]?.[d] ?? ""} fullWidth>
                        {APPROVERS.map((a) => (
                          <MenuItem key={a.name} value={a.name}>{a.name}</MenuItem>
                        ))}
                      </TextField>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper> */}

      {/* Exception rules */}
      {/* <Paper sx={{ mb: 4, border: "1px solid", borderColor: "divider" }} elevation={0}>
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography sx={{ fontWeight: 500 }}>Exception Rules <Typography component="span" variant="caption" sx={{ color: "text.secondary", ml: 1 }}>— {rules.data?.filter((r) => r.active).length ?? 0} active</Typography></Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>Override the matrix for specific circle &amp; impact combinations.</Typography>
          </Box>
          <Button size="small" variant="contained" startIcon={<AddIcon />}>Add rule</Button>
        </Box>
        {rules.isLoading ? (
          <Box sx={{ p: 2 }}><Skeleton variant="rounded" height={180} /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#FAFAFA" }}>
                <TableCell>Rule</TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Circle</TableCell>
                <TableCell>Impact</TableCell>
                <TableCell>Stage</TableCell>
                <TableCell>Approver</TableCell>
                <TableCell align="center">Active</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.data?.map((r) => (
                <TableRow key={r.id} sx={{ opacity: r.active ? 1 : 0.6 }}>
                  <TableCell sx={{ fontFamily: "'Roboto Mono', monospace", color: "primary.main" }}>{r.id}</TableCell>
                  <TableCell>{r.domain}</TableCell>
                  <TableCell>{r.circle}</TableCell>
                  <TableCell>{r.impact}</TableCell>
                  <TableCell>{r.stage}</TableCell>
                  <TableCell>{r.approver}</TableCell>
                  <TableCell align="center">{r.active ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper> */}

      {/* Impacted-party (L1/L2/L3) rules */}
      <MaterialReactTable table={serviceRuleTable} />

      <AddServiceRuleModal
        open={addServiceOpen}
        onClose={() => setAddServiceOpen(false)}
        onSuccess={() => {
          setAddServiceOpen(false);
          // Back to the first page — a new rule can land on any page once the
          // list is server-paged, and refetch alone would leave you looking at
          // a stale offset.
          setPagination((p) => ({ ...p, pageIndex: 0 }));
          serviceRules.refetch();
        }}
      />

      <AddServiceRuleModal
        open={editServiceRow !== null}
        editRow={editServiceRow}
        onClose={() => setEditServiceRow(null)}
        onSuccess={() => {
          setEditServiceRow(null);
          // An edit keeps the row where it is (ordered by Esc_Id), so stay on
          // the current page.
          serviceRules.refetch();
        }}
      />
    </Box>
  );
}
