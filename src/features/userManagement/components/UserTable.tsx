import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Badge,
  Box,
  Chip,
  Stack,
  Typography,
  Button,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DeleteOutline, GroupOutlined, Close } from "@mui/icons-material";
import {
  MaterialReactTable,
  MRT_ShowHideColumnsButton,
  type MRT_ColumnDef,
  type MRT_RowSelectionState,
  type MRT_VisibilityState,
} from "material-react-table";
import { useAppTable } from "../../../components/ui/AppTable";
import dayjs from "dayjs";
import RoleBadge from "./RoleBadge";
import StatusBadge from "./StatusBadge";
import ActionMenu from "./ActionMenu";
import EmptyState from "./EmptyState";
import { getAvatarColor, getInitials, formatRelativeTime } from "../utils/userHelpers";
import { getUserStatus, STATUS_CONFIG, type User } from "../types/user";

/**
 * Painted geometry of the grid, per density, in CSS pixels.
 *
 * Lives here rather than in the page because it describes what this component
 * renders: `row` is one body row including its 1px border, `chrome` is the top
 * toolbar plus the sticky header row. UserManagement divides the space it has
 * by these to decide how many rows to ask the server for, so a wrong value
 * shows up as a half-cut last row — keep them in step with the sx below.
 */
export const ROW_METRICS = {
  compact: { row: 39, chrome: 90 },
  comfortable: { row: 62, chrome: 100 },
} as const;

export type TableDensity = keyof typeof ROW_METRICS;

export interface UserTableProps {
  users: User[];
  onView: (u: User) => void;
  onEdit: (u: User) => void;
  onPermissions: (u: User) => void;
  onResetPassword: (u: User) => void;
  onDelete: (u: User) => void;
  onBulkDelete: (users: User[]) => void;
  onAddUser: () => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  /** Hides the empty-state Add User CTA for roles without create rights. */
  canAddUser?: boolean;
  /** Total matching the current filter across every page. `users` is one
   *  server page, so the header count has to come from outside the table. */
  totalElements?: number;
  /** Compact row density — the default. Comfortable adds back the breathing
   *  room, at roughly two thirds the rows per screen. */
  dense?: boolean;
}

