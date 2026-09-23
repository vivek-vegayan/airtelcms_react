import { api } from "../../../service/api";
import type { HeadersDataResponse, PagedReportParams } from "../types/teamReport.types";

export const teamReportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Every report endpoint takes the same params and returns { headers, data };
    // the backend resolves the caller from the JWT, so only range + page are sent.
    getTeamReport: builder.query<HeadersDataResponse, PagedReportParams & { url: string }>({
      query: ({ url, ...params }) => ({ url, params }),
    }),
  }),
  overrideExisting: false,
});

export const { useGetTeamReportQuery, useLazyGetTeamReportQuery } = teamReportApi;
