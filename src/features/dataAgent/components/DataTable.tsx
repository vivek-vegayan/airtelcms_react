import { useMemo } from "react";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { useAppTable } from "../../../components/ui/AppTable";
import type { WidgetData } from "../types/dataAgent.types";

export default function DataTable({ data }: { data: WidgetData }) {
  const columns = useMemo<MRT_ColumnDef<Record<string, unknown>>[]>(
    () => data.columns.map((col) => ({ accessorKey: col, header: col })),
    [data.columns],
  );

  const table = useAppTable({
    columns,
    data: data.rows,
    enableColumnFilters: false,
    enableHiding: false,
    enableTopToolbar: data.rows.length > 0,
    enableBottomToolbar: data.rows.length > 8,
    enablePagination: data.rows.length > 8,
    initialState: { density: "compact", pagination: { pageSize: 8, pageIndex: 0 } },
    muiTableContainerProps: { sx: { maxHeight: 320 } },
    muiSearchTextFieldProps: { placeholder: "Search…", size: "small", variant: "outlined" },
  });

  return <MaterialReactTable table={table} />;
}
