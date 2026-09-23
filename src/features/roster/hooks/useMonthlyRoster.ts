import { useMemo } from "react";
import { useGetMonthlyRosterViewQuery } from "../api/rosterApiSlice";
// import { useGetMonthlyRosterQuery } from "../api/roster.api";

export const useMonthlyRoster = (params: any) => {
  const query = useGetMonthlyRosterViewQuery(params, {
    skip: !params.teamId,
  });

  const allDates = useMemo(() => {
    if (!query.data?.data) return [];

    const set = new Set<string>();
    query.data.data.forEach((u) =>
      Object.keys(u.roster).forEach((d) => set.add(d))
    );

    return Array.from(set).sort();
  }, [query.data]);

  return {
    ...query,
    allDates,
  };
};