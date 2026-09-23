import { useCallback, useMemo, useState } from "react";
import {
  Box,
  Fab,
  LinearProgress,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import { saveAs } from "file-saver";
import { toast } from "react-toastify";
import dayjs from "dayjs";

import { useAppSelector } from "../../../app/hooks";
import { usePermission } from "../../../rbac/usePermission";
import { AppScrollView } from "../../../components/ui/AppScrollView";
import DashboardHeader from "./DashboardHeader";
import StatsSection from "./StatsSection";
import SearchToolbar, { DEFAULT_FILTERS, type UserFilters } from "./SearchToolbar";
import UserTable, { ROW_METRICS, type TableDensity } from "./UserTable";
import UserCard from "./UserCard";
import ProfileDrawer from "./ProfileDrawer";
import AddUserWizard from "./AddUserWizard";
import AddUserTypeDialog from "./AddUserTypeDialog";
import AddOtherUserDialog from "./AddOtherUserDialog";
import DeleteDialog from "./DeleteDialog";
import EmptyState from "./EmptyState";
import LoadingState from "./LoadingState";
import { usePageLoading } from "../../../components/loading/LoadingProvider";
import { UploadEmployeeDialog } from "../../teamManagement/components/dialog/UploadEmployeeDialog";
import { useGetCreateUserDropdownsQuery } from "../../teamManagement/api/teamManagement.api";
import { useGetOrgHierarchyByUserQuery } from "../../orgHierarchy/api/orgHierarchy.api";
import { useGetUsersQuery, useLazyGetUsersQuery } from "../api/userManagementApi";
import { getUserStatus, mapUserListItem, type User } from "../types/user";
import { useFitRows } from "../hooks/useFitRows";

const ROWS_PER_PAGE_OPTIONS = [10, 15, 25, 50, 100];
// Large enough to cover any realistic filtered result set in one request for
// CSV export, without paging through the UI's normal page size.
const EXPORT_FETCH_SIZE = 5000;

// Roles that read the directory but may not create users - every add-user
// affordance (header button, mobile FAB, empty-state CTA) is hidden for them.
const NO_CREATE_ROLES = new Set(["TEAM_MEMBER"]);

// Fit-to-screen bounds. The floor keeps a very short window from asking for a
// single row; the ceiling keeps a very tall one from pulling hundreds.
const FIT_MIN_ROWS = 5;
const FIT_MAX_ROWS = 60;
// Height the pagination footer needs under the grid, plus the page's bottom
// padding — the fit hook subtracts this so the footer is never pushed off.
const FOOTER_RESERVE = 64;

// ── Persisted view preferences ───────────────────────────────────────────
// Per-viewer chrome choices only (density, whether the summary strip is up,
// whether the grid auto-fits). Nothing here affects what data is fetched or
// who may see it, so localStorage is the right home; it is read defensively
// because a private window or blocked site data makes it throw.
const PREF_KEY = "chm.userManagement.viewPrefs.v1";

interface ViewPrefs {
  density: TableDensity;
  showStats: boolean;
  autoFit: boolean;
  rowsPerPage: number;
}

const DEFAULT_PREFS: ViewPrefs = {
  density: "compact",
  showStats: true,
  autoFit: true,
  rowsPerPage: 15,
};

function readPrefs(): ViewPrefs {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw) as Partial<ViewPrefs>;
    return {
      density: parsed.density === "comfortable" ? "comfortable" : "compact",
      showStats: parsed.showStats !== false,
      autoFit: parsed.autoFit !== false,
      rowsPerPage:
        typeof parsed.rowsPerPage === "number" && parsed.rowsPerPage > 0
          ? parsed.rowsPerPage
          : DEFAULT_PREFS.rowsPerPage,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function writePrefs(prefs: ViewPrefs) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch {
    /* private window / site data blocked — the session just keeps its defaults */
  }
}

/** Which user the drawer is showing, and whether it was opened to be edited
 *  rather than read. The row's pencil used to land on the read-only Overview
 *  tab, leaving a second click to reach the form it promised. */
interface DrawerTarget {
  userId: number;
  edit: boolean;
}

export default function UserManagement() {
  const authUser = useAppSelector((s) => s.auth.user);
  const actorUserId = Number(authUser?.userId ?? 0);
  const { roleCode } = usePermission();
  const canAddUser = !NO_CREATE_ROLES.has(roleCode ?? "");

  // ── Core state (search/filter/pagination/CRUD) ──────────────────────────
  const [filters, setFilters] = useState<UserFilters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  // ── View preferences ─────────────────────────────────────────────────────
  const [prefs, setPrefs] = useState<ViewPrefs>(readPrefs);
  const updatePrefs = useCallback((patch: Partial<ViewPrefs>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      writePrefs(next);
      return next;
    });
  }, []);

  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [bulkDeleteTargets, setBulkDeleteTargets] = useState<User[] | null>(null);
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addOtherOpen, setAddOtherOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [drawerTarget, setDrawerTarget] = useState<DrawerTarget | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const theme = useTheme();
  // Below `sm` (phones), the table has no room even with column-hiding, so fall
  // back to the card grid. From `sm` up, UserTable folds columns by priority.
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // Height-aware as well as width-aware: on a short window (laptop 768/900px
  // panels, or any window the user has shrunk) the stats strip and the spacing
  // around it tighten so the scrolling data region keeps a usable height.
  const isShortViewport = useMediaQuery("(max-height: 800px)");

  const openProfile = useCallback((u: User) => setDrawerTarget({ userId: u.userId, edit: false }), []);
  const openEditor = useCallback((u: User) => setDrawerTarget({ userId: u.userId, edit: true }), []);

  // ── Fit the grid to one screen ───────────────────────────────────────────
  // The row count is derived from the space under the toolbar so "All users"
  // arrives as a single screenful: no inner scroll, no half-cut last row. The
  // card grid scrolls by nature, so it keeps the chosen page size instead.
  const metrics = ROW_METRICS[prefs.density];
  const fitEnabled = prefs.autoFit && viewMode === "list" && !isMobile;

  const { anchorRef, rows: fittedRows } = useFitRows({
    rowHeight: metrics.row,
    chromeHeight: metrics.chrome,
    reservedBelow: FOOTER_RESERVE,
    min: FIT_MIN_ROWS,
    max: FIT_MAX_ROWS,
    enabled: fitEnabled,
  });

  const rowsPerPage = fitEnabled ? (fittedRows ?? prefs.rowsPerPage) : prefs.rowsPerPage;

  // ── Live data ────────────────────────────────────────────────────────────
  const queryArgs = useMemo(
    () => ({
      search: filters.search || undefined,
      roleCode: filters.roleCode === "All" ? undefined : filters.roleCode,
      functionId: filters.functionId === "All" ? undefined : filters.functionId,
      status: filters.statusFilter === "All" ? undefined : filters.statusFilter.toUpperCase(),
      page: page - 1,
      size: rowsPerPage,
    }),
    [filters, page, rowsPerPage],
  );

  const { data, isLoading, isFetching, refetch } = useGetUsersQuery(queryArgs);
  const [triggerExportFetch] = useLazyGetUsersQuery();

  // Only the very first fetch (no cached data yet) should show the full
  // skeleton / block the page; subsequent isFetching (filter/page change)
  // keeps the current rows on screen with a thin progress indicator instead.
  const isInitialLoading = isLoading && !data;
  const isBackgroundRefreshing = isFetching && !isInitialLoading;
  usePageLoading(isInitialLoading, "user-management");

  const { data: hierarchyData } = useGetOrgHierarchyByUserQuery();
  const { data: dropdowns } = useGetCreateUserDropdownsQuery();

  const departmentOptions = useMemo(
    () => (hierarchyData?.data?.teamFunction ?? []).map((f) => ({ value: f.id, label: f.name })),
    [hierarchyData],
  );
  const roleOptions = dropdowns?.roleCode ?? [];

  const users = useMemo(() => (data?.page.content ?? []).map(mapUserListItem), [data]);

  // Client-side re-sort of the current server-fetched page only (search,
  // role/department/status, and pagination are all server-side - the SP has
  // no sort parameter, so this just reorders what's already on screen).
  const sorted = useMemo(() => {
    const list = [...users];
    list.sort((a, b) => {
      switch (filters.sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "joined-new":
          return (b.joinedDate ?? "").localeCompare(a.joinedDate ?? "");
        case "joined-old":
          return (a.joinedDate ?? "").localeCompare(b.joinedDate ?? "");
        case "role":
          return (a.role ?? "").localeCompare(b.role ?? "");
        default:
          return 0;
      }
    });
    return list;
  }, [users, filters.sortBy]);

  const totalElements = data?.page.totalElements ?? 0;
  const totalPages = Math.max(1, data?.page.totalPages ?? 1);
  const clampedPage = Math.min(page, totalPages);
  const firstRow = totalElements === 0 ? 0 : (clampedPage - 1) * rowsPerPage + 1;
  const lastRow = Math.min(clampedPage * rowsPerPage, totalElements);

  const hasActiveFilters =
    filters.search !== "" ||
    filters.roleCode !== "All" ||
    filters.functionId !== "All" ||
    filters.statusFilter !== "All";

  const handleFilterChange = useCallback((patch: Partial<UserFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  // ── CRUD handlers ────────────────────────────────────────────────────────
  const handleResetPassword = (u: User) => {
    toast.info(`Password reset is managed by IT support for ${u.email}`);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await triggerExportFetch({ ...queryArgs, page: 0, size: EXPORT_FETCH_SIZE }).unwrap();
      const rows = result.page.content.map(mapUserListItem);

      if (rows.length === 0) {
        toast.info("Nothing to export — no users match the current filters.");
        return;
      }

      const header = "Name,OLM ID,Email,Department,Role,Status,Joined Date\n";
      const body = rows
        .map((u) =>
          [u.name, u.employeeId, u.email, u.function, u.role, getUserStatus(u), u.joinedDate ?? ""]
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\n");
      const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
      saveAs(blob, `users-export-${dayjs().format("YYYY-MM-DD")}.csv`);
      toast.success(`Exported ${rows.length.toLocaleString()} users`);
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to export users");
    } finally {
      setExporting(false);
    }
  };

  return (
    // The page is a full-height flex column: header, stats and toolbar stay
    // put, only the data region scrolls, and the pagination footer stays
    // reachable at the bottom without a page-level scroll. Heights come from
    // the flex chain (shell -> layout content -> here), never from measuring
    // this element, so there is no resize/scrollbar feedback loop.
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        pb: { xs: canAddUser ? 9 : 1, md: 0 },
      }}
    >
      <DashboardHeader
        onAddUser={() => setAddTypeOpen(true)}
        onImport={() => setImportOpen(true)}
        onExport={handleExport}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        exporting={exporting}
        canAddUser={canAddUser}
        totalUsers={totalElements}
      />

      {/* Reserved strip, so rows do not jump by 3px each time a background
          refresh starts and finishes. */}
      <Box sx={{ height: 3, mb: 0.75, flexShrink: 0 }}>
        {isBackgroundRefreshing && <LinearProgress sx={{ borderRadius: 999, height: 3 }} />}
      </Box>

      {isInitialLoading ? (
        <LoadingState />
      ) : (
        <>
          {prefs.showStats && <StatsSection stats={data?.stats} dense={isShortViewport} />}

          <SearchToolbar
            filters={filters}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
            departments={departmentOptions}
            roles={roleOptions}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            density={prefs.density}
            onDensityChange={(density) => updatePrefs({ density })}
            statsShown={prefs.showStats}
            onToggleStats={() => updatePrefs({ showStats: !prefs.showStats })}
            dense={isShortViewport}
          />

          {/* Data region — takes all remaining height. `anchorRef` is what the
              fit hook measures: only this box's TOP edge, which is set by the
              chrome above it and never by the row count below, so the fit
              cannot feed back into itself. The floor keeps it usable on very
              short windows; below that the shell scrolls. */}
          <Box
            ref={anchorRef}
            sx={{
              flex: 1,
              minHeight: { xs: 260, md: 320 },
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            {viewMode === "list" && !isMobile ? (
              <UserTable
                users={sorted}
                onView={openProfile}
                onEdit={openEditor}
                onPermissions={openProfile}
                onResetPassword={handleResetPassword}
                onDelete={setDeleteTarget}
                onBulkDelete={setBulkDeleteTargets}
                onAddUser={() => setAddTypeOpen(true)}
                onResetFilters={handleResetFilters}
                hasActiveFilters={hasActiveFilters}
                canAddUser={canAddUser}
                totalElements={totalElements}
                dense={prefs.density === "compact"}
              />
            ) : sorted.length === 0 && !isFetching ? (
              <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <EmptyState
                  onAddUser={() => setAddTypeOpen(true)}
                  onResetFilters={handleResetFilters}
                  showResetFilters={hasActiveFilters}
                  showAddUser={canAddUser}
                />
              </Box>
            ) : (
              <AppScrollView sx={{ flex: 1, minHeight: 0, pr: 0.5 }}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "1fr 1fr",
                      md: "repeat(3, 1fr)",
                      xl: "repeat(4, 1fr)",
                    },
                    gap: 1.5,
                    pb: 0.5,
                  }}
                >
                  {sorted.map((u) => (
                    <UserCard
                      key={u.id}
                      user={u}
                      onView={openProfile}
                      onEdit={openEditor}
                      onPermissions={openProfile}
                      onResetPassword={handleResetPassword}
                      onDelete={setDeleteTarget}
                    />
                  ))}
                </Box>
              </AppScrollView>
            )}
          </Box>

          {/* ── Pagination footer ── */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            flexWrap="wrap"
            mt={isShortViewport ? 1 : 1.25}
            gap={isShortViewport ? 0.75 : 1.25}
            sx={{ flexShrink: 0 }}
          >
            <Stack direction="row" alignItems="center" gap={1.25} flexWrap="wrap">
              <Typography sx={{ fontSize: 12.5, color: "text.secondary", whiteSpace: "nowrap" }}>
                Rows
              </Typography>
              {/* 0 is the "Fit to screen" sentinel — picking any real number is
                  also how the user opts out of auto-fitting. */}
              <Select
                size="small"
                value={fitEnabled ? 0 : prefs.rowsPerPage}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  updatePrefs(
                    value === 0 ? { autoFit: true } : { autoFit: false, rowsPerPage: value },
                  );
                  setPage(1);
                }}
                sx={{ fontSize: 12.5, borderRadius: "8px", minWidth: 92 }}
              >
                <MenuItem value={0} sx={{ fontSize: 12.5 }} disabled={viewMode !== "list" || isMobile}>
                  Fit ({rowsPerPage})
                </MenuItem>
                {ROWS_PER_PAGE_OPTIONS.map((n) => (
                  <MenuItem key={n} value={n} sx={{ fontSize: 12.5 }}>
                    {n}
                  </MenuItem>
                ))}
              </Select>
              <Typography
                sx={{ fontSize: 12.5, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}
              >
                {firstRow.toLocaleString()}–{lastRow.toLocaleString()} of{" "}
                {totalElements.toLocaleString()}
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" gap={1.25} justifyContent={{ xs: "space-between", md: "flex-end" }}>
              <Pagination
                count={totalPages}
                page={clampedPage}
                onChange={(_, v) => setPage(v)}
                shape="rounded"
                size="small"
                siblingCount={isMobile ? 0 : 1}
                sx={{ "& .MuiPaginationItem-root": { borderRadius: "8px", fontSize: 12.5 } }}
              />
              {/* Only worth the space once paging by hand beats clicking through. */}
              {totalPages > 5 && (
                <Stack direction="row" alignItems="center" gap={0.75}>
                  <Typography sx={{ fontSize: 12.5, color: "text.secondary", whiteSpace: "nowrap" }}>
                    Go to
                  </Typography>
                  <TextField
                    size="small"
                    type="number"
                    key={clampedPage}
                    defaultValue={clampedPage}
                    inputProps={{ min: 1, max: totalPages, "aria-label": "Go to page" }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      const v = Number((e.target as HTMLInputElement).value);
                      if (v >= 1 && v <= totalPages) setPage(v);
                    }}
                    sx={{ width: 68, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12.5 } }}
                  />
                </Stack>
              )}
            </Stack>
          </Stack>
        </>
      )}

      {/* ── Floating Add User button (mobile) ── */}
      {isMobile && canAddUser && (
        <Fab
          color="primary"
          aria-label="Add user"
          onClick={() => setAddTypeOpen(true)}
          sx={{ position: "fixed", bottom: 24, right: 24 }}
        >
          <Add />
        </Fab>
      )}

      {/* ── Drawer & Dialogs ── */}
      <ProfileDrawer
        userId={drawerTarget?.userId ?? null}
        openInEditMode={drawerTarget?.edit ?? false}
        actorUserId={actorUserId}
        onClose={() => setDrawerTarget(null)}
        onUserChanged={refetch}
      />

      <AddUserTypeDialog
        open={addTypeOpen}
        onClose={() => setAddTypeOpen(false)}
        onSelectTeam={() => {
          setAddTypeOpen(false);
          setAddOpen(true);
        }}
        onSelectOther={() => {
          setAddTypeOpen(false);
          setAddOtherOpen(true);
        }}
      />

      <AddUserWizard
        open={addOpen}
        onClose={() => setAddOpen(false)}
        actorUserId={actorUserId}
        onCreated={refetch}
      />

      <AddOtherUserDialog
        open={addOtherOpen}
        onClose={() => setAddOtherOpen(false)}
        onCreated={refetch}
      />

      <UploadEmployeeDialog
        open={importOpen}
        onClose={() => {
          setImportOpen(false);
          refetch();
        }}
      />

      <DeleteDialog
        user={deleteTarget}
        actorUserId={actorUserId}
        onClose={() => setDeleteTarget(null)}
        onDone={refetch}
      />
      <DeleteDialog
        user={null}
        bulkUsers={bulkDeleteTargets}
        actorUserId={actorUserId}
        onClose={() => setBulkDeleteTargets(null)}
        onDone={refetch}
      />
    </Box>
  );
}
