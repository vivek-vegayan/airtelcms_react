import { useMemo } from "react";
import {
  useGetGoldenSetQuery,
  useUpdateDailyGoldenSetMutation,
} from "../../api/rosterGenerationApiSlice";
import type { GoldenWeekDate } from "../../types/goldenSet.types";
import type { GoldenSetEmployee } from "./goldenGrid.types";
import { transformApiDataToEmployees } from "./goldenGrid.utils";

export function useGoldenGridData(subDomainId: number, domainId?: number) {
  const {
    data: apiResponse,
    isLoading,
    error,
    refetch,
  } = useGetGoldenSetQuery({ subDomainId, domainId });
  const [updateDailyGoldenSet, { isLoading: isSaving }] =
    useUpdateDailyGoldenSetMutation();

  const allEmps = useMemo<GoldenSetEmployee[]>(() => {
    if (!apiResponse?.data || !Array.isArray(apiResponse.data)) return [];
    return transformApiDataToEmployees(apiResponse.data);
  }, [apiResponse]);

  // Indexed 0..5 by golden week (W1..W6); null when the API sent no date.
  const weekDates = useMemo<(GoldenWeekDate | null)[]>(() => {
    const byWeek = new Map(
      (apiResponse?.weeks ?? []).map((w) => [w.goldenWeek, w]),
    );
    return Array.from({ length: 6 }, (_, i) => byWeek.get(`W${i + 1}`) ?? null);
  }, [apiResponse]);

  const allRoles = useMemo<string[]>(
    () => [...new Set(allEmps.map((e) => e.role))],
    [allEmps],
  );

  return {
    allEmps,
    allRoles,
    weekDates,
    isLoading,
    error,
    refetch,
    updateDailyGoldenSet,
    isSaving,
  };
}
