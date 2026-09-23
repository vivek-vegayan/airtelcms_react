import { api } from "../../../../service/api";
import type { MonthlyRosterResponse } from "../types/roster.types";

export const userMonthlyRosterApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUserMonthlyRoster: builder.query<
      MonthlyRosterResponse,
      { startDate: string; endDate: string }
    >({
      query: ({ startDate, endDate }) => ({
        url: `/monthlyrosterview/userroster`,
        params: { startDate, endDate },
      }),
    }),
  }),
});

export const { useGetUserMonthlyRosterQuery } = userMonthlyRosterApi;
