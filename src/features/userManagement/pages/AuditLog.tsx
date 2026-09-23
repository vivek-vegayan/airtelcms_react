import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import type {
  MRT_PaginationState,
  MRT_SortingState,
} from "material-react-table";

import { useTabColorTokens } from "../../../style/theme";
import { usePermission } from "../../../rbac/usePermission";
import AccessDenied from "../../../rbac/AccessDenied";
import { canViewAuditLog } from "../utils/auditLogAccess";
import {
  useGetAuditLogFiltersQuery,
  useGetAuditLogsQuery,
} from "../api/auditLogApi";
import type { AuditLogEntry, AuditLogFilters } from "../types/auditLog";
import AuditLogFilterBar from "../components/auditLog/AuditLogFilterBar";
import AuditLogTable from "../components/auditLog/AuditLogTable";
import AuditLogDetailDialog from "../components/auditLog/AuditLogDetailDialog";

/** Matched to the Cancelled CRQ registry's own search debounce. */
const SEARCH_DEBOUNCE_MS = 350;

/**
 * Audit Log — every state-changing action users have performed, across every
 * module, with the timestamp the database recorded.
 *
 * Three things define this screen:
 *
 * 1. **Read-only.** There is no mutation hook, no write endpoint and no delete
 *    action anywhere in this sub-feature. A record that could be edited from
 *    the screen that displays it would not be a record.
 * 2. **Super admin only.** The guard below hides it from everyone else, and the
 *    backend independently refuses their requests with 403 — so a direct URL or
 *    a hand-made API call gets nothing either.
 * 3. **Server-driven.** Filtering, searching, sorting and paging are all done
 *    by `sp_get_ui_actions_log`. The table is expected to reach millions of
 *    rows, so nothing is ever fetched in order to be thrown away here.
 */
export const AuditLog = () => {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);
  const { roleCode } = usePermission();

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });
  const [sorting, setSorting] = useState<MRT_SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);

  // Debounced so typing a name is one request, not one per keystroke.
  useEffect(() => {
    const t = setTimeout(
      () =>
        setFilters((prev) =>
          (prev.search ?? "") === searchInput.trim()
            ? prev
            : { ...prev, search: searchInput.trim() || undefined },
        ),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(t);
  }, [searchInput]);

  const allowed = canViewAuditLog(roleCode);

  const sortArgs = useMemo(
    () => ({
      sortBy: sorting[0]?.id,
      sortDirection: (sorting[0]?.desc ? "desc" : "asc") as "asc" | "desc",
    }),
    [sorting],
  );

  // Narrowing must land the reader on page 1 — page 4 of the old population is
  // almost never a page of the new one.
  useEffect(() => {
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    );
  }, [filters, sortArgs]);

  const {
    data: page,
    isFetching,
    isError,
    error,
    refetch: refetchPage,
  } = useGetAuditLogsQuery(
    {
      ...filters,
      ...sortArgs,
      page: pagination.pageIndex,
      size: pagination.pageSize,
    },
    // RTK Query cancels the superseded request itself when the args change, so
    // a fast typist never renders a stale page.
    { skip: !allowed },
  );

  const {
    data: filterOptions,
    isFetching: isFiltersFetching,
    refetch: refetchFilters,
  } = useGetAuditLogFiltersQuery(filters.module, { skip: !allowed });

  const handleFilterChange = useCallback(
    <K extends keyof AuditLogFilters>(key: K, value: AuditLogFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleClear = useCallback(() => {
    setFilters({});
    setSearchInput("");
  }, []);

  const handleRefresh = useCallback(() => {
    refetchPage();
    refetchFilters();
  }, [refetchPage, refetchFilters]);

  const activeFilterCount = useMemo(
    () =>
      [
        filters.module,
        filters.subModule,
        filters.action,
        filters.actorUserId,
        filters.affectedUserId,
        filters.fromDate,
        filters.toDate,
        searchInput.trim() || undefined,
      ].filter(Boolean).length,
    [filters, searchInput],
  );

  /*
   * The browser-side half of "super admin only". PrivateRoute already refuses
   * the URL, but this covers the case of the component being rendered from
   * anywhere else, and it fails closed: an unknown roleCode is not a super
   * admin.
   */
  if (!allowed) {
    return <AccessDenied reason="forbidden" />;
  }

  const errorMessage =
    (error as { data?: { message?: string } })?.data?.message ?? undefined;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75, minWidth: 0 }}>
      {/* Title row */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Box
          sx={{
            width: 30,
            height: 30,
            borderRadius: tk.radius,
            display: "grid",
            placeItems: "center",
            color: tk.accent,
            bgcolor: tk.accentDim,
            border: `1px solid ${tk.accentBorder}`,
          }}
        >
          <FactCheckOutlinedIcon sx={{ fontSize: 17 }} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{ fontSize: 15, fontWeight: 800, color: tk.textPrimary, lineHeight: 1.3 }}
          >
            Audit Log
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: tk.textSecondary, lineHeight: 1.3 }}>
            Every state-changing user action across the application, with the
            time the database recorded it. Read-only.
          </Typography>
        </Box>

        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
          {page && (
            <Typography sx={{ fontSize: 11.5, color: tk.textDim }}>
              {page.totalElements.toLocaleString()} record
              {page.totalElements === 1 ? "" : "s"}
            </Typography>
          )}
          <Tooltip title="Refresh">
            <span>
              <IconButton size="small" onClick={handleRefresh} disabled={isFetching}>
                <RefreshRoundedIcon sx={{ fontSize: 18, color: tk.textSecondary }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <AuditLogFilterBar
        filters={filters}
        options={filterOptions}
        optionsLoading={isFiltersFetching && !filterOptions}
        onChange={handleFilterChange}
        searchInput={searchInput}
        onSearchInputChange={setSearchInput}
        onClear={handleClear}
        activeFilterCount={activeFilterCount}
      />

      {/* An outright failure is stated once, above the table, rather than only
          inside the empty state — "no records" and "we could not ask" are very
          different answers on an audit screen. */}
      {isError && (
        <Alert severity="error" variant="outlined" sx={{ fontSize: 12.5, py: 0.25 }}>
          {errorMessage ?? "Audit logs could not be loaded. Please try again."}
        </Alert>
      )}

      {/* First load only: once a page exists, MRT's own progress bar takes over
          so the table does not disappear and reflow on every filter change. */}
      {isFetching && !page ? (
        <Box
          sx={{
            borderRadius: tk.radiusL,
            border: `1px solid ${tk.border}`,
            overflow: "hidden",
          }}
        >
          <Skeleton variant="rectangular" height={38} sx={{ bgcolor: tk.surface2 }} />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              height={34}
              sx={{ mt: "1px", bgcolor: tk.surface }}
            />
          ))}
        </Box>
      ) : (
        <AuditLogTable
          rows={page?.content ?? []}
          totalElements={page?.totalElements ?? 0}
          pagination={pagination}
          onPaginationChange={setPagination}
          sorting={sorting}
          onSortingChange={setSorting}
          isFetching={isFetching}
          isError={isError}
          errorMessage={errorMessage}
          onView={setSelected}
        />
      )}

      <AuditLogDetailDialog entry={selected} onClose={() => setSelected(null)} />
    </Box>
  );
};

export default AuditLog;
