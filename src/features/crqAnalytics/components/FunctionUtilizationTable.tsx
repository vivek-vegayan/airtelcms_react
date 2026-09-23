import { useMemo, useState } from "react";
import { Box, LinearProgress, Typography } from "@mui/material";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_PaginationState,
} from "material-react-table";
import { useAppTable } from "../../../components/ui/AppTable";
import { EmptyOrErrorState } from "./EmptyOrErrorState";

export interface FunctionUtilizationRow {
  teamFunction: string;
  totalEngineers: number;
  totalTasks: number;
  plannedHrs: number;
  actualHrs: number;
  avgUtilizationPct: number;
}

interface Props {
  rows: FunctionUtilizationRow[];
  isLoading?: boolean;
  isError?: boolean;
}

const utilizationColor = (pct: number): "success" | "warning" | "error" => (pct >= 80 ? "success" : pct >= 50 ? "warning" : "error");

/** Aggregated view — one row per team function, not per engineer. Deliberately
 * a separate table from EngineerUtilizationTable rather than the same columns
 * with different rows, since that's what the old "Bin/Team" view actually was. */
export function FunctionUtilizationTable({ rows, isLoading, isError }: Props) {
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });

  const columns = useMemo<MRT_ColumnDef<FunctionUtilizationRow>[]>(
    () => [
      { accessorKey: "teamFunction", header: "Function", size: 160 },
      { accessorKey: "totalEngineers", header: "Engineers", size: 100 },
      { accessorKey: "totalTasks", header: "Total Tasks", size: 100 },
      {
        accessorKey: "plannedHrs",
        header: "Planned (h)",
        size: 100,
        Cell: ({ cell }) => `${cell.getValue<number>()}h`,
      },
      {
        accessorKey: "actualHrs",
        header: "Actual (h)",
        size: 100,
        Cell: ({ cell }) => `${cell.getValue<number>()}h`,
      },
      {
        accessorKey: "avgUtilizationPct",
        header: "Avg Utilization",
        size: 150,
        Cell: ({ cell }) => {
          const pct = cell.getValue<number>();
          return (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LinearProgress
                variant="determinate"
                value={Math.min(100, pct)}
                color={utilizationColor(pct)}
                sx={{ flex: 1, height: 6, borderRadius: 3 }}
              />
              <Typography sx={{ fontSize: 12, fontWeight: 700, minWidth: 34 }}>{pct}%</Typography>
            </Box>
          );
        },
      },
    ],
    [],
  );

  const table = useAppTable({
    columns,
    data: rows,
    onPaginationChange: setPagination,
    state: { isLoading, pagination },
    enableColumnFilters: false,

    // Bounded like the engineer table beside it, so the dashboard card
    // scrolls its own body instead of growing when "All" is picked.
    appTable: { maxHeight: { xs: 300, md: 380, lg: 440, xl: 520 } },
    muiTableContainerProps: { sx: { minHeight: 200 } },

    renderEmptyRowsFallback: () => (
      <Box sx={{ py: 4 }}>
        <EmptyOrErrorState kind={isError ? "error" : "empty"} />
      </Box>
    ),
  });

  return <MaterialReactTable table={table} />;
}
