/** Date range shared by every report tab; ISO `YYYY-MM-DD`. */
export interface ReportDateRange {
  startDate: string;
  endDate: string;
}

/** A report request for one page. */
export interface PagedReportParams extends ReportDateRange {
  page: number;
  size: number;
}

/** Shape returned by DatabaseUtils.executeProcedureAndProvideKeyValueWithHeadersFormat. */
export interface HeadersDataResponse {
  headers: string[];
  data: Record<string, string | number | null>[];
}
