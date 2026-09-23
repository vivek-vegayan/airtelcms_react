import {
  Box,
  Button,
  Chip,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_RowSelectionState,
} from "material-react-table";
import { useAppTable } from "../../../components/ui/AppTable";
import EventNoteIcon from "@mui/icons-material/EventNote";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { useEffect, useMemo, useState } from "react";
import { authStorage } from "../../../app/store/auth.storage";
import OrgHierarchyFilters from "../../orgHierarchy/components/OrgHierarchyFiltersV2";
import { useOrgHierarchyState } from "../../orgHierarchy/hooks/useOrgHierarchyState";
import { useOrgHierarchyFilters } from "../../orgHierarchy/hooks/useOrgHierarchyFilters";
import { useApiRefresh } from "../../../hooks/useApiRefresh";
import { useGetCabPlanDatesQuery, useGetCabQueueQuery } from "../api/cabManagerApiSlice";
import { PlanCabModal } from "../components/modals/PlanCabModal";
import { CabQueueState } from "../components/shared/CabQueueState";
import { ImpactChip } from "../components/shared/Chips";
import { errMsg } from "../components/shared/errMsg";
import type { CabQueueRow } from "../types/types";

export function CabPlanningPage() {
  const roleCode = authStorage.getUser()?.roleCode ?? "TEAM_MEMBER";
  const { values, handleChange, resetAll } = useOrgHierarchyState("cabPlanning");
  const { options } = useOrgHierarchyFilters(values);

  const shouldFetch = Boolean(values.domain) && values.subDomain != null;
  const queue = useGetCabQueueQuery(
    { domainId: values.domain!, subDomainId: values.subDomain! },
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

  // Row selection is keyed by CRQ number. Without this, CRQs ticked under one
  // Sub Domain stayed selected after switching scope and would have been planned
  // into a CAB session the user could no longer see.
  useEffect(() => {
    setRowSelection({});
  }, [values.domain, values.subDomain]);

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
        accessorKey: "impact",
        header: "Impact",
        size: 100,
        Cell: ({ row }) => <ImpactChip impact={row.original.impact} />,
      },
      { accessorKey: "circle", header: "Circle", size: 130 },
      { accessorKey: "domain", header: "Domain", size: 130 },
      {
        accessorKey: "executionWindow",
        header: "Execution Window",
        size: 160,
        Cell: ({ row }) => (
          <Typography sx={{ fontFamily: "'Roboto Mono', monospace", fontSize: 12, color: "text.secondary" }}>
            {row.original.executionWindow}
          </Typography>
        ),
      },
    ],
    []
  );

  const table = useAppTable({
    columns,
    data: rows,
    getRowId: (row) => row.crqNo,
    state: { isLoading: queue.isFetching, rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    appTable: {
      emptyTitle: "No CRQs match the current table filters",
      // Wrapped in the section's own bordered Paper.
      frame: false,
    },
    initialState: { density: "compact" },
    enableTopToolbar: false,
    muiTableBodyRowProps: { hover: true, sx: { cursor: "pointer" } },
  });

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
                {rows.length} CRQ{rows.length === 1 ? "" : "s"}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
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
            scopeLabel={scopeLabel}
            message={errMsg(queue.error)}
            onRetry={() => void queue.refetch()}
          />
        ) : isEmptyForScope ? (
          <CabQueueState
            kind="empty"
            scopeLabel={scopeLabel}
            onRetry={() => void queue.refetch()}
            onChangeScope={resetAll}
          />
        ) : (
          <MaterialReactTable table={table} />
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
