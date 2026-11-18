// Reports tab — mirrors com.vegayan.airtelmanagement.analyticsreport (base path /analytics/reports).

export type AnalyticsReportType = "daily" | "weekly" | "monthly";

export interface AvailableDatesResponse {
  availableDates: string[];
}

export interface AvailableReportsResponse {
  availableReports: string[];
}

export interface DownloadReportArgs {
  reportType: AnalyticsReportType;
  date: string;
  fileName: string;
}
