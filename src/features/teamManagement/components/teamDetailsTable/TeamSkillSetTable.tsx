import React, { useMemo, useState, useEffect } from "react";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_PaginationState,
  type MRT_Column,
} from "material-react-table";
import { useAppTable } from "../../../../components/ui/AppTable";
import { useTheme } from "@mui/material";
import {
  Box,
  IconButton,
  Tooltip,
  Chip,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { TeamTopInfoCard } from "./TeamTopInfoCard";
// import FilterSvg from "../../../../assets/svg/NoDataFound.svg";
import FilterSvg from "../../../../assets/svg/Filter.svg";
import { CreateEditMemberDialog } from "../dialog/CreateEditMemberDialog";
import { ExitEmployeeDialog } from "../dialog/ExitEmployeeDialog";
import { usePermission } from "../../../../rbac/usePermission";

/* ================= LEVEL COLOR MAP ================= */

const levelColorMap: Record<string, { bg: string; color: string }> = {
  L1: { bg: "#E3F2FD", color: "#1565C0" },
  L2: { bg: "#E8F5E9", color: "#2E7D32" },
  L3: { bg: "#FFF3E0", color: "#EF6C00" },
  L4: { bg: "#FDECEA", color: "#C62828" },
};

/* ================= MULTI SELECT FILTER ================= */

const MultiSelectFilter = ({
  column,
  options,
}: {
  column: MRT_Column<any>;
  options: string[];
}) => {
  // const selected = (column.getFilterValue() as string[]) || [];
  const rawValue = column.getFilterValue();
  const selected = Array.isArray(rawValue) ? rawValue : [];

  return (
    <FormControl variant="standard" sx={{ minWidth: 140 }}>
      <Select
        multiple
        value={selected}
        onChange={(e) => column.setFilterValue(e.target.value)}
        renderValue={(selected) =>
          (selected as string[]).length > 2
            ? `${(selected as string[]).length} selected`
            : (selected as string[]).join(", ")
        }
        size="small"
      >
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            <Checkbox checked={selected.includes(option)} size="small" />
            <ListItemText primary={option} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

/* ================= PROPS ================= */

interface OverviewType {
  l1Count: number;
  l2Count: number;
  l3Count: number;
  l4Count: number;
  teamLead: string;
  totalCount: number;
}

interface Props {
  data: Record<string, any>[];
  totalRowCount: number;
  pagination: MRT_PaginationState;
  setPagination: React.Dispatch<React.SetStateAction<MRT_PaginationState>>;
  roleCode: "User" | "Team Lead" | "Super Admin";
  overview?: OverviewType;
  isFilterSelected: boolean;
  onFilteredRowsChange?: (rows: Record<string, any>[]) => void;
  /** True while a filter/status change is re-fetching data for an already-rendered table. */
  isFetching?: boolean;
}

const DEFAULT_VISIBLE = [
  "olmId",
  "employeeName",
  "emailId",
  "mobileNo",
  "jobLevel",
  "employmentType",
  "designation",
  "officeLocation",
];

const STORAGE_KEY = "team-table-column-visibility";

const TeamSkillSetTable: React.FC<Props> = ({
  data,
  // totalRowCount is still accepted from the parent but no longer read here:
  // paging is client-side over the full data set, so useAppTable counts the
  // filtered rows itself and stays correct while a filter is applied.
  pagination,
  setPagination,
  roleCode,
  overview,
  isFilterSelected,
  onFilteredRowsChange,
  isFetching,
}) => {
  const [editData, setEditData] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exitDialogOpen, setExitDialogOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const theme = useTheme();
  const { can } = usePermission();
  const canUpdateTeam = can("Team Management", "UPDATE");
  const canDeleteTeam = can("Team Management", "DELETE");
  const showActionColumn = canUpdateTeam || canDeleteTeam;
  const handleEdit = (rowData: any) => {
    if (!canUpdateTeam) return;
    setEditData(rowData);
    setDialogOpen(true);
  };

  const handleDelete = (rowData: any) => {
    setSelectedRow(rowData);
    setExitDialogOpen(true);
  };

  // The rows-per-page ladder that used to be assembled here now comes from
  // useAppTable, which offers the same sizes plus the live row count.

  // _________________________________________\\\
  /* ================= COLUMN KEYS ================= */

  const columnKeys = useMemo(() => {
    if (!data?.length) return [];
    return Object.keys(data[0]).filter((key) => key !== "userId");
  }, [data]);

  /* ================= FILTER OPTIONS ================= */

  const columnFilterOptions = useMemo(() => {
    const map: Record<string, string[]> = {};

    columnKeys.forEach((key) => {
      map[key] = Array.from(
        new Set(
          data
            .map((row) => row[key])
            .filter((val) => val !== null && val !== undefined)
            .map((val) => val.toString()),
        ),
      );
    });

    return map;
  }, [data, columnKeys]);

  /* ================= COLUMNS ================= */

  const columns = useMemo<MRT_ColumnDef<any>[]>(() => {
    const baseColumns: MRT_ColumnDef<any>[] = columnKeys.map((key) => ({
      accessorKey: key,
      header: key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase()),
      size: 160,
      enableColumnFilter: true,

      Filter: ({ column }) => (
        <MultiSelectFilter
          column={column}
          options={columnFilterOptions[key] || []}
        />
      ),

      filterFn: (row, id, filterValue) => {
        if (!filterValue?.length) return true;
        const rowValue = row.getValue(id)?.toString().toLowerCase() || "";
        return filterValue.some((val: string) =>
          rowValue.includes(val.toLowerCase()),
        );
      },

      Cell:
        key === "jobLevel"
          ? ({ cell }) => {
              const value = cell.getValue<string>();
              const style = levelColorMap[value] || {
                bg: "#f5f5f5",
                color: "#555",
              };

              return (
                <Chip
                  label={value}
                  size="small"
                  sx={{
                    backgroundColor: style.bg,
                    color: style.color,
                    fontWeight: 600,
                    borderRadius: "8px",
                    minWidth: 45,
                  }}
                />
              );
            }
          : key === "employmentType"
            ? ({ cell }) => (
                <Chip
                  label={cell.getValue<string>()}
                  size="small"
                  sx={{
                    backgroundColor: "#F3F4F6",
                    color: "#374151",
                    fontWeight: 500,
                    borderRadius: "8px",
                  }}
                />
              )
            : undefined,
    }));

    if (showActionColumn) {
      baseColumns.push({
        id: "actions",
        header: "Actions",
        size: 120,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <Box display="flex" gap={0.5}>
            {canUpdateTeam && (
              <Tooltip title="Edit">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => handleEdit(row.original)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {canDeleteTeam && (
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(row.original)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ),
      });
    }

    return baseColumns;
    // canUpdateTeam/canDeleteTeam belong here: they decide whether the
    // Actions column exists at all, and omitting them left this memo holding
    // a column set built from a previous user's grants after a re-login that
    // did not remount the table.
  }, [columnKeys, roleCode, columnFilterOptions, canUpdateTeam, canDeleteTeam, showActionColumn]);

  /* ================= COLUMN VISIBILITY ================= */

  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    if (!columnKeys.length) return;

    if (Object.keys(columnVisibility).length === 0) {
      const visibility: Record<string, boolean> = {};
      columnKeys.forEach((key) => {
        visibility[key] = DEFAULT_VISIBLE.includes(key);
      });
      setColumnVisibility(visibility);
    }
  }, [columnKeys]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  /* ================= TABLE ================= */

  const table = useAppTable({
    columns,
    data,
    // Client-side pagination/filtering/sorting: `data` holds the complete
    // matching dataset (fetched once per subDomain/status in
    // TeamManagementMain), so search and column filters can find a match on
    // any page instead of only the currently loaded server page.
    manualPagination: false,
    onPaginationChange: setPagination,
    state: { pagination, columnVisibility, isLoading: isFetching },
    onColumnVisibilityChange: setColumnVisibility,
    enablePagination: true,
    enableColumnFilters: true,
    enableGlobalFilter: true,
    enableSorting: true,
    enableColumnPinning: true,
    //

    /* ================= HEADER ================= */


    muiTableContainerProps: {
      sx: {
        maxHeight: {
          xs: "100px",
          sm: "100px",
          md: "180px",
          lg: "350px",
          xl: "405px",
        },

        backgroundColor: theme.palette.background.paper,

        "&::-webkit-scrollbar": { height: "6px" },
        "&::-webkit-scrollbar-track": {
          backgroundColor:
            theme.palette.mode === "dark"
              ? theme.palette.background.default
              : "#f1f1f1",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: theme.palette.primary.main,
          borderRadius: "6px",
        },
      },
    },

    initialState: {
      density: "compact",
      columnPinning: {
        // Keyed off the column actually existing rather than off roleCode:
        // once a team member's write grants are revoked there is no "actions"
        // column to pin, and pinning a missing column id leaves MRT holding a
        // phantom entry in its pinning state.
        right: showActionColumn ? ["actions"] : [],
      },
    },
    renderTopToolbarCustomActions: () => (
      <Box display="flex" alignItems="center" gap={1}>
        <TeamTopInfoCard overview={overview} />
      </Box>
    ),
  });

  // Expose filtered rows to parent whenever filters change
  useEffect(() => {
    if (!onFilteredRowsChange) return;
    const filtered = table.getFilteredRowModel().rows.map((r) => r.original);
    onFilteredRowsChange(filtered);
  }, [
    table.getState().columnFilters,
    table.getState().globalFilter,
    data, // re-run when server data refreshes
  ]);

  if (!isFilterSelected) {
    return (
      <Box
        sx={{
          width: "100%",
          minHeight: "calc(100vh - 200px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <img src={FilterSvg} alt="Select Filter" width={1050} />
      </Box>
    );
  }

  return (
    <>
      <MaterialReactTable table={table} />
      {dialogOpen && (
        <CreateEditMemberDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          actorUserId={2}
          mode="edit"
          editData={editData}
        />
      )}

      {selectedRow && (
        <ExitEmployeeDialog
          open={exitDialogOpen}
          onClose={() => setExitDialogOpen(false)}
          actorUserId={1}
          userId={selectedRow.userId}
          employeeName={selectedRow.employeeName}
          employeeOlmId={selectedRow.olmId}
        />
      )}
    </>
  );
};

export default TeamSkillSetTable;
