import { useMemo } from "react";
import { Box, Chip, Tooltip, Typography, useTheme } from "@mui/material";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_PaginationState,
} from "material-react-table";
import { useTabColorTokens } from "../../../../../style/theme";
import { useAppTable } from "../../../../../components/ui/AppTable";
import type { CancelledCrq } from "../../../types/cancelledCrq.types";
import { formatDateTime, orDash, stageLabel } from "../cancelledCrqFormat";
import CancelledCrqDetail from "./CancelledCrqDetail";

interface Props {
  rows: CancelledCrq[];
  totalElements: number;
  pagination: MRT_PaginationState;
  onPaginationChange: (updater: any) => void;
  isFetching: boolean;
  isError: boolean;
}

/**
 * The register itself: one row per cancelled CRQ, newest cancellation first.
 *
 * Server-paged (`manualPagination`) because the population is unbounded — the
 * backing procedure returns the true total alongside each page, so the footer
 * count is the real one and not "however many rows happen to be loaded".
 *
 * There is no row action, no selection column and no context menu: the CRQ is
 * terminal and the screen is a record. Expanding a row opens the full
 * cancellation dossier instead, which is the one thing a reader of this page
 * actually wants to do.
 */
export const CancelledCrqTable = ({
  rows,
  totalElements,
  pagination,
  onPaginationChange,
  isFetching,
  isError,
}: Props) => {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);

  const columns = useMemo<MRT_ColumnDef<CancelledCrq>[]>(
    () => [
      {
        accessorKey: "crqNo",
        header: "CRQ No.",
        size: 160,
        Cell: ({ cell }) => (
          <Typography
            sx={{ fontSize: 12.5, fontWeight: 700, fontFamily: "monospace", color: tk.textPrimary }}
          >
            {cell.getValue<string>()}
          </Typography>
        ),
      },
      {
        accessorKey: "planNumber",
        header: "Plan",
        size: 200,
        Cell: ({ row }) => (
          <Tooltip title={orDash(row.original.planType)} placement="top-start">
            <Typography sx={{ fontSize: 12, fontFamily: "monospace", color: tk.textSecondary }}>
              {orDash(row.original.planNumber)}
            </Typography>
          </Tooltip>
        ),
      },
      {
        accessorKey: "cancelledStage",
        header: "Cancelled at stage",
        size: 150,
        Cell: ({ cell }) => (
          <Chip
            size="small"
            label={stageLabel(cell.getValue<string>())}
            sx={{
              height: 21,
              fontSize: 11,
              fontWeight: 700,
              color: tk.danger,
              bgcolor: tk.dangerDim,
              border: `1px solid ${tk.dangerBorder}`,
            }}
          />
        ),
      },
      {
        accessorKey: "cancellationReason",
        header: "Reason",
        size: 145,
        Cell: ({ cell }) => (
          <Typography sx={{ fontSize: 12, color: tk.textPrimary }}>
            {orDash(cell.getValue<string>())}
          </Typography>
        ),
      },
      {
        accessorKey: "cancelledSource",
        header: "Source",
        size: 92,
        Cell: ({ cell }) => {
          const remedy = cell.getValue<string>() === "Remedy";
          return (
            <Chip
              size="small"
              label={cell.getValue<string>() ?? "—"}
              sx={{
                height: 21,
                fontSize: 11,
                fontWeight: 700,
                color: remedy ? tk.info : tk.accent,
                bgcolor: remedy ? tk.infoDim : tk.accentDim,
                border: `1px solid ${remedy ? tk.infoBorder : tk.accentBorder}`,
              }}
            />
          );
        },
      },
      {
        accessorKey: "cancelledBy",
        header: "Cancelled by",
        size: 130,
        Cell: ({ row }) => (
          <Tooltip title={orDash(row.original.cancelledBy)} placement="top-start">
            <Typography sx={{ fontSize: 12, color: tk.textPrimary }}>
              {row.original.cancelledByName ?? orDash(row.original.cancelledBy)}
            </Typography>
          </Tooltip>
        ),
      },
      {
        accessorKey: "cancelledAt",
        header: "Cancelled on",
        size: 150,
        Cell: ({ cell }) => (
          <Typography sx={{ fontSize: 12, color: tk.textSecondary }}>
            {formatDateTime(cell.getValue<string>())}
          </Typography>
        ),
      },
      {
        accessorKey: "daysToCancel",
        header: "Age at cancel",
        size: 88,
        Cell: ({ cell }) => {
          const days = cell.getValue<number | null>();
          return (
            <Typography sx={{ fontSize: 12, color: tk.textSecondary }}>
              {days === null || days === undefined ? "—" : `${days}d`}
            </Typography>
          );
        },
      },
      {
        id: "scope",
        header: "Domain / Sub domain",
        size: 175,
        accessorFn: (row) =>
          `${row.domainName ?? "—"} / ${row.subDomainName ?? "—"}`,
        Cell: ({ row }) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 12, color: tk.textPrimary, lineHeight: 1.35 }}>
              {orDash(row.original.domainName)}
            </Typography>
            <Typography sx={{ fontSize: 11, color: tk.textDim, lineHeight: 1.35 }}>
              {orDash(row.original.subDomainName)}
            </Typography>
          </Box>
        ),
      },
      {
        accessorKey: "taskCount",
        header: "Tasks",
        size: 72,
        Cell: ({ cell }) => (
          <Chip
            size="small"
            label={cell.getValue<number>() ?? 0}
            sx={{
              height: 20,
              minWidth: 28,
              fontSize: 11,
              fontWeight: 800,
              color: tk.textSecondary,
              bgcolor: tk.surface2,
              border: `1px solid ${tk.border}`,
            }}
          />
        ),
      },
    ],
    [tk],
  );

  const table = useAppTable({
    columns,
    data: rows,
    getRowId: (row) => String(row.crqId),

    appTable: {
      emptyTitle: isError ? "Could not load cancelled CRQs" : "No cancelled CRQs",
      emptyDescription: isError
        ? "The registry could not be fetched. Try again in a moment."
        : "Nothing in the selected scope has been cancelled.",
      isError,
    },

    // Server-side paging; search and org filtering are handled by the page's
    // own filter bar (they are backend parameters, not client-side column
    // filters), so MRT's own filter UI stays off to avoid two competing
    // notions of "filtered".
    manualPagination: true,
    rowCount: totalElements,
    onPaginationChange,
    state: { pagination, isLoading: isFetching, showProgressBars: isFetching },

    enableColumnFilters: false,
    enableGlobalFilter: false,
    enableRowSelection: false,
    enableRowActions: false,
    enableSorting: false,

    // Default ("semantic") layout, with the column sizes below kept to a sum
    // that fits a normal desktop width. Two earlier shapes were rejected:
    // wider fixed sizes pushed the last columns off the right edge, and
    // layoutMode "grid" made the expanded detail panel inherit a single
    // column's width instead of the row's, squeezing the dossier into a
    // third of the page.
    //
    // The dossier lives here rather than in a dialog: a register is read by
    // scanning and then opening one entry, and an inline panel keeps the
    // reader's place in the list.
    renderDetailPanel: ({ row }) => <CancelledCrqDetail crq={row.original} />,

    muiDetailPanelProps: { sx: { p: 0, bgcolor: "transparent" } },
  });

  return <MaterialReactTable table={table} />;
};

export default CancelledCrqTable;
