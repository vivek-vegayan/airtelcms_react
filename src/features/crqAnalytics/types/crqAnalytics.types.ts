// Mirrors com.vegayan.airtelmanagement.crqanalytic.dto exactly (CRQAnalyticsDashboardController,
// base path /crq-analytics-new). Field names match the real Java DTOs field-for-field.

export interface CRQAnalyticsFilterParams {
  teamFunctionId?: number;
  domainId?: number;
  subDomainId?: number;
  circleId?: string;
  startDate: string; // ISO yyyy-MM-dd
  endDate: string; // ISO yyyy-MM-dd
}

// totalCrq..slaScore are boxed Integer/Double on the Java side, so the
// backend's own empty-fallback object (returned when its stored procedure
// errors or yields no row) sends these as null, not 0 — every reader must
// treat them as optional.
export interface CRQKpiSummaryDto {
  totalCrq: number | null;
  openCrq: number | null;
  closedCrq: number | null;
  rejected: number | null;
  slaScore: number | null;
  totalTrendPct: number | null;
  openTrendPct: number | null;
  closedTrendPct: number | null;
  rejectedTrendPct: number | null;
  slaTrendPct: number | null;
}

export interface CRQWorkflowStageDto {
  stage: string;
  totalCount: number;
  openCount: number;
}

export interface CRQSlaDomainDto {
  stageName: string;
  slaBreachCount: number;
}

export interface CRQRejectionReasonDto {
  reason: string;
  count: number;
  pct: number;
}

/** GET /crq-analytics-new/dashboard — backs the Dashboard tab's KPI + workflow + SLA + rejection panels. */
export interface CRQAnalyticsDashboardResponse {
  status: string;
  kpi: CRQKpiSummaryDto;
  workflowStages: CRQWorkflowStageDto[];
  slaDomains: CRQSlaDomainDto[];
  rejectionReasons: CRQRejectionReasonDto[];
}

export interface EngineerUtilizationDto {
  engineerName: string;
  teamFunction: string;
  skillTags: string;
  planAndInventoryValidation: number;
  impactAnalysis: number;
  mopCreate: number;
  mopValidate: number;
  schedulingAndApprovals: number;
  networkExecution: number;
  taskClosure: number;
  totalTasks: number;
  plannedHrs: number;
  actualHrs: number;
  utilizationPct: number;
}

export interface CRQOpenDomainDto {
  domain: string;
  ccb: number;
  se: number;
}

export interface CRQRaisedVsClosedDto {
  label: string;
  raised: number;
  closed: number;
  rejected: number;
}

export interface CRQRunRateDto {
  date: string;
  receivedInCcb: number;
  movedToSe: number;
  seToClosed: number;
}

/** GET /crq-analytics-new/circle-region — groupBy only supports these two dimensions. */
export type GroupBreakdownDimension = "region" | "circle";

export interface CRQSiteGroupDto {
  group: string;
  raised: number;
  closed: number;
  rejected: number;
}

export type AgingHeatmapMode = "SCHEDULED" | "RECEIVED";

export interface CRQAgingBucketDto {
  bucket: string;
  ccb: number;
  se: number;
}

export interface AgingHeatmapParams extends CRQAnalyticsFilterParams {
  heatmapMode: AgingHeatmapMode;
}

// ─── "View All" full-screen tables ───────────────────────────────────────────
// The 5 /view-all/* endpoints all share the same generic shape: the backend
// runs a wider stored procedure and hands back whatever columns it selected,
// so the frontend renders them dynamically rather than with fixed DTOs.

export interface ViewAllResponse {
  headers: string[];
  data: Record<string, string | number | null>[];
}

export interface ViewAllParams extends CRQAnalyticsFilterParams {
  page?: number;
  size?: number;
}

/** Which full-screen table a "View All" button / chart-element click opens. */
export type TableViewConfig =
  | { title: string; tableType: "CIRCLE_REGION"; groupBy: GroupBreakdownDimension }
  | { title: string; tableType: "OPEN_CRQ_DOMAIN" }
  | { title: string; tableType: "AGING_HEATMAP"; heatmapMode: AgingHeatmapMode }
  | { title: string; tableType: "OPEN_VS_CLOSED" }
  | { title: string; tableType: "RUN_RATE" }
  | { title: string; tableType: "CRQ_LIST"; status?: string; stage?: string; rejectionReason?: string };

export type AnalyticsNavState =
  | { view: "grid" }
  | { view: "table"; tableConfig: TableViewConfig };

// ─── CRQ list (drill-down table) + detail (row click) ───────────────────────

export interface CRQTableRowDto {
  crqNo: string;
  currentStage: string;
  currentStatus: string;
  teamFunction: string;
  teamSubfunction: string;
  schedulingFlag: string;
  approvalFlag: string;
}

export interface CRQListResponse {
  totalCount: number;
  page: number;
  size: number;
  data: CRQTableRowDto[];
}

export interface CRQListParams extends CRQAnalyticsFilterParams {
  status?: string;
  stage?: string;
  rejectionReason?: string;
  page?: number;
  size?: number;
}

export interface CRQTimelineStepDto {
  stepNo: number;
  label: string;
  status: "completed" | "active" | "pending" | "rejected";
}

/** GET /crq-analytics-new/crqs/{changeId} */
export interface CRQDetailResponse {
  crqNo: string;
  title: string;
  currentStage: string;
  planNo: string;

  impactLabel: string;
  impactCount: number;
  progressPct: number | null;

  lastUpdated: string;
  status: string;

  requestor: string;
  category: string;
  circle: string;
  planType: string;
  domain: string;
  scheduledDate: string;
  impact: string;
  executionWindow: string;
  submitDate: string;

  fieldEngineerName: string;
  fieldEngineerMobile: string;
  fieldEngineerEmail: string;

  flagB2B: boolean;
  flagSA: boolean;
  flagCoreNode: boolean;
  flagNSA: boolean;

  approvalActionStage: string;
  approvalActionUser: string;
  canApprove: boolean;

  timeline: CRQTimelineStepDto[];
}

// ─── Reports tab — com.vegayan.airtelmanagement.analyticsreport (unchanged) ─

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
