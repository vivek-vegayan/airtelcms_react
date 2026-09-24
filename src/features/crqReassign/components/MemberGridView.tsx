import { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, LinearProgress, Menu, MenuItem, Typography } from "@mui/material";
import { MaterialReactTable, type MRT_ColumnDef, type MRT_PaginationState } from "material-react-table";
import { useAppTable } from "../../../components/ui/AppTable";
import { errMsg } from "../../cabManager/components/shared/errMsg";
import { formatWindow, orDash, stageLabel } from "../../scheduler/sub-feature/cancelledCrq/cancelledCrqFormat";
import { useGetReassignGridQuery, useReassignCabMutation } from "../api/crqReassignApi";
import type { CabFlag, ReassignGridRow } from "../types/crqReassign.types";
import { CAB_FLAGS, isPairedStage, STAGE_NAMES, STAGE_OWNER_COLUMNS } from "../utils/crqReassign.utils";
import { useReassignTokens } from "../hooks/useReassignTokens";
import StageOwnerDrawer, { type StageSelection } from "./StageOwnerDrawer";
import { DetailTip, HintBar, type Note } from "./reassignUi";

interface Props {
  teamId?: number;
  search: string;
  cab: string;
  onlyGaps: boolean;
  batchId: string | null;
  note: Note | null;
  setNote: (note: Note | null) => void;
  onBatch: (batchId: string | null) => void;
  onTotal: (total: number) => void;
}

