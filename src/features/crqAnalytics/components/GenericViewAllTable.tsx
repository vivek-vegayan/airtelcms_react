import { useMemo } from "react";
import { Box } from "@mui/material";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { useAppTable } from "../../../components/ui/AppTable";
import { EmptyOrErrorState } from "./EmptyOrErrorState";
import type { ViewAllResponse } from "../types/crqAnalytics.types";

interface Props {
  response: ViewAllResponse | undefined;
  isLoading?: boolean;
  isError?: boolean;
}

/** Renders whatever columns the backend's view-all procedure selected — these
 * are aggregate rows (per circle/domain/date/...), not individual CRQs, so
 * there's no per-row detail to drill into. */
export function GenericViewAllTable({ response, isLoading, isError }: Props) {
  const headers = response?.headers ?? [];

  const columns = useMemo<MRT_ColumnDef<Record<string, string | number | null>>[]>(
    () => headers.map((h) => ({ accessorKey: h, header: h })),
    [headers],
  );

  const table = useAppTable({
    columns,
    data: response?.data ?? [],
    state: { isLoading },
    enableColumnFilters: false,
    renderEmptyRowsFallback: () => (
      <Box sx={{ py: 4 }}>
        <EmptyOrErrorState kind={isError ? "error" : "empty"} />
      </Box>
    ),
    initialState: { density: "compact" },
  });

  return <MaterialReactTable table={table} />;
}
