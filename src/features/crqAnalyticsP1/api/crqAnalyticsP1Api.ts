import { api } from "../../../service/api";
import type {
  P1BreakdownResponse,
  P1CrqListParams,
  P1CrqListResponse,
  P1FilterParams,
  P1FiltersResponse,
  P1JourneyResponse,
  P1NightsParams,
  P1NightsResponse,
  P1PendencyResponse,
  P1RangeParams,
  P1ResultsResponse,
  P1TeamsResponse,
} from "../types/crqAnalyticsP1.types";

// One endpoint per CRQ_AN_SP_* procedure (backend package crqanalyticsp1). An unset filter
// is left out of the query string; the backend then sends NULL (= all) to the procedure.
const filterParams = (f: P1FilterParams) => ({
  vertical: f.vertical || undefined,
  function: f.function || undefined,
  domain: f.domain || undefined,
  subDomain: f.subDomain || undefined,
  circle: f.circle || undefined,
  stage: f.stage || undefined,
});

const rangeParams = (f: P1RangeParams) => ({ ...filterParams(f), from: f.from, to: f.to });

const BASE = "/crq-analytics-p1";

export const crqAnalyticsP1Api = api.injectEndpoints({
  endpoints: (builder) => ({
    // CRQ_AN_SP_FILTERS - org tree, circles, stages, data as of.
    getP1Filters: builder.query<P1FiltersResponse, void>({
      query: () => `${BASE}/filters`,
      providesTags: ["CrqAnalytics"],
    }),

    // CRQ_AN_SP_P1_PENDENCY
    getP1Pendency: builder.query<P1PendencyResponse, P1RangeParams>({
      query: (f) => ({ url: `${BASE}/pendency`, params: rangeParams(f) }),
      providesTags: ["CrqAnalytics"],
    }),

    // CRQ_AN_SP_P1_RESULTS
    getP1Results: builder.query<P1ResultsResponse, P1RangeParams & { months: number }>({
      query: ({ months, ...f }) => ({ url: `${BASE}/results`, params: { ...rangeParams(f), months } }),
      providesTags: ["CrqAnalytics"],
    }),

    // CRQ_AN_SP_P1_BREAKDOWN
    getP1Breakdown: builder.query<P1BreakdownResponse, P1RangeParams & { months: number }>({
      query: ({ months, ...f }) => ({ url: `${BASE}/breakdown`, params: { ...rangeParams(f), months } }),
      providesTags: ["CrqAnalytics"],
    }),

    // CRQ_AN_SP_P1_TEAMS
    getP1Teams: builder.query<P1TeamsResponse, P1RangeParams>({
      query: (f) => ({ url: `${BASE}/teams`, params: rangeParams(f) }),
      providesTags: ["CrqAnalytics"],
    }),

    // CRQ_AN_SP_P1_NIGHTS
    getP1Nights: builder.query<P1NightsResponse, P1NightsParams>({
      query: ({ nightsFrom, nightsTo, ...f }) => ({
        url: `${BASE}/nights`,
        params: { ...filterParams(f), nightsFrom, nightsTo },
      }),
      providesTags: ["CrqAnalytics"],
    }),

    // CRQ_AN_SP_LIST - the CRQs behind a clicked number.
    getP1CrqList: builder.query<P1CrqListResponse, P1CrqListParams>({
      query: ({ key, value, offset, limit, ...f }) => ({
        url: `${BASE}/crqs`,
        params: { ...rangeParams(f), key, value, offset, limit },
      }),
    }),

    // CRQ_AN_SP_JOURNEY
    getP1Journey: builder.query<P1JourneyResponse, string>({
      query: (crqNo) => ({ url: `${BASE}/journey`, params: { crqNo } }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetP1FiltersQuery,
  useGetP1PendencyQuery,
  useGetP1ResultsQuery,
  useGetP1BreakdownQuery,
  useGetP1TeamsQuery,
  useGetP1NightsQuery,
  useLazyGetP1CrqListQuery,
  useGetP1JourneyQuery,
} = crqAnalyticsP1Api;
