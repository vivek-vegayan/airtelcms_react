import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, IconButton, Tooltip, Typography, useTheme } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import type { MRT_PaginationState } from "material-react-table";

import { authStorage } from "../../../../app/store/auth.storage";
import { useOrgHierarchyFilters } from "../../../orgHierarchy/hooks/useOrgHierarchyFilters";
import { useOrgHierarchyState } from "../../../orgHierarchy/hooks/useOrgHierarchyState";
import type { OrgFilterKey } from "../../../orgHierarchy/types/orgHierarchy.types";
import { useTabColorTokens } from "../../../../style/theme";
import {
  useGetCancelledCrqsQuery,
  useGetCancelledCrqSummaryQuery,
} from "../../api/cancelledCrqApiSlice";
import CancelledCrqFilterBar from "./components/CancelledCrqFilterBar";
import CancelledCrqStats from "./components/CancelledCrqStats";
import CancelledCrqTable from "./components/CancelledCrqTable";

/** Debounce on the free-text box, matched to GlobalCrqSearch's own. */
const SEARCH_DEBOUNCE_MS = 350;

/**
 * Cancelled CRQs — every CRQ that ended in cancellation, in one place.
 *
 * Three things distinguish this from the seven stage screens:
 *
 * 1. It is not scoped to a stage. A cancellation can happen anywhere in the
 *    workflow, so the register spans all seven and reports which stage each
 *    CRQ died in (see Get_Cancelled_CRQ_List).
 * 2. No org level is required. Every picker starts on "All …" and only
 *    narrows, because a register you can only read one sub-domain at a time
 *    is not a register. Permission scope is unchanged — the procedure still
 *    limits a TEAM_MEMBER to CRQs they are assigned to or have acted on.
 * 3. It is read-only. A cancelled CRQ is terminal; there is deliberately no
 *    action, mutation hook or write endpoint anywhere in this sub-feature.
 */
export const CancelledCrqMain = () => {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);

  const loggedUser = authStorage.getUser();
  const roleName = loggedUser?.roleCode ?? "TEAM_MEMBER";

  const { values, handleChange, resetAll } = useOrgHierarchyState("cancelledCrq");
  const { options } = useOrgHierarchyFilters(values);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  // Debounced so typing a CRQ number is one request, not one per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  /**
   * Scope sent to both endpoints. A level left on "All …" arrives here as 0
   * (or undefined) and is dropped from the query string, which is what makes
   * the backend not narrow on it at all.
   */
  const filters = useMemo(
    () => ({
      verticalId: values.vertical || undefined,
      functionId: values.teamFunction || undefined,
      domainId: values.domain || undefined,
      subDomainId: values.subDomain ?? undefined,
      search: search || undefined,
    }),
    [values.vertical, values.teamFunction, values.domain, values.subDomain, search],
  );

  const hasActiveFilters =
    Boolean(filters.verticalId) ||
    Boolean(filters.functionId) ||
    Boolean(filters.domainId) ||
    Boolean(filters.subDomainId) ||
    Boolean(searchInput);

  // Narrowing must land the reader on page 1 — page 4 of the old population
  // is almost never a page of the new one.
  useEffect(() => {
    setPagination((prev) => (prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 }));
  }, [filters]);

  const {
    data: page,
    isFetching,
    isError,
    refetch: refetchList,
  } = useGetCancelledCrqsQuery({
    ...filters,
    page: pagination.pageIndex,
    size: pagination.pageSize,
  });

  const {
    data: summary,
    isFetching: isSummaryFetching,
    refetch: refetchSummary,
  } = useGetCancelledCrqSummaryQuery(filters);

  const handleFilterChange = useCallback(
    (key: OrgFilterKey, value?: number) => {
      // 0 is the "All …" entry — store it as "unset" so the cascade in
      // useOrgHierarchyFilters re-opens every child option.
      handleChange(key, value ? value : undefined);
    },
    [handleChange],
  );

  const handleClear = useCallback(() => {
    resetAll();
    setSearchInput("");
    setSearch("");
  }, [resetAll]);

  const handleRefresh = useCallback(() => {
    refetchList();
    refetchSummary();
  }, [refetchList, refetchSummary]);

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
            color: tk.danger,
            bgcolor: tk.dangerDim,
            border: `1px solid ${tk.dangerBorder}`,
          }}
        >
          <BlockRoundedIcon sx={{ fontSize: 17 }} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 800, color: tk.textPrimary, lineHeight: 1.3 }}>
            Cancelled CRQs
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: tk.textSecondary, lineHeight: 1.3 }}>
            Every cancelled CRQ across all seven workflow stages — read-only
            record.
          </Typography>
        </Box>

        <Box sx={{ ml: "auto" }}>
          <Tooltip title="Refresh">
            <span>
              <IconButton size="small" onClick={handleRefresh} disabled={isFetching}>
                <RefreshRoundedIcon sx={{ fontSize: 18, color: tk.textSecondary }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <CancelledCrqFilterBar
        role={roleName}
        values={values}
        options={options}
        onChange={handleFilterChange}
        search={searchInput}
        onSearchChange={setSearchInput}
        onClear={handleClear}
        hasActiveFilters={hasActiveFilters}
      />

      <CancelledCrqStats summary={summary} loading={isSummaryFetching && !summary} />

      <CancelledCrqTable
        rows={page?.content ?? []}
        totalElements={page?.totalElements ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        isFetching={isFetching}
        isError={isError}
      />
    </Box>
  );
};

export default CancelledCrqMain;