/** Member view: one row per CRQ, one column per stage owner (CRQ_SP_REASSIGN_GRID). */
export const MemberGridView = ({ teamId, search, cab, onlyGaps, batchId, note, setNote, onBatch, onTotal }: Props) => {
  const { tk } = useReassignTokens();
  const [sel, setSel] = useState<StageSelection | null>(null);
  const [cabMenu, setCabMenu] = useState<{ el: HTMLElement; crqNo: string | null } | null>(null);

  // A page number only counts for the filters it was picked under.
  const filterKey = `${teamId ?? ""}|${search}|${cab}|${onlyGaps}`;
  const [paging, setPaging] = useState({ key: filterKey, state: { pageIndex: 0, pageSize: 10 } as MRT_PaginationState });
  const pagination = paging.key === filterKey ? paging.state : { ...paging.state, pageIndex: 0 };

  const { data: rows = [], isFetching, isError, error } = useGetReassignGridQuery({
    search: search || undefined,
    teamId,
    cab,
    onlyGaps,
    page: pagination.pageIndex + 1,
    size: pagination.pageSize,
  });
  const [reassignCab, { isLoading: cabSaving }] = useReassignCabMutation();

  const total = Number(rows[0]?.total_rows ?? 0);
  useEffect(() => onTotal(total), [total, onTotal]);

  const applyCab = async (flag: CabFlag) => {
    const crqNo = cabMenu?.crqNo ?? null;
    setCabMenu(null);
    try {
      const res = await reassignCab({ crqNo, teamId: crqNo ? null : teamId, cabFlag: flag, batchId }).unwrap();
      onBatch(res.batchId);
      setNote({ text: res.message, bad: false });
    } catch (e) {
      setNote({ text: errMsg(e), bad: true });
    }
  };

  const cabTone = (flag: string | null) =>
    flag === "APPROVED"
      ? { fg: tk.success, bg: tk.successDim, br: tk.successBorder }
      : flag === "REJECTED"
        ? { fg: tk.danger, bg: tk.dangerDim, br: tk.dangerBorder }
        : { fg: tk.warning, bg: tk.warningDim, br: tk.warningBorder };

  const columns = useMemo<MRT_ColumnDef<ReassignGridRow>[]>(
    () => [
      {
        accessorKey: "crq_no",
        header: "CRQ No.",
        size: 165,
        Cell: ({ row: { original: r } }) => {
          const filled = Number(r.filled_stages ?? 0);
          const all = Number(r.total_stages ?? 0) || STAGE_OWNER_COLUMNS.length;
          return (
            <Box sx={{ minWidth: 0 }}>
              <DetailTip
                title={r.crq_no}
                details={[
                  ["Stage", stageLabel(r.current_stage)],
                  ["Status", orDash(r.current_status)],
                  ["CAB", orDash(r.cab_approval_flag)],
                  ["Execution", formatWindow(r.execution_slot_start, r.execution_slot_end)],
                  ["Draft batch", r.open_batch_id ? r.open_batch_id.slice(0, 8) : ""],
                ]}
              >
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, fontFamily: "monospace", color: tk.textPrimary }}>
                  {r.crq_no}
                </Typography>
              </DetailTip>
              <Typography sx={{ fontSize: 11, color: tk.textDim }} noWrap>
                {orDash(r.team_name)} · {stageLabel(r.current_stage)}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                <LinearProgress
                  variant="determinate"
                  value={(filled / all) * 100}
                  color={filled >= all ? "success" : "warning"}
                  sx={{ width: 70, height: 4, borderRadius: 2 }}
                />
                <Typography sx={{ fontSize: 10.5, color: tk.textSecondary }}>{filled}/{all} owned</Typography>
              </Box>
            </Box>
          );
        },
      },
      {
        accessorKey: "cab_approval_flag",
        header: "CAB",
        size: 95,
        Cell: ({ row: { original: r } }) => {
          const c = cabTone(r.cab_approval_flag);
          return (
            <Chip
              size="small"
              clickable
              disabled={cabSaving}
              label={orDash(r.cab_approval_flag)}
              onClick={(e) => setCabMenu({ el: e.currentTarget, crqNo: r.crq_no })}
              sx={{ height: 22, fontSize: 11, fontWeight: 700, color: c.fg, bgcolor: c.bg, border: `1px solid ${c.br}` }}
            />
          );
        },
      },
      ...STAGE_OWNER_COLUMNS.map<MRT_ColumnDef<ReassignGridRow>>(({ stage, key }) => ({
        id: key,
        header: STAGE_NAMES[stage],
        size: 112,
        accessorFn: (r) => r[key],
        muiTableHeadCellProps: isPairedStage(stage) ? { sx: { bgcolor: tk.accentDim } } : undefined,
        Cell: ({ row: { original: r } }) => {
          const owner = r[key] as string | null;
          const active =
            sel?.row.crq_no === r.crq_no && (sel.stage === stage || (isPairedStage(stage) && isPairedStage(sel.stage)));
          return (
            <Box
              onClick={() => setSel({ row: r, stage, owner })}
              sx={{
                cursor: "pointer",
                px: 1,
                py: 0.75,
                borderRadius: tk.radius,
                bgcolor: active ? tk.accentDim : owner ? tk.surface2 : "transparent",
                border: `1px ${owner || active ? "solid" : "dashed"} ${active ? tk.accent : tk.border}`,
                transition: "border-color .15s, background .15s",
                "&:hover": { borderColor: tk.accent },
              }}
            >
              <Typography
                sx={{ fontSize: 12, fontWeight: owner ? 600 : 400, color: owner ? tk.textPrimary : tk.textDim, fontFamily: owner ? "monospace" : "inherit" }}
                noWrap
              >
                {owner ?? "Unassigned"}
              </Typography>
            </Box>
          );
        },
      })),
    ],
    // cabTone / setters are stable per theme; sel drives the highlight.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tk, sel, cabSaving],
  );

  const table = useAppTable({
    columns,
    data: rows,
    getRowId: (r) => r.crq_no,
    appTable: {
      // Same small scroll as the Time Slot grid; the header row stays pinned (sticky header is on by default).
      maxHeight: "calc(100vh - 550px)",
      pageSizes: [10, 20, 50],
      showAllOption: false,
      emptyTitle: isError ? "Could not load CRQs" : "No CRQs",
      emptyDescription: isError ? errMsg(error) : "No open CRQ matches the current filters.",
      isError,
    },
    manualPagination: true,
    rowCount: total,
    onPaginationChange: (updater) =>
      setPaging({ key: filterKey, state: typeof updater === "function" ? updater(pagination) : updater }),
    state: { pagination, isLoading: isFetching && rows.length === 0, showProgressBars: isFetching },
    enableColumnFilters: false,
    enableGlobalFilter: false,
    enableRowSelection: false,
    enableRowActions: false,
    enableSorting: false,
    // Columns stretch to the card width instead of scrolling sideways.
    layoutMode: "grid",
    defaultColumn: { grow: 1, minSize: 80 },
  });

  return (
    <Box>
      <HintBar note={note}>
        <Box component="span" sx={{ fontWeight: 600, color: tk.textPrimary }}>
          Click a stage cell to change its owner.
        </Box>
        <Box component="span">
          MOP Creation and MOP Validation need different owners · Network Execution and Task Closure share one owner.
        </Box>
        {teamId ? (
          <Button
            size="small"
            variant="outlined"
            onClick={(e) => setCabMenu({ el: e.currentTarget, crqNo: null })}
            sx={{ textTransform: "none", height: 28 }}
          >
            Set CAB for whole team
          </Button>
        ) : null}
      </HintBar>

      <Box sx={{ p: 1.5 }}>
        <MaterialReactTable table={table} />
      </Box>

      <StageOwnerDrawer
        key={sel ? `${sel.row.crq_no}|${sel.stage}` : "closed"}
        sel={sel}
        batchId={batchId}
        onBatch={onBatch}
        setNote={setNote}
        onClose={() => setSel(null)}
      />

      <Menu anchorEl={cabMenu?.el} open={!!cabMenu} onClose={() => setCabMenu(null)}>
        <MenuItem disabled sx={{ fontSize: 12, opacity: "1 !important" }}>
          {cabMenu?.crqNo ? `Set CAB · ${cabMenu.crqNo}` : "Set CAB · every open CRQ of the team"}
        </MenuItem>
        {CAB_FLAGS.map((f) => (
          <MenuItem key={f} onClick={() => applyCab(f)} sx={{ fontSize: 13 }}>
            {f}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default MemberGridView;
