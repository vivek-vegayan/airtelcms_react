import OrgHierarchyFilters from "../../../orgHierarchy/components/OrgHierarchyFiltersV2";
import { authStorage } from "../../../../app/store/auth.storage";
import { useOrgHierarchyState } from "../../../orgHierarchy/hooks/useOrgHierarchyState";
import { useOrgHierarchyFilters } from "../../../orgHierarchy/hooks/useOrgHierarchyFilters";
import { useApiRefresh } from "../../../../hooks/useApiRefresh";
import { TaskConfig } from "./components/TaskConfig";
import { useGetTaskConfigViewQuery } from "./api/taskConfigApi";

export const TaskConfigMain = () => {
  const loggedUser = authStorage.getUser();
  const roleName = loggedUser?.roleCode ?? "TEAM_MEMBER";
  const { values, handleChange } = useOrgHierarchyState("taskConfig");
  const { options } = useOrgHierarchyFilters(values);
  const shouldFetch = Boolean(values.domain) && values.subDomain != null;
  const { data, isLoading, isFetching, refetch } = useGetTaskConfigViewQuery(
    { domainId: values.domain!, subDomainId: values.subDomain! },
    { skip: !shouldFetch },
  );

  const { refresh, isRefreshing } = useApiRefresh({
    onRefresh: () => void refetch(),
    isFetching,
  });

  return (
    <>
      <OrgHierarchyFilters
        role={roleName}
        values={values}
        options={options}
        onChange={handleChange}
        onRefresh={refresh}
        isRefreshing={isRefreshing}
        refreshDisabled={!shouldFetch}
        refreshTooltip={
          shouldFetch
            ? "Refresh task configuration"
            : "Pick a Domain and Sub Domain first"
        }
      />
      <TaskConfig data={data} isLoading={isLoading} isFetching={isFetching} />
    </>
  );
};
