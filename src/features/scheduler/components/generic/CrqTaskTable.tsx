import React, { useMemo } from "react";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
} from "material-react-table";
import { useAppTable } from "../../../../components/ui/AppTable";
import type { Task } from "../../types/crqWorkflow.types";

interface CrqTaskTableProps {
  tasks: Task[];
  colors: any;
}

// `colors` is still accepted from callers but no longer read: the table now
// takes its surfaces, header casing and cell padding from the shared preset.
const CrqTaskTable: React.FC<CrqTaskTableProps> = ({ tasks }) => {
  const columns = useMemo<MRT_ColumnDef<Task>[]>(
    () => [
      { accessorKey: "taskId", header: "Task ID", size: 250 },
      { accessorKey: "neLabel", header: "NE Label", size: 200 },
      {
        accessorKey: "planActivityDetails",
        header: "Plan Activity details",
        size: 200,
      },
      {
        accessorKey: "activitySequence",
        header: "Activity Sequence",
        size: 180,
      },
      {
        accessorKey: "taskProfileType",
        header: "Task Profile Type",
        size: 220,
      },
      { accessorKey: "locationCodeM6", header: "Location Code", size: 150 },
      { accessorKey: "taskActivity", header: "Task Activity", size: 200 },
    ],
    [],
  );

  const table = useAppTable({
    columns,
    data: tasks || [],
    enableTopToolbar: false,
    enableBottomToolbar: false,
    enablePagination: false,
    enableSorting: false,

    // This grid is attached directly beneath its own section header, so the
    // shared frame's top edge is dropped rather than drawn twice.
    muiTablePaperProps: {
      sx: { borderTop: "none", borderTopLeftRadius: 0, borderTopRightRadius: 0 },
    },

    initialState: { density: "compact" },
  });

  return <MaterialReactTable table={table} />;
};
export default CrqTaskTable;
