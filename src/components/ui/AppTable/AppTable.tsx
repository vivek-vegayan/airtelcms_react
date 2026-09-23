import { MaterialReactTable, type MRT_RowData } from "material-react-table";

import { useAppTable, type AppTableOptions } from "./useAppTable";

/**
 * The application's table.
 *
 * Use this for the common case — pass `columns`, `data` and whatever the
 * screen genuinely needs, and the shared frame, header treatment, density,
 * responsive behaviour and rows-per-page ladder come with it:
 *
 *   <AppTable columns={columns} data={rows} state={{ isLoading }} />
 *
 * Reach for {@link useAppTable} instead when the screen needs the table
 * instance itself (custom toolbars, row virtualisation, imperative calls).
 */
export function AppTable<TData extends MRT_RowData>(props: AppTableOptions<TData>) {
  const table = useAppTable(props);
  return <MaterialReactTable table={table} />;
}

export default AppTable;
