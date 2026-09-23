import { api } from "../../../service/api";
import type {
  CRQAnalyticsFilterParams,
  CRQAnalyticsDashboardResponse,
  EngineerUtilizationDto,
  CRQOpenDomainDto,
  CRQRaisedVsClosedDto,
  CRQRunRateDto,
  CRQSiteGroupDto,
  GroupBreakdownDimension,
  CRQListParams,
  CRQListResponse,
  AgingHeatmapParams,
  CRQAgingBucketDto,
  CRQDetailResponse,
  ViewAllResponse,
  ViewAllParams,
  AnalyticsReportType,
  AvailableDatesResponse,
  AvailableReportsResponse,
  DownloadReportArgs,
} from "../types/crqAnalytics.types";


// Backend params are declared `@RequestParam String` with no default, so every
// call must send a value — an unset org-hierarchy id is sent as "" rather than
// omitted (which would 400 as a missing required param).
const filterParams = (f: CRQAnalyticsFilterParams) => ({
  teamFunctionId: f.teamFunctionId != null ? String(f.teamFunctionId) : "",
  domainId: f.domainId != null ? String(f.domainId) : "",
  subDomainId: f.subDomainId != null ? String(f.subDomainId) : "",
  circleId: f.circleId ?? "",
  startDate: f.startDate,
  endDate: f.endDate,
});

// The 5 /view-all/* endpoints paginate via page/size (converted to offset/limit
// server-side) — no total-count field comes back, so callers just request a
// generous page size and treat it as the full set for now.
const viewAllParams = (f: ViewAllParams) => ({
  ...filterParams(f),
  page: f.page ?? 0,
  size: f.size ?? 200,
});

