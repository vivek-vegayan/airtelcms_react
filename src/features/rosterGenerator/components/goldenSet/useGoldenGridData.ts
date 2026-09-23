import { useMemo } from "react";
import {
  useGetGoldenSetQuery,
  useUpdateDailyGoldenSetMutation,
} from "../../api/rosterGenerationApiSlice";
import type { GoldenSetEmployee } from "./goldenGrid.types";
import { transformApiDataToEmployees } from "./goldenGrid.utils";

export function useGoldenGridData(subDomainId: number) {
  const {
    data: apiResponse,
    isLoading,
    error,
    refetch,
  } = useGetGoldenSetQuery({ subDomainId });
  const [updateDailyGoldenSet, { isLoading: isSaving }] =
    useUpdateDailyGoldenSetMutation();

  const allEmps = useMemo<GoldenSetEmployee[]>(() => {
    if (!apiResponse?.data || !Array.isArray(apiResponse.data)) return [];
    return transformApiDataToEmployees(apiResponse.data);
  }, [apiResponse]);

  const allRoles = useMemo<string[]>(
    () => [...new Set(allEmps.map((e) => e.role))],
    [allEmps],
  );

  return {
    allEmps,
    allRoles,
    isLoading,
    error,
    refetch,
    updateDailyGoldenSet,
    isSaving,
  };
}