export default function UserTable({
  users,
  onView,
  onEdit,
  onPermissions,
  onResetPassword,
  onDelete,
  onBulkDelete,
  onAddUser,
  onResetFilters,
  hasActiveFilters,
  canAddUser = true,
  totalElements,
  dense = true,
}: UserTableProps) {
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  // Clear stale selection whenever the visible (filtered/paginated) row set changes.
  useEffect(() => {
    setRowSelection({});
  }, [users]);

  // ── Responsive column priority ──────────────────────────────────────────
  // Lower-priority columns fold away as the available width shrinks (the
  // sidebar + header eat into it before the table container even starts).
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isDownMd = useMediaQuery(theme.breakpoints.down("md"));
  const isDownLg = useMediaQuery(theme.breakpoints.down("lg"));
  const isDownXl = useMediaQuery(theme.breakpoints.down("xl"));

  const responsiveVisibility = useMemo<MRT_VisibilityState>(
    () => ({
      function: !isDownMd,
      employeeId: !isDownLg,
      joinedDate: !isDownLg,
      lastLogin: !isDownXl,
    }),
    [isDownMd, isDownLg, isDownXl],
  );

  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(responsiveVisibility);

  // Re-apply the breakpoint defaults whenever the viewport crosses a boundary,
  // while still letting the user override via the Show/Hide columns menu in between.
  useEffect(() => {
    setColumnVisibility(responsiveVisibility);
  }, [responsiveVisibility]);

  const columns = useMemo<MRT_ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "name",
        header: "User",
        size: 260,
        Cell: ({ row }) => {
          const u = row.original;
          const status = getUserStatus(u);
          return (
            <Stack direction="row" alignItems="center" gap={dense ? 1 : 1.5}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                badgeContent={
                  <Box
                    sx={{
                      width: dense ? 8 : 10,
                      height: dense ? 8 : 10,
                      borderRadius: "50%",
                      bgcolor: STATUS_CONFIG[status].dot,
                      border: "2px solid",
                      borderColor: "background.paper",
                    }}
                  />
                }
              >
                <Avatar
                  sx={{
                    bgcolor: getAvatarColor(u.id),
                    width: dense ? 28 : 38,
                    height: dense ? 28 : 38,
                    fontSize: dense ? "0.68rem" : "0.78rem",
                    fontWeight: 700,
                    border: "2px solid",
                    borderColor: "background.paper",
                    boxShadow: isDark ? "0 0 0 1px rgba(255,255,255,0.08)" : "0 0 0 1px rgba(15,23,42,0.06)",
                  }}
                >
                  {getInitials(u.name)}
                </Avatar>
              </Badge>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  sx={{ fontSize: dense ? 12.5 : 13, fontWeight: 700, color: "text.primary", lineHeight: 1.3 }}
                  noWrap
                  title={u.name}
                >
                  {u.name}
                </Typography>
                <Typography
                  sx={{ fontSize: dense ? 10.5 : 11.5, color: "text.secondary", lineHeight: 1.3 }}
                  noWrap
                  title={u.email}
                >
                  {u.email}
                </Typography>
              </Box>
            </Stack>
          );
        },
      },
      {
        accessorKey: "employeeId",
        header: "OLM ID",
        size: 130,
        Cell: ({ cell }) => (
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: "text.secondary" }}>
            {cell.getValue<string>()}
          </Typography>
        ),
      },
      {
        accessorKey: "function",
        header: "Department",
        size: 140,
        Cell: ({ cell }) => (
          <Chip
            label={cell.getValue<string>()}
            size="small"
            sx={{ bgcolor: "action.hover", color: "text.secondary", fontWeight: 600, fontSize: "0.7rem" }}
          />
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        size: 140,
        Cell: ({ cell }) => <RoleBadge role={cell.getValue<User["role"]>()} size="small" />,
      },
      {
        id: "status",
        header: "Status",
        size: 110,
        accessorFn: (row) => getUserStatus(row),
        Cell: ({ row }) => <StatusBadge status={getUserStatus(row.original)} />,
      },
      {
        accessorKey: "lastLogin",
        header: "Last Login",
        size: 130,
        Cell: ({ cell }) => (
          <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
            {formatRelativeTime(cell.getValue<string>())}
          </Typography>
        ),
      },
      {
        accessorKey: "joinedDate",
        header: "Joined Date",
        size: 120,
        Cell: ({ cell }) => {
          const value = cell.getValue<string | null>();
          return (
            <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
              {value ? dayjs(value).format("MMM YYYY") : "—"}
            </Typography>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        size: dense ? 112 : 130,
        enableSorting: false,
        enableColumnActions: false,
        enableResizing: false,
        Cell: ({ row }) => (
          <ActionMenu
            onView={() => onView(row.original)}
            onEdit={() => onEdit(row.original)}
            onPermissions={() => onPermissions(row.original)}
            onResetPassword={() => onResetPassword(row.original)}
            onDelete={() => onDelete(row.original)}
            dense={dense}
          />
        ),
      },
    ],
    [onView, onEdit, onPermissions, onResetPassword, onDelete, dense, isDark],
  );

  const selectedUsers = useMemo(
    () => users.filter((u) => rowSelection[u.id]),
    [users, rowSelection],
  );

  const table = useAppTable({
    columns,
    data: users,
    getRowId: (row) => row.id,
    state: { rowSelection, columnVisibility },
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    enableRowSelection: true,
    enableColumnResizing: true,
    enableColumnFilters: false,
    enableGlobalFilter: false,
    enableSorting: true,
    enablePagination: false,
    enableBottomToolbar: false,
    enableHiding: true,
    enableColumnPinning: true,
    initialState: {
      columnPinning: { left: ["mrt-row-select", "name"], right: ["actions"] },
    },
    layoutMode: "grid",
    positionToolbarAlertBanner: "top",
    // The paper fills whatever height the page's data region hands it and
    // becomes the scroll parent itself (toolbar pinned, rows scrolling under
    // the sticky header). Previously it guessed with `maxHeight: 60/68/72vh`,
    // which ignored the header, tab bar, stats and footer above/below it —
    // too tall on short windows (page scrolled, footer off screen) and too
    // short on tall ones (dead space under the table).
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        borderRadius: "16px",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: isDark ? "0 8px 28px rgba(0,0,0,0.35)" : "0 8px 28px rgba(15,23,42,0.06)",
        overflow: "hidden",
        background: theme.palette.background.paper,
        width: "100%",
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      },
    },
    muiTableContainerProps: {
      sx: { flex: 1, minHeight: 0, maxHeight: "none", overflow: "auto" },
    },
    // Typography, hairlines and default padding come from the shared preset;
    // what stays here is the part that is specific to this table — pinned
    // columns need an opaque background and an edge shadow to sit over the
    // rows scrolling beneath them, and this page has its own density toggle.
    muiTableHeadCellProps: ({ column }) => ({
      sx: {
        py: dense ? 0.5 : 0.75,
        px: { xs: 1, lg: 1.5 },
        "& .Mui-TableHeadCell-Content-Actions button": { color: theme.palette.text.secondary },
        ...(column.getIsPinned() && {
          background: isDark ? theme.palette.background.default : "#F8FAFC",
          boxShadow:
            column.getIsPinned() === "left"
              ? `2px 0 4px ${isDark ? "rgba(0,0,0,0.3)" : "rgba(15,23,42,0.04)"}`
              : `-2px 0 4px ${isDark ? "rgba(0,0,0,0.3)" : "rgba(15,23,42,0.04)"}`,
        }),
      },
    }),
    muiTableBodyCellProps: ({ column }) => ({
      sx: {
        py: dense ? 0.3 : 0.55,
        px: { xs: 1, lg: 1.5 },
        ...(column.getIsPinned() && {
          background: theme.palette.background.paper,
          boxShadow:
            column.getIsPinned() === "left"
              ? `2px 0 4px ${isDark ? "rgba(0,0,0,0.3)" : "rgba(15,23,42,0.04)"}`
              : `-2px 0 4px ${isDark ? "rgba(0,0,0,0.3)" : "rgba(15,23,42,0.04)"}`,
        }),
      },
    }),
    muiTableBodyRowProps: ({ row }) => ({
      className: "row-hover",
      sx: {
        transition: "background 0.15s",
        background:
          row.index % 2 === 1
            ? isDark
              ? "rgba(255,255,255,0.02)"
              : "rgba(248,250,252,0.6)"
            : "transparent",
        "&:hover": { background: alpha(theme.palette.primary.main, isDark ? 0.08 : 0.045) },
      },
    }),
    muiSelectCheckboxProps: { size: "small" },
    muiSelectAllCheckboxProps: { size: "small" },
    renderTopToolbar: ({ table }) => (
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          px: { xs: 1.25, lg: 2.25 },
          py: dense ? 0.75 : 1.25,
          flexShrink: 0,
          borderBottom: "1px solid",
          borderColor: "divider",
          background: isDark
            ? `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.6)} 0%, ${theme.palette.background.paper} 100%)`
            : "linear-gradient(180deg, #FAFBFF 0%, #FFFFFF 100%)",
        }}
      >
        <Box sx={{ minHeight: 30, display: "flex", alignItems: "center" }}>
          {selectedUsers.length > 0 ? (
            <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1.25}>
              <Chip
                label={`${selectedUsers.length} selected`}
                size="small"
                onDelete={() => setRowSelection({})}
                deleteIcon={<Close sx={{ fontSize: 14 }} />}
                sx={{ bgcolor: "primary.main", color: "#fff", fontWeight: 700, "& .MuiChip-deleteIcon": { color: "rgba(255,255,255,0.8)" } }}
              />
              <Button
                size="small"
                color="error"
                startIcon={<DeleteOutline sx={{ fontSize: 16 }} />}
                onClick={() => {
                  onBulkDelete(selectedUsers);
                  setRowSelection({});
                }}
                sx={{ fontWeight: 600, borderRadius: "8px" }}
              >
                Delete selected
              </Button>
            </Stack>
          ) : (
            <Stack direction="row" alignItems="center" gap={0.75}>
              <GroupOutlined sx={{ fontSize: 17, color: "text.secondary" }} />
              {/* The chip used to show `users.length` — the size of the current
                  server page — next to the label "All Users", so a 400-user
                  directory read as "All Users 12". */}
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary" }}>
                {hasActiveFilters ? "Matching users" : "All users"}
              </Typography>
              <Chip
                label={(totalElements ?? users.length).toLocaleString()}
                size="small"
                sx={{
                  height: 19,
                  fontSize: 11,
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.1),
                  color: isDark ? theme.palette.primary.light : theme.palette.primary.dark,
                }}
              />
              {totalElements !== undefined && totalElements > users.length && (
                <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
                  showing {users.length}
                </Typography>
              )}
            </Stack>
          )}
        </Box>
        <MRT_ShowHideColumnsButton table={table} />
      </Box>
    ),
    renderEmptyRowsFallback: () => (
      <EmptyState
        onAddUser={onAddUser}
        onResetFilters={onResetFilters}
        showResetFilters={hasActiveFilters}
        showAddUser={canAddUser}
      />
    ),
  });

  return <MaterialReactTable table={table} />;
}
