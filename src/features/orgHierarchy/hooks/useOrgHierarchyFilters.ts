import { useMemo } from "react";
import { useGetOrgHierarchyByUserQuery } from "../api/orgHierarchy.api";
import type {
  OrgFilterValues,
  OrgFilterKey,
} from "../types/orgHierarchy.types";

export const useOrgHierarchyFilters = (
 
  filters: OrgFilterValues,
) => {
  const { data, isLoading, isError } = useGetOrgHierarchyByUserQuery();

  const options = useMemo<Record<OrgFilterKey, any[]>>(() => {
    if (!data?.data) {
      return {
        vertical: [],
        teamFunction: [],
        domain: [],
        subDomain: [],
      };
    }

    const { verticals, teamFunction, domains, subDomains } = data.data;

    return {
      vertical: verticals.map((v) => ({
        label: v.name,
        value: v.id,
      })),

      teamFunction: teamFunction
        .filter((f) => !filters.vertical || f.verticalId === filters.vertical)
        .map((f) => ({
          label: f.name,
          value: f.id,
        })),

      domain: domains
        .filter(
          (d) => !filters.teamFunction || d.functionId === filters.teamFunction,
        )
        .map((d) => ({
          label: d.name,
          value: d.id,
        })),

      // domainId 0 marks a catch-all row (e.g. "ALL", id 0) that the SP sends
      // for every domain, so it must survive the domain filter.
      subDomain: subDomains
        .filter(
          (sd) =>
            !filters.domain ||
            sd.domainId === 0 ||
            sd.domainId === filters.domain,
        )
        .map((sd) => ({
          label: sd.name,
          value: sd.id,
        })),
    };
  }, [data, filters]);

  return { options, isLoading, isError };
};
