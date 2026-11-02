import { useCallback, useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import type { MRT_PaginationState } from "material-react-table";

import { useAuth } from "../../../auth/hooks/useAuth";
import { useOrgHierarchyFilters } from "../../../orgHierarchy/hooks/useOrgHierarchyFilters";
import { useOrgAutoSelect } from "../../../orgHierarchy/hooks/useOrgAutoSelect";
import { useOrgHierarchyState } from "../../../orgHierarchy/hooks/useOrgHierarchyState";
import type { OrgFilterKey } from "../../../orgHierarchy/types/orgHierarchy.types";
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
  const { user: loggedUser } = useAuth();
  const roleName = loggedUser?.roleCode ?? "TEAM_MEMBER";

  const { values, handleChange } = useOrgHierarchyState("cancelledCrq");
  const { options } = useOrgHierarchyFilters(values);
  useOrgAutoSelect(values, options, handleChange);

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

  const handleRefresh = useCallback(() => {
    refetchList();
    refetchSummary();
  }, [refetchList, refetchSummary]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, minWidth: 0 }}>
      <CancelledCrqStats summary={summary} loading={isSummaryFetching && !summary} />

      <CancelledCrqTable
        rows={page?.content ?? []}
        totalElements={page?.totalElements ?? 0}
        pagination={pagination}
        onPaginationChange={setPagination}
        isFetching={isFetching}
        isError={isError}
        toolbar={
          <CancelledCrqFilterBar
            role={roleName}
            values={values}
            options={options}
            onChange={handleFilterChange}
            search={searchInput}
            onSearchChange={setSearchInput}
            onRefresh={handleRefresh}
            refreshing={isFetching}
          />
        }
      />
    </Box>
  );
};

export default CancelledCrqMain;