export const crqAnalyticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Master aggregate — KPIs + workflow stages + SLA domains + rejection
    // reasons in one call, backs the Dashboard tab.
    getCrqAnalyticsDashboard: builder.query<CRQAnalyticsDashboardResponse, CRQAnalyticsFilterParams>({
      query: (f) => ({ url: "/crq-analytics-new/dashboard", params: filterParams(f) }),
      providesTags: ["CrqAnalytics"],
    }),

    getCrqEngineerUtilization: builder.query<EngineerUtilizationDto[], CRQAnalyticsFilterParams>({
      query: (f) => ({ url: "/crq-analytics-new/engineer-utilization", params: filterParams(f) }),
      providesTags: ["CrqAnalytics"],
    }),

    getCrqOpenDomain: builder.query<CRQOpenDomainDto[], CRQAnalyticsFilterParams>({
      query: (f) => ({ url: "/crq-analytics-new/open-domain", params: filterParams(f) }),
      providesTags: ["CrqAnalytics"],
    }),

    getCrqRaisedVsClosed: builder.query<CRQRaisedVsClosedDto[], CRQAnalyticsFilterParams>({
      query: (f) => ({ url: "/crq-analytics-new/raised-closed", params: filterParams(f) }),
      providesTags: ["CrqAnalytics"],
    }),

    getCrqRunRate: builder.query<CRQRunRateDto[], CRQAnalyticsFilterParams>({
      query: (f) => ({ url: "/crq-analytics-new/run-rate", params: filterParams(f) }),
      providesTags: ["CrqAnalytics"],
    }),

    // groupBy only supports "region" | "circle" on this endpoint — domain-wise
    // breakdown is covered separately by /open-domain.
    getCrqGroupBreakdown: builder.query<
      CRQSiteGroupDto[],
      CRQAnalyticsFilterParams & { groupBy: GroupBreakdownDimension }
    >({
      query: ({ groupBy, ...f }) => ({
        url: "/crq-analytics-new/circle-region",
        params: { ...filterParams(f), groupBy },
      }),
      providesTags: ["CrqAnalytics"],
    }),

    getCrqAgingHeatmap: builder.query<CRQAgingBucketDto[], AgingHeatmapParams>({
      query: ({ heatmapMode, ...f }) => ({
        url: "/crq-analytics-new/aging-heatmap",
        params: { ...filterParams(f), heatmapMode },
      }),
      providesTags: ["CrqAnalytics"],
    }),

    getCrqAnalyticsList: builder.query<CRQListResponse, CRQListParams>({
      query: ({ status, stage, rejectionReason, page, size, ...f }) => ({
        url: "/crq-analytics-new/crqs",
        params: {
          ...filterParams(f),
          status: status ?? "",
          stage: stage ?? "",
          rejectionReason: rejectionReason ?? "",
          page: page ?? 0,
          size: size ?? 200,
        },
      }),
      providesTags: ["CrqAnalytics"],
    }),

    getCrqDetail: builder.query<CRQDetailResponse, string>({
      query: (changeId) => `/crq-analytics-new/crqs/${encodeURIComponent(changeId)}`,
      providesTags: (_r, _e, changeId) => [{ type: "CrqAnalytics" as const, id: changeId }],
    }),

    // ── "View All" full-screen tables (one per chart) ──────────────────────
    getCrqViewAllCircleRegion: builder.query<ViewAllResponse, ViewAllParams & { groupBy: GroupBreakdownDimension }>({
      query: ({ groupBy, ...f }) => ({
        url: "/crq-analytics-new/view-all/circle-region",
        params: { ...viewAllParams(f), groupBy },
      }),
      providesTags: ["CrqAnalytics"],
    }),

    getCrqViewAllOpenDomain: builder.query<ViewAllResponse, ViewAllParams>({
      query: (f) => ({ url: "/crq-analytics-new/view-all/open-domain", params: viewAllParams(f) }),
      providesTags: ["CrqAnalytics"],
    }),

    getCrqViewAllAgingHeatmap: builder.query<ViewAllResponse, ViewAllParams & { heatmapMode: string }>({
      query: ({ heatmapMode, ...f }) => ({
        url: "/crq-analytics-new/view-all/aging-heatmap",
        params: { ...viewAllParams(f), heatmapMode },
      }),
      providesTags: ["CrqAnalytics"],
    }),

    getCrqViewAllOpenVsClosed: builder.query<ViewAllResponse, ViewAllParams>({
      query: (f) => ({ url: "/crq-analytics-new/view-all/raised-closed", params: viewAllParams(f) }),
      providesTags: ["CrqAnalytics"],
    }),

    getCrqViewAllRunRate: builder.query<ViewAllResponse, ViewAllParams>({
      query: (f) => ({ url: "/crq-analytics-new/view-all/run-rate", params: viewAllParams(f) }),
      providesTags: ["CrqAnalytics"],
    }),

    getAnalyticsReportDates: builder.query<AvailableDatesResponse, AnalyticsReportType>({
      query: (reportType) => `/analytics/reports/${reportType}`,
    }),

    getAnalyticsReportsForDate: builder.query<
      AvailableReportsResponse,
      { reportType: AnalyticsReportType; date: string }
    >({
      query: ({ reportType, date }) => `/analytics/reports/${reportType}/${date}`,
    }),

    downloadAnalyticsReport: builder.query<Blob, DownloadReportArgs>({
      query: ({ reportType, date, fileName }) => ({
        url: `/analytics/reports/${reportType}/${date}/download/${fileName}`,
        method: "GET",
        responseHandler: (response: Response) => response.blob(),
        cache: "no-cache",
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCrqAnalyticsDashboardQuery,
  useGetCrqEngineerUtilizationQuery,
  useGetCrqOpenDomainQuery,
  useGetCrqRaisedVsClosedQuery,
  useGetCrqRunRateQuery,
  useGetCrqGroupBreakdownQuery,
  useGetCrqAgingHeatmapQuery,
  useGetCrqAnalyticsListQuery,
  useGetCrqDetailQuery,
  useGetCrqViewAllCircleRegionQuery,
  useGetCrqViewAllOpenDomainQuery,
  useGetCrqViewAllAgingHeatmapQuery,
  useGetCrqViewAllOpenVsClosedQuery,
  useGetCrqViewAllRunRateQuery,
  useGetAnalyticsReportDatesQuery,
  useGetAnalyticsReportsForDateQuery,
  useLazyDownloadAnalyticsReportQuery,
} = crqAnalyticsApi;
