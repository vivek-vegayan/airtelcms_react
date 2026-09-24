import { useMemo, useState } from "react";
import { Box, Chip, FormControlLabel, Switch, TextField, Typography, useTheme } from "@mui/material";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { useTabColorTokens } from "../../../style/theme";
import { useAppTable } from "../../../components/ui/AppTable";
import { errMsg } from "../../cabManager/components/shared/errMsg";
import {
  formatDateTime,
  formatWindow,
  orDash,
} from "../../scheduler/sub-feature/cancelledCrq/cancelledCrqFormat";
import { useGetReassignHistoryQuery } from "../api/crqReassignApi";
import type { ReassignHistoryRow } from "../types/crqReassign.types";

interface Props {
  batchId: string | null;
}

/** Audit trail of the page (CRQ_SP_REASSIGN_HISTORY, newest first, max 500). */
export const HistoryView = ({ batchId }: Props) => {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);
  const [crqNo, setCrqNo] = useState("");
  const [onlyBatch, setOnlyBatch] = useState(false);
  const [fromTs, setFromTs] = useState("");
  const [toTs, setToTs] = useState("");

  const { data: rows = [], isFetching, isError, error } = useGetReassignHistoryQuery({
    crqNo: crqNo.trim() || undefined,
    batchId: onlyBatch && batchId ? batchId : undefined,
    fromTs: fromTs ? `${fromTs.replace("T", " ")}:00` : undefined,
    toTs: toTs ? `${toTs.replace("T", " ")}:59` : undefined,
  });

  const columns = useMemo<MRT_ColumnDef<ReassignHistoryRow>[]>(
    () => [
      {
        accessorKey: "txn_on",
        header: "When",
        size: 120,
        Cell: ({ cell }) => (
          <Typography sx={{ fontSize: 12, color: tk.textSecondary }}>{formatDateTime(cell.getValue<string>())}</Typography>
        ),
      },
      {
        accessorKey: "txn_type",
        header: "Type",
        size: 90,
        Cell: ({ row }) => (
          <Chip
            size="small"
            label={row.original.txn_type}
            sx={{
              height: 21,
              fontSize: 11,
              fontWeight: 700,
              color: tk.info,
              bgcolor: tk.infoDim,
              border: `1px solid ${tk.infoBorder}`,
            }}
          />
        ),
      },
      {
        accessorKey: "crq_no",
        header: "CRQ No.",
        size: 125,
        Cell: ({ cell }) => (
          <Typography sx={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>{cell.getValue<string>()}</Typography>
        ),
      },
      {
        id: "stage",
        header: "Stage",
        size: 100,
        accessorFn: (r) => r.stage_name ?? r.stage,
        Cell: ({ row }) => <Typography sx={{ fontSize: 12 }}>{orDash(row.original.stage_name ?? row.original.stage)}</Typography>,
      },
      {
        id: "owner",
        header: "Owner",
        size: 150,
        accessorFn: (r) => r.new_olmid,
        Cell: ({ row }) => {
          const r = row.original;
          if (!r.old_olmid && !r.new_olmid) return <Typography sx={{ fontSize: 12 }}>—</Typography>;
          return (
            <Typography sx={{ fontSize: 12 }}>
              {r.old_owner ?? orDash(r.old_olmid)} → {r.new_owner ?? orDash(r.new_olmid)}
            </Typography>
          );
        },
      },
      {
        id: "time",
        header: "Time",
        size: 170,
        accessorFn: (r) => r.new_start,
        Cell: ({ row }) => {
          const r = row.original;
          if (!r.old_start && !r.new_start) return <Typography sx={{ fontSize: 12 }}>—</Typography>;
          return (
            <Box>
              <Typography sx={{ fontSize: 11, color: tk.textDim }}>{formatWindow(r.old_start, r.old_end)}</Typography>
              <Typography sx={{ fontSize: 11.5, color: tk.textPrimary }}>{formatWindow(r.new_start, r.new_end)}</Typography>
            </Box>
          );
        },
      },
      {
        id: "cab",
        header: "CAB",
        size: 110,
        accessorFn: (r) => r.new_cab_flag,
        Cell: ({ row }) =>
          row.original.new_cab_flag ? (
            <Typography sx={{ fontSize: 12 }}>
              {orDash(row.original.old_cab_flag)} → {row.original.new_cab_flag}
            </Typography>
          ) : (
            <Typography sx={{ fontSize: 12 }}>—</Typography>
          ),
      },
      {
        accessorKey: "minutes_moved",
        header: "Min moved",
        size: 65,
        Cell: ({ cell }) => <Typography sx={{ fontSize: 12 }}>{orDash(cell.getValue<number>())}</Typography>,
      },
      {
        id: "state",
        header: "State",
        size: 80,
        accessorFn: (r) => r.is_published,
        Cell: ({ row }) => {
          const r = row.original;
          const label = r.is_reverted ? "Undone" : r.is_published ? "Published" : "Draft";
          const c = r.is_reverted
            ? { fg: tk.textSecondary, bg: tk.surface2, br: tk.border }
            : r.is_published
              ? { fg: tk.success, bg: tk.successDim, br: tk.successBorder }
              : { fg: tk.warning, bg: tk.warningDim, br: tk.warningBorder };
          return (
            <Chip
              size="small"
              label={label}
              sx={{ height: 21, fontSize: 11, fontWeight: 700, color: c.fg, bgcolor: c.bg, border: `1px solid ${c.br}` }}
            />
          );
        },
      },
      {
        accessorKey: "remarks",
        header: "Remarks",
        size: 110,
        Cell: ({ cell }) => <Typography sx={{ fontSize: 12 }}>{orDash(cell.getValue<string>())}</Typography>,
      },
      {
        accessorKey: "txn_by",
        header: "By",
        size: 85,
        Cell: ({ cell }) => <Typography sx={{ fontSize: 12, fontFamily: "monospace" }}>{cell.getValue<string>()}</Typography>,
      },
    ],
    [tk],
  );

  const table = useAppTable({
    columns,
    data: rows,
    getRowId: (r) => String(r.log_id),
    appTable: {
      // Same small scroll as Time Slot / Member; header row stays pinned.
      maxHeight: "calc(100vh - 490px)",
      emptyTitle: isError ? "Could not load history" : "No history",
      emptyDescription: isError ? errMsg(error) : "No reassignment changes match these filters.",
      isError,
    },
    state: { isLoading: isFetching, showProgressBars: isFetching },
    enableColumnFilters: false,
    enableGlobalFilter: false,
    enableRowSelection: false,
    enableRowActions: false,
    // Columns stretch to the card width instead of scrolling sideways.
    layoutMode: "grid",
    defaultColumn: { grow: 1, minSize: 80 },
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, minWidth: 0 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
        <TextField size="small" label="CRQ No." value={crqNo} onChange={(e) => setCrqNo(e.target.value)} sx={{ width: 180 }} />
        <TextField
          type="datetime-local"
          size="small"
          label="From"
          value={fromTs}
          onChange={(e) => setFromTs(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <TextField
          type="datetime-local"
          size="small"
          label="To"
          value={toTs}
          onChange={(e) => setToTs(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
        />
        <FormControlLabel
          disabled={!batchId}
          control={<Switch size="small" checked={onlyBatch} onChange={(e) => setOnlyBatch(e.target.checked)} />}
          label={<Typography sx={{ fontSize: 13 }}>Current batch only</Typography>}
        />
      </Box>
      <MaterialReactTable table={table} />
    </Box>
  );
};

export default HistoryView;
