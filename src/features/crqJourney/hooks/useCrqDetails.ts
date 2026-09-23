import { useEffect, useState } from "react";
import { authStorage } from "../../../app/store/auth.storage";
import { useOrgHierarchyState } from "../../orgHierarchy/hooks/useOrgHierarchyState";
import { useOrgHierarchyFilters } from "../../orgHierarchy/hooks/useOrgHierarchyFilters";
import { useGetCrqsBySubDomainQuery, useGetCrqDetailsQuery } from "../api/crqJourneyExplorer.api";
import type { CrqJourneySearchRow } from "../types/crqJourney.types";

/** Drives /scheduler/crqjourney: sub-domain scoped CRQ search → info card + 7-stage timeline. */
export const useCrqDetails = () => {
  const loggedUser = authStorage.getUser();
  const roleName = loggedUser?.roleCode ?? "TEAM_MEMBER";

  const { values, handleChange } = useOrgHierarchyState("crqDetails");
  const { options } = useOrgHierarchyFilters(values);

  const [selectedCrq, setSelectedCrq] = useState<CrqJourneySearchRow | null>(null);

  const subDomainId = values.subDomain;

  const { data: crqOptions = [], isFetching: isLoadingCrqs } = useGetCrqsBySubDomainQuery(
    subDomainId ?? 0,
    { skip: subDomainId == null }
  );

  useEffect(() => {
    setSelectedCrq(null);
  }, [subDomainId]);

  const {
    data: details,
    isFetching: isLoading,
    isError,
  } = useGetCrqDetailsQuery(selectedCrq?.crqNo ?? "", { skip: !selectedCrq });

  return {
    roleName,
    values,
    options,
    handleChange,
    crqOptions,
    isLoadingCrqs,
    selectedCrq,
    handleSelectCrq: setSelectedCrq,
    details: details ?? null,
    isLoading,
    error: isError ? "Failed to load CRQ details." : null,
  };
};
