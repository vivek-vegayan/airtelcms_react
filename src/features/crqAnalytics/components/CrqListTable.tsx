import { useMemo, useState } from "react";
import { Box, Chip } from "@mui/material";
import { MaterialReactTable, type MRT_ColumnDef, type MRT_PaginationState } from "material-react-table";
import { useAppTable } from "../../../components/ui/AppTable";
import { useGetCrqAnalyticsListQuery } from "../api/crqAnalyticsApi";
import type { CRQAnalyticsFilterParams, CRQTableRowDto } from "../types/crqAnalytics.types";
import { EmptyOrErrorState } from "./EmptyOrErrorState";

export interface CrqListDrillFilter {
  status?: string;
  stage?: string;
  rejectionReason?: string;
}

interface Props {
  filters: CRQAnalyticsFilterParams;
  drill?: CrqListDrillFilter;
  onRowClick: (crqNo: string) => void;
}

const statusColor = (status: string): "success" | "warning" | "error" | "default" => {
  const s = status.toUpperCase();
  if (s.includes("CLOS") || s.includes("COMPLETE")) return "success";
  if (s.includes("REJECT") || s.includes("CANCEL")) return "error";
  if (s.includes("OPEN") || s.includes("PROGRESS")) return "warning";
  return "default";
};

export function CrqListTable({ filters, drill, onRowClick }: Props) {
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 25 });

  const { data, isFetching, isError } = useGetCrqAnalyticsListQuery({
    ...filters,
    status: drill?.status,
    stage: drill?.stage,
    rejectionReason: drill?.rejectionReason,
    page: pagination.pageIndex,
    size: pagination.pageSize,
  });

  const columns = useMemo<MRT_ColumnDef<CRQTableRowDto>[]>(
    () => [
      { accessorKey: "crqNo", header: "CRQ No.", size: 140 },
      { accessorKey: "currentStage", header: "Stage", size: 160 },
      {
        accessorKey: "currentStatus",
        header: "Status",
        size: 130,
        Cell: ({ cell }) => <Chip label={cell.getValue<string>()} size="small" color={statusColor(cell.getValue<string>())} />,
      },
      { accessorKey: "teamFunction", header: "Team Function", size: 150 },
      { accessorKey: "teamSubfunction", header: "Team Sub-function", size: 160 },
      { accessorKey: "schedulingFlag", header: "Scheduling", size: 110 },
      { accessorKey: "approvalFlag", header: "Approval", size: 110 },
    ],
    [],
  );

  const table = useAppTable({
    columns,
    data: data?.data ?? [],
    manualPagination: true,
    rowCount: data?.totalCount ?? 0,
    onPaginationChange: setPagination,
    state: { pagination, isLoading: isFetching },
    enableColumnFilters: false,
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => onRowClick(row.original.crqNo),
      sx: { cursor: "pointer" },
    }),
    renderEmptyRowsFallback: () => (
      <Box sx={{ py: 4 }}>
        <EmptyOrErrorState kind={isError ? "error" : "empty"} />
      </Box>
    ),
    initialState: { density: "compact" },
  });

  return <MaterialReactTable table={table} />;
}
