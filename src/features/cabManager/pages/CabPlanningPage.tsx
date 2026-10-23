import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_RowSelectionState,
} from "material-react-table";
import { useAppTable } from "../../../components/ui/AppTable";
import EventNoteIcon from "@mui/icons-material/EventNote";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import OrgHierarchyFilters from "../../orgHierarchy/components/OrgHierarchyFiltersV2";
import { useOrgHierarchyState } from "../../orgHierarchy/hooks/useOrgHierarchyState";
import { useOrgHierarchyFilters } from "../../orgHierarchy/hooks/useOrgHierarchyFilters";
import { useApiRefresh } from "../../../hooks/useApiRefresh";
import { useGetCabPlanDatesQuery, useGetCabQueueQuery } from "../api/cabManagerApiSlice";
import { PlanCabModal } from "../components/modals/PlanCabModal";
import { CabQueueState } from "../components/shared/CabQueueState";
import { getStageLabel, ImpactChip, StageChip, StatusChip } from "../components/shared/Chips";
import { errMsg } from "../components/shared/errMsg";
import { ExportExcelButton } from "../components/shared/ExportExcelButton";
import { isWindowOverdue, parseExecutionWindow } from "../components/shared/executionWindow";
import { exportRowsToExcel, type ExcelColumn } from "../../crqAnalytics/utils/excelExport";
import { STAGES } from "../data/cabManager.mock";
import type { CabQueueParams, CabQueueRow, CrqStage } from "../types/types";

type StageFilter = NonNullable<CabQueueParams["stage"]>;

const QUEUE_EXPORT_COLUMNS: ExcelColumn[] = [
  { header: "CRQ No", key: "crqNo", width: 20 },
  { header: "Stage", key: "currentStage", width: 22 },
  { header: "Status", key: "currentStatus", width: 16 },
  { header: "Impact", key: "impact", width: 10 },
  { header: "Circle", key: "circle", width: 16 },
  { header: "Domain", key: "domain", width: 16 },
  { header: "Execution Window", key: "executionWindow", width: 28 },
];

type DateRangeFilterValue = [Dayjs | null | undefined, Dayjs | null | undefined] | undefined;

/**
 * Filter for the Execution Window column's date-range picker. Compares by
 * calendar day: MRT's built-in betweenInclusive would treat the "To" date as
 * midnight and drop windows later that same day. Rows with no window never
 * match an active range.
 */
function executionWindowDateFilter(
  row: { original: CabQueueRow },
  _columnId: string,
  value: DateRangeFilterValue,
): boolean {
  const [from, to] = value ?? [];
  if (!from && !to) return true;
  const w = parseExecutionWindow(row.original.executionWindow);
  if (!w) return false;
  if (from && w.day.isBefore(dayjs(from).startOf("day"))) return false;
  if (to && w.day.isAfter(dayjs(to).startOf("day"))) return false;
  return true;
}

