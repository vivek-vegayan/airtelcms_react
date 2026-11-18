import { api } from "../../../service/api";
import type {
  AnalyticsReportType,
  AvailableDatesResponse,
  AvailableReportsResponse,
  DownloadReportArgs,
} from "../types/crqAnalytics.types";

export const crqAnalyticsApi = api.injectEndpoints({
  endpoints: (builder) => ({
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
  useGetAnalyticsReportDatesQuery,
  useGetAnalyticsReportsForDateQuery,
  useLazyDownloadAnalyticsReportQuery,
} = crqAnalyticsApi;
