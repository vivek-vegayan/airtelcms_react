import { useMemo } from "react";
import { Box } from "@mui/material";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { useAppTable } from "../../../components/ui/AppTable";
import { TableSkeleton } from "../../../components/loading/Skeletons";
import { EmptyOrErrorState } from "./EmptyOrErrorState";
import type { ViewAllResponse } from "../types/crqAnalytics.types";

// Placeholder header cells for the skeleton; the real headers aren't known until the response arrives.
const SKELETON_COLUMNS = ["c1", "c2", "c3", "c4", "c5"];

interface Props {
  response: ViewAllResponse | undefined;
  isLoading?: boolean;
  isError?: boolean;
  /** Body height cap; defaults to filling the screen under the title bar. */
  maxHeight?: string;
  /** Opens the CRQ Journey for a row; only wired when the response carries a CRQ number column. */
  onRowClick?: (crqNo: string) => void;
}

export const VIEW_ALL_FULL_HEIGHT = "max(320px, calc(100vh - 230px))";

/** "CRQ No.", "crq_number", "CRQ ID", "CRQ" → the column holding the CRQ number. */
const isCrqNoHeader = (header: string) => /^crq(no|number|num|id)?$/.test(header.toLowerCase().replace(/[^a-z]/g, ""));

/** Renders whatever columns the backend's view-all procedure selected. When
 * those include a CRQ number, clicking a row drills into that CRQ's journey. */
export function GenericViewAllTable({ response, isLoading, isError, maxHeight = VIEW_ALL_FULL_HEIGHT, onRowClick }: Props) {
  const headers = response?.headers ?? [];
  const crqNoKey = onRowClick ? headers.find(isCrqNoHeader) : undefined;

  const columns = useMemo<MRT_ColumnDef<Record<string, string | number | null>>[]>(
    () => headers.map((h) => ({ accessorKey: h, header: h })),
    [headers],
  );

  const table = useAppTable({
    columns,
    data: response?.data ?? [],
    state: { isLoading },
    enableColumnFilters: false,
    muiTableBodyRowProps: ({ row }) => {
      const crqNo = crqNoKey ? row.original[crqNoKey] : null;
      return crqNo != null && crqNo !== ""
        ? { onClick: () => onRowClick?.(String(crqNo)), sx: { cursor: "pointer" } }
        : {};
    },
    renderEmptyRowsFallback: () => (
      <Box sx={{ py: 4 }}>
        <EmptyOrErrorState kind={isError ? "error" : "empty"} />
      </Box>
    ),
    initialState: { density: "compact", pagination: { pageIndex: 0, pageSize: 50 } },
    // Full-screen view: the body fills the space left under the title bar
    // (AppTable's default viewport cap) and scrolls under a sticky header.
    appTable: { maxHeight },
  });

  // Columns come from the response, so until the first one arrives the table
  // has nothing to draw skeleton rows in and would read as empty.
  if (isLoading && headers.length === 0) {
    return <TableSkeleton rows={8} columnHeaders={SKELETON_COLUMNS} />;
  }

  return <MaterialReactTable table={table} />;
}