export function CabPlanningPage() {
  const roleCode = useAuth().role ?? "TEAM_MEMBER";
  const { values, handleChange, resetAll } = useOrgHierarchyState("cabPlanning");
  const { options } = useOrgHierarchyFilters(values);
  const [stage, setStage] = useState<StageFilter>("All");
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);

  const shouldFetch = Boolean(values.domain) && values.subDomain != null;
  const queue = useGetCabQueueQuery(
    { domainId: values.domain!, subDomainId: values.subDomain!, stage },
    { skip: !shouldFetch }
  );
  const dates = useGetCabPlanDatesQuery();

  // Filter-bar refresh reloads the whole screen - the queue for the current
  // scope plus the plan-date list the modal offers. The queue card keeps its
  // own narrower "Refresh queue" button.
  const { refresh, isRefreshing } = useApiRefresh({
    onRefresh: () => {
      if (shouldFetch) void queue.refetch();
      void dates.refetch();
    },
    isFetching: queue.isFetching || dates.isFetching,
  });
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});
  const [openPlan, setOpenPlan] = useState(false);
  const selected = useMemo(
    () => Object.keys(rowSelection).filter((k) => rowSelection[k]),
    [rowSelection]
  );

  // The scope this screen is currently looking at, spelled out for the user.
  // Rows, counts and empty-state copy are all labelled with it so a stale-looking
  // table can always be traced back to the Domain / Sub Domain it belongs to.
  const scopeLabel = useMemo(() => {
    const domain = options.domain.find((o) => o.value === values.domain)?.label;
    const subDomain = options.subDomain.find((o) => o.value === values.subDomain)?.label;
    return domain && subDomain ? `${domain} › ${subDomain}` : undefined;
  }, [options.domain, options.subDomain, values.domain, values.subDomain]);

  // Scope plus the stage filter, for the empty/error copy.
  const queueScopeLabel =
    scopeLabel && stage !== "All" ? `${scopeLabel} · ${getStageLabel(stage)}` : scopeLabel;

  // Row selection is keyed by CRQ number. Without this, CRQs ticked under one
  // Sub Domain (or stage) stayed selected after switching scope and would have
  // been planned into a CAB session the user could no longer see.
  // Column filters hide rows too, so they clear the selection for the same reason.
  useEffect(() => {
    setRowSelection({});
  }, [values.domain, values.subDomain, stage, columnFilters]);

  // `queue.data` is RTK Query's "last successful result for ANY arg", so it keeps
  // serving the previous Sub Domain's CRQs while the new scope loads or fails.
  // `currentData` is scoped to the current arg — the table must only ever read it.
  const rows = queue.currentData ?? [];
  const isEmptyForScope = shouldFetch && !queue.isFetching && !queue.isError && rows.length === 0;

  const columns = useMemo<MRT_ColumnDef<CabQueueRow>[]>(
    () => [
      {
        accessorKey: "crqNo",
        header: "CRQ No",
        size: 150,
        Cell: ({ row }) => (
          <Typography sx={{ fontFamily: "'Roboto Mono', monospace", color: "primary.main", fontWeight: 500, fontSize: 12.5 }}>
            {row.original.crqNo}
          </Typography>
        ),
      },
      {
        accessorKey: "currentStage",
        header: "Stage",
        size: 150,
        Cell: ({ row }) => <StageChip stage={row.original.currentStage as CrqStage} />,
      },
      {
        accessorKey: "currentStatus",
        header: "Status",
        size: 120,
        Cell: ({ row }) => <StatusChip status={row.original.currentStatus} />,
      },
      {
        accessorKey: "impact",
        header: "Impact",
        size: 100,
        Cell: ({ row }) => <ImpactChip impact={row.original.impact} />,
      },
      { accessorKey: "circle", header: "Circle", size: 130 },
      { accessorKey: "domain", header: "Domain", size: 130 },
      {
        // Sorts on the parsed start time — the raw "DD-MM-YYYY" text would sort
        // by day-of-month. Rows without a window always go last.
        id: "executionWindow",
        accessorFn: (r) => parseExecutionWindow(r.executionWindow)?.start.valueOf(),
        sortUndefined: "last",
        header: "Execution Window",
        size: 160,
        enableColumnFilter: true,
        filterVariant: "date-range",
        filterFn: executionWindowDateFilter,
        muiFilterDatePickerProps: { format: "DD-MM-YYYY" },
        Cell: ({ row }) => {
          const overdue = isWindowOverdue(parseExecutionWindow(row.original.executionWindow));
          return (
            <Tooltip title={overdue ? "Window has already passed" : ""}>
              <Typography
                sx={{
                  fontFamily: "'Roboto Mono', monospace",
                  fontSize: 12,
                  color: overdue ? "error.main" : "text.secondary",
                }}
              >
                {row.original.executionWindow ?? "—"}
              </Typography>
            </Tooltip>
          );
        },
      },
    ],
    []
  );

  const table = useAppTable({
    columns,
    data: rows,
    getRowId: (row) => row.crqNo,
    state: { isLoading: queue.isFetching, rowSelection, columnFilters },
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    enableRowSelection: true,
    // Only Execution Window is filterable; its filter opens from a funnel icon
    // in the column header (the top toolbar is hidden on this table).
    enableColumnFilters: true,
    enableGlobalFilter: false,
    defaultColumn: { enableColumnFilter: false },
    columnFilterDisplayMode: "popover",
    appTable: {
      emptyTitle: "No CRQs match the current table filters",
      // Wrapped in the section's own bordered Paper.
      frame: false,
    },
    initialState: { density: "compact" },
    enableTopToolbar: false,
    muiTableBodyRowProps: { hover: true, sx: { cursor: "pointer" } },
  });

  // Every row in the table's current sort/filter order, not just this page.
  const handleExport = () =>
    exportRowsToExcel(
      table.getPrePaginationRowModel().rows.map((r) => ({
        ...r.original,
        currentStage: getStageLabel(r.original.currentStage),
      })),
      QUEUE_EXPORT_COLUMNS,
      "CAB Waiting Queue",
      "CAB_Waiting_Queue",
    );

  return (
    <Box>
      {/* <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 500, letterSpacing: "-0.3px" }}>CAB Planning</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          Shortlist CRQs awaiting CAB review and group them into a scheduled session.
        </Typography>
      </Box> */}

      <Box sx={{ mb: 2 }}>
        <OrgHierarchyFilters
          role={roleCode}
          values={values}
          options={options}
          onChange={handleChange}
          onRefresh={refresh}
          isRefreshing={isRefreshing}
          refreshDisabled={!shouldFetch}
          refreshTooltip={
            shouldFetch
              ? "Refresh CAB queue"
              : "Pick a Domain and Sub Domain first"
          }
        />
      </Box>

      {/* Waiting Queue */}
      <Paper sx={{ mb: 3, border: "1px solid", borderColor: "divider", overflow: "hidden" }} elevation={0}>
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 500, flexShrink: 0 }}>CAB Waiting Queue</Typography>
            {scopeLabel && (
              <Chip
                size="small"
                variant="outlined"
                label={scopeLabel}
                sx={{ maxWidth: 320, fontSize: 11.5 }}
              />
            )}
            {shouldFetch && !queue.isFetching && !queue.isError && (
              <Typography variant="caption" sx={{ color: "text.secondary", flexShrink: 0 }}>
                {columnFilters.length > 0 ? `${table.getFilteredRowModel().rows.length} of ` : ""}
                {rows.length} CRQ{rows.length === 1 ? "" : "s"}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
            <TextField
              select
              size="small"
              label="Stage"
              value={stage}
              onChange={(e) => setStage(e.target.value as StageFilter)}
              disabled={!shouldFetch}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="All">All stages</MenuItem>
              {STAGES.map((s) => (
                <MenuItem key={s} value={s}>{getStageLabel(s)}</MenuItem>
              ))}
            </TextField>
            {shouldFetch && (
              <Tooltip title="Refresh queue">
                <span>
                  <IconButton
                    size="small"
                    onClick={() => void queue.refetch()}
                    disabled={queue.isFetching}
                  >
                    <RefreshRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            <ExportExcelButton
              onExport={handleExport}
              disabled={!shouldFetch || queue.isFetching || table.getFilteredRowModel().rows.length === 0}
            />
            {selected.length > 0 && (
              <Button variant="contained" startIcon={<EventNoteIcon />} onClick={() => setOpenPlan(true)}>
                Plan CAB · {selected.length} selected
              </Button>
            )}
          </Stack>
        </Box>

        {!shouldFetch ? (
          <CabQueueState kind="idle" />
        ) : queue.isError ? (
          <CabQueueState
            kind="error"
            scopeLabel={queueScopeLabel}
            message={errMsg(queue.error)}
            onRetry={() => void queue.refetch()}
          />
        ) : isEmptyForScope ? (
          <CabQueueState
            kind="empty"
            scopeLabel={queueScopeLabel}
            onRetry={() => void queue.refetch()}
            onChangeScope={resetAll}
          />
        ) : (
          // MRT's date-range column filter renders MUI X date pickers.
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <MaterialReactTable table={table} />
          </LocalizationProvider>
        )}
      </Paper>

      {/* Date-wise CAB plan */}
      <Box sx={{ mb: 2 }}>
        <Typography sx={{ fontWeight: 500 }}>Date-wise CAB Meeting Plan</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          One CAB call per date — grouped CRQs reviewed together by the CAB Engineer.
        </Typography>
      </Box>

      {dates.isLoading ? (
        <Skeleton variant="rounded" height={180} />
      ) : dates.isError ? (
        <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }} elevation={0}>
          <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
            <Typography variant="body2" sx={{ color: "error.main" }}>
              {errMsg(dates.error)}
            </Typography>
            <Button size="small" startIcon={<RefreshRoundedIcon />} onClick={() => void dates.refetch()}>
              Retry
            </Button>
          </Stack>
        </Paper>
      ) : (dates.data?.length ?? 0) === 0 ? (
        <Paper sx={{ p: 3, border: "1px dashed", borderColor: "divider" }} elevation={0}>
          <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
            No CAB meeting dates are on the calendar yet.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {dates.data?.map((d) => {
            const hasSession = Boolean(d.sessionId) && (d.crqIds?.length ?? 0) > 0;
            return (
              <Stack key={d.sessionId ?? d.date} direction="row" spacing={2}>
                <Paper sx={{
                  width: 84, p: 1.5, textAlign: "center",
                  bgcolor: !hasSession ? "#F4F5F7" : d.type === "Critical" ? "#FDECEA" : d.type === "Emergency" ? "#FFF4E5" : "#E3F2FD",
                  color:   !hasSession ? "text.secondary" : d.type === "Critical" ? "#C62828" : d.type === "Emergency" ? "#ED6C02" : "#1565C0",
                  border: "1px solid", borderColor: "divider", flexShrink: 0,
                }} elevation={0}>
                  <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>{d.dayName}</Typography>
                  <Typography sx={{ fontSize: 28, fontWeight: 500 }}>{d.dayNum}</Typography>
                  <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.5 }}>{d.monthName}</Typography>
                </Paper>

                {hasSession ? (
                  <Paper sx={{ flex: 1, p: 2, border: "1px solid", borderColor: "divider", borderLeft: "3px solid", borderLeftColor: d.type === "Critical" ? "#C62828" : "primary.main" }} elevation={0}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Typography sx={{ fontFamily: "'Roboto Mono', monospace", color: "primary.main", fontWeight: 500 }}>{d.sessionId}</Typography>
                      <Chip size="small" label={d.type} />
                      <Typography variant="caption" sx={{ color: "text.secondary", ml: 1 }}>{d.crqIds?.length ?? 0} CRQs</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {(d.crqIds ?? []).map((id) => (
                        <Chip key={id} size="small" label={id} variant="outlined" sx={{ fontFamily: "'Roboto Mono', monospace", fontSize: 11 }} />
                      ))}
                    </Stack>
                  </Paper>
                ) : (
                  <Paper sx={{ flex: 1, p: 2, display: "flex", alignItems: "center", border: "1px dashed", borderColor: "divider" }} elevation={0}>
                    <Typography variant="body2" sx={{ color: "text.secondary", fontStyle: "italic" }}>
                      No CAB session planned for this date.
                    </Typography>
                  </Paper>
                )}
              </Stack>
            );
          })}
        </Stack>
      )}

      <PlanCabModal
        open={openPlan}
        crqIds={selected}
        onClose={() => setOpenPlan(false)}
        onPlanned={() => setRowSelection({})}
      />
    </Box>
  );
}
