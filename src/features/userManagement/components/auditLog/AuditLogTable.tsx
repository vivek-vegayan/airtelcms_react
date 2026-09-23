import { useMemo } from "react";
import { Box, IconButton, Tooltip, Typography, useTheme } from "@mui/material";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_PaginationState,
  type MRT_SortingState,
} from "material-react-table";
import { useAppTable } from "../../../../components/ui/AppTable";
import HistoryToggleOffRoundedIcon from "@mui/icons-material/HistoryToggleOffRounded";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useTabColorTokens } from "../../../../style/theme";
import type { AuditLogEntry } from "../../types/auditLog";
import AuditActionBadge from "./AuditActionBadge";
import {
  formatAuditDate,
  humanise,
  orDash,
} from "./auditLogFormat";

interface Props {
  rows: AuditLogEntry[];
  totalElements: number;
  pagination: MRT_PaginationState;
  onPaginationChange: (updater: any) => void;
  sorting: MRT_SortingState;
  onSortingChange: (updater: any) => void;
  isFetching: boolean;
  isError: boolean;
  errorMessage?: string;
  onView: (row: AuditLogEntry) => void;
}

/**
 * The audit trail itself — one row per recorded action, newest first.
 *
 * Server-driven throughout: `manualPagination` and `manualSorting` are both on,
 * and MRT's own filter UI is off, because paging, sorting, filtering and search
 * are all executed by `sp_get_ui_actions_log`. Turning any of them back on
 * would give the screen two competing notions of "filtered" and, on a table
 * heading for millions of rows, would only ever be sorting the current page.
 *
 * The Date & Time column shows the value the database recorded. Nothing here
 * computes, defaults or shifts it — see `auditLogFormat`.
 */
const AuditLogTable = ({
  rows,
  totalElements,
  pagination,
  onPaginationChange,
  sorting,
  onSortingChange,
  isFetching,
  isError,
  errorMessage,
  onView,
}: Props) => {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);

  const columns = useMemo<MRT_ColumnDef<AuditLogEntry>[]>(
    () => [
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: "Date & Time",
        size: 150,
        Cell: ({ row }) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography
              sx={{ fontSize: 12.5, fontWeight: 600, color: tk.textPrimary, lineHeight: 1.35 }}
            >
              {formatAuditDate(row.original)}
            </Typography>
            <Typography
              sx={{
                fontSize: 11,
                fontFamily: "monospace",
                color: tk.textSecondary,
                lineHeight: 1.35,
              }}
            >
              {orDash(row.original.actionTime)}
            </Typography>
          </Box>
        ),
      },
      {
        accessorKey: "module",
        header: "Module",
        size: 145,
        Cell: ({ cell }) => (
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: tk.textPrimary }}>
            {orDash(cell.getValue<string>())}
          </Typography>
        ),
      },
      {
        accessorKey: "subModule",
        header: "Sub Module",
        size: 145,
        Cell: ({ cell }) => (
          <Typography sx={{ fontSize: 12, color: tk.textSecondary }}>
            {orDash(cell.getValue<string | null>())}
          </Typography>
        ),
      },
      {
        accessorKey: "action",
        header: "Action",
        size: 118,
        Cell: ({ row }) => <AuditActionBadge action={row.original.action} />,
      },
      {
        id: "actor",
        accessorKey: "actorName",
        header: "Actor",
        size: 175,
        Cell: ({ row }) => (
          <Tooltip
            title={humanise(row.original.actorRole)}
            placement="top-start"
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{ fontSize: 12.5, color: tk.textPrimary, lineHeight: 1.35 }}
                noWrap
              >
                {orDash(row.original.actorName)}
              </Typography>
              <Typography
                sx={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: tk.textDim,
                  lineHeight: 1.35,
                }}
                noWrap
              >
                {orDash(row.original.actorOlmid)}
              </Typography>
            </Box>
          </Tooltip>
        ),
      },
      {
        id: "affected",
        accessorKey: "affectedName",
        header: "Affected User",
        size: 175,
        Cell: ({ row }) =>
          row.original.affectedUserId ? (
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{ fontSize: 12.5, color: tk.textPrimary, lineHeight: 1.35 }}
                noWrap
              >
                {orDash(row.original.affectedName)}
              </Typography>
              <Typography
                sx={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: tk.textDim,
                  lineHeight: 1.35,
                }}
                noWrap
              >
                {orDash(row.original.affectedOlmid)}
              </Typography>
            </Box>
          ) : (
            // Not a gap in the data: most actions target a CRQ, a role or a
            // domain rather than a person.
            <Typography sx={{ fontSize: 12, color: tk.textDim }}>—</Typography>
          ),
      },
      {
        accessorKey: "remark",
        header: "Remark",
        size: 280,
        enableSorting: false,
        Cell: ({ cell }) => {
          const remark = cell.getValue<string | null>();
          return (
            <Tooltip title={remark ?? ""} placement="top-start">
              <Typography
                sx={{
                  fontSize: 12,
                  color: tk.textSecondary,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 320,
                }}
              >
                {orDash(remark)}
              </Typography>
            </Tooltip>
          );
        },
      },
    ],
    [tk],
  );

  const table = useAppTable({
    columns,
    data: rows,
    getRowId: (row) => String(row.logId),

    // Everything below is computed by the database. See the class comment.
    manualPagination: true,
    manualSorting: true,
    rowCount: totalElements,
    onPaginationChange,
    onSortingChange,
    state: {
      pagination,
      sorting,
      isLoading: isFetching,
      showProgressBars: isFetching,
    },

    enableColumnFilters: false,
    enableGlobalFilter: false,
    enableRowSelection: false,
    enableSorting: true,
    enableSortingRemoval: false,
    enableMultiSort: false,

    enableRowActions: true,
    positionActionsColumn: "last",
    displayColumnDefOptions: {
      "mrt-row-actions": { header: "", size: 56 },
    },
    renderRowActions: ({ row }) => (
      <Tooltip title="View full audit record">
        <IconButton size="small" onClick={() => onView(row.original)}>
          <VisibilityOutlinedIcon sx={{ fontSize: 17, color: tk.textSecondary }} />
        </IconButton>
      </Tooltip>
    ),

    muiTableContainerProps: { sx: { maxHeight: "62vh" } },
    muiTableBodyRowProps: { sx: { cursor: "default" } },

    renderEmptyRowsFallback: () => (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <HistoryToggleOffRoundedIcon sx={{ fontSize: 34, color: tk.textDim, mb: 1 }} />
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: tk.textSecondary }}>
          {isError ? "Could not load audit logs" : "No audit records"}
        </Typography>
        <Typography sx={{ fontSize: 11.5, color: tk.textDim, mt: 0.5 }}>
          {isError
            ? errorMessage ?? "The audit trail could not be fetched. Try again in a moment."
            : "No user action matches the selected filters."}
        </Typography>
      </Box>
    ),

    initialState: { density: "compact" },
  });

  return <MaterialReactTable table={table} />;
};

export default AuditLogTable;
