import { useEffect, useMemo, useState } from "react";
import TeamSkillSetTable from "../components/teamDetailsTable/TeamSkillSetTable";
import {
  useGetEmpCountBySubDomainIdQuery,
  useGetEmployeesBySubDomainQuery,
} from "../../orgHierarchy/api/orgHierarchy.api";
import type { OrgFilterValues } from "../../orgHierarchy/types/orgHierarchy.types";
import { TeamManagementFilter } from "../components/filters/TeamManagementFilter";
import type { MRT_PaginationState } from "material-react-table";
import { useAppSelector } from "../../../app/hooks";
import { useApiRefresh } from "../../../hooks/useApiRefresh";
import { Box } from "@mui/material";

// Fetched once per subDomain/status selection so search & pagination can run
// client-side over the complete matching dataset (see TeamSkillSetTable).
// The backing stored procedure has no server-side search parameter, and the
// realistic team size for a sub-domain (hundreds, not tens of thousands)
// makes a single full fetch far cheaper than getting search wrong.
const FETCH_ALL_SIZE = 2000;

export const TeamManagementMain = () => {
  //  ALL hooks before any conditional return
  const user = useAppSelector((s) => s.auth.user);

  const [filters, setFilters] = useState<OrgFilterValues>({});
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [filteredRows, setFilteredRows] = useState<Record<string, any>[]>([]);
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 14,
  });

  const subDomainId = filters.subDomain;

  const {
    data,
    isFetching: isFetchingEmployees,
    refetch: refetchEmployees,
  } = useGetEmployeesBySubDomainQuery(
    {
      subDomainId: subDomainId as number,
      employeeStatus: status,
      page: 0,
      size: FETCH_ALL_SIZE,
    },
    { skip: subDomainId == null },
  );

  const {
    data: overviewData,
    isFetching: isFetchingOverview,
    refetch: refetchOverview,
  } = useGetEmpCountBySubDomainIdQuery(
    { subDomainId: subDomainId as number },
    { skip: subDomainId == null },
  );

  const isFetchingTeam = isFetchingEmployees || isFetchingOverview;

  // Both queries are owned here, so the filter bar's refresh button is handed
  // their refetch handles rather than reaching for them through cache tags.
  const { refresh, isRefreshing } = useApiRefresh({
    onRefresh: () => {
      if (subDomainId == null) return;
      void refetchEmployees();
      void refetchOverview();
    },
    isFetching: isFetchingTeam,
  });

  const tableData = useMemo(() => data?.content ?? [], [data]);
  const totalRowCount = useMemo(() => data?.totalElements ?? 0, [data]);

  // Sync filteredRows with fresh server data (column filters clear on new fetch)
  useEffect(() => {
    setFilteredRows(tableData);
  }, [tableData]);

  // Reset to page 1 whenever the underlying dataset changes (new filter/status)
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [subDomainId, status]);

  //  Early return AFTER all hooks
  if (!user) return <Box>No user found</Box>;

  const roleCode = user.roleCode;
  const overview = overviewData?.[0];

  return (
    <>
      <TeamManagementFilter
        filters={filters}
        setFilters={setFilters}
        status={status}
        setStatus={setStatus}
        filteredRows={filteredRows}
        totalRowCount={totalRowCount}
        currentPageSize={pagination.pageSize}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
      />
      <Box sx={{ p: 0.5 }} />
      <TeamSkillSetTable
        data={tableData}
        totalRowCount={totalRowCount}
        pagination={pagination}
        setPagination={setPagination}
        roleCode={roleCode as "User" | "Team Lead" | "Super Admin"}
        overview={overview}
        isFilterSelected={subDomainId != null}
        onFilteredRowsChange={setFilteredRows}
        isFetching={isFetchingTeam}
      />
    </>
  );
};
