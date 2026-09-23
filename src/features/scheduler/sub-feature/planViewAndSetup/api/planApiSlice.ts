import { api } from "../../../../../service/api";

// ─── Plan Types ───────────────────────────────────────────────────────────────

export interface PlanViewRow {
  changeImpact: string;
  chmDomain: string;
  chmDomainId: number;
  chmSubDomain: string | null;
  chmSubDomainId: number;
  layer: string;
  networkDomain: string;
  planId: number;
  planType: string;
  planVendor: string;
  status: string;
}

export interface UpdatePlanRequest {
  actorUserId: number;
  planId: number;
  planType: string;
  status: string;
  chmDomainId: number;
  chmSubDomain: number;
  networkDomain: string;
  layer: string;
  planVendor: string;
  changeImpact: string;
}

export interface PlanViewQueryParams {
  verticalId?: number;
  functionId?: number;
  domainId?: number;
  subDomainId?: number;
  statusFilter?: string;
  page?: number;
  size?: number;
}

/** Mirrors backend common/dto/PageResponseDto.java */
export interface PlanPageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface AddPlanRequest {
  chmDomain: number;
  chmSubDomain: number;
  networkDomain: string;
  layer: string;
  planType: string;
  vendorOem: string;
  changeImpact: string;
}

// ─── Activity Phase View Types (GET response) ─────────────────────────────────

export interface PhaseConfig {
  activityPhaseConfigId?: number | null;
  assignTeam?: string | null;
  assignedSubDomainId?: number | null;
  minimumLevelRequirement?: string | null;
  shift?: string | null;
  time?: number | null;
}

export interface ExecutionConfig {
  activityPhaseConfigId?: number | null;
  assignTeam?: string | null;
  assignedSubDomainId?: number | null;
  daysMargin?: number | null;
  minimumLevelRequirement?: string | null;
  reservationMargin?: number | null;
  rollbackTime?: number | null;
  shift?: string | null;
  time?: number | null;
}

export interface ActivityEntry {
  activityId: string;
  activityName: string;
  execution: ExecutionConfig;
  phases: {
    review?: PhaseConfig | null;
    impactAnalysis?: PhaseConfig | null;
    scheduling?: PhaseConfig | null;
    mopCreation?: PhaseConfig | null;
    mopValidation?: PhaseConfig | null;
  };
}

export interface ActivityPhaseView {
  activities: ActivityEntry[];
  basicInfo: {
    chmDomain: string;
    chmSubDomain: string;
    domain: string;
    layer: string;
    planType: string;
    vendorOem: string;
    changeImpact: string;
    

  };
}

// ─── Activity Insert Types (POST payload) ─────────────────────────────────────

/** Base: 4 fields used by crqReview, impactAnalysis, scheduling, mopCreate, mopValidate */
export interface InsertPhaseConfig {
  shift: string;
  minimumLevelRequirement: string;
  requiredTimeMinutes: number;
  assignedToTeam: number;
}

/** Extended: 7 fields used only by crqExecution */
export interface InsertExecutionPhaseConfig extends InsertPhaseConfig {
  daysMargin: number;
  reservationMargin: number;
  rollbackTime: number;
}

/** Flat payload sent to /activity/insert */
export interface AddActivityRequest {
  actorUserId: number;
  planId: number;
  activityName: string;
  [key: string]: string | number;
}

// ─── Activity Phase Update Types (POST /activity/phase-update payload) ────────

export interface UpdateActivityPhaseRequest {
  activityPhaseConfigId: number;
  shift: string;
  minimumLevelRequirement: string;
  requiredTimeMinutes: number;
  assignedToTeam: number;
  daysMargin?: number | null;
  reservationMargin?: number | null;
  rollbackTime?: number | null;
}

// ─── Shift Dropdown ───────────────────────────────────────────────────────────

export interface ShiftDropdown {
  shiftId: number;
  shiftRange: string;
}

// ─── Plan+Activity Bulk Excel Upload Types ─────────────────────────────────────

/**
 * One row of the Plan+Activity bulk-upload sheet. Mirrors backend
 * PlanActivityExcelRowDto. Every hierarchy/team field is a plain name —
 * sp_insert_plan_activity (updated 2026-07-31) resolves Vertical/Team
 * Function/Domain/Sub Domain/Team names to IDs itself, so no ID fields are
 * ever sent to or echoed back from the backend.
 */
export interface PlanActivityExcelRow {
  rowNumber: number;

  verticalName: string;
  functionName: string;
  chmDomainName: string;
  chmSubDomainName: string;
  layer: string;
  planType: string;
  vendorOem: string;
  changeImpact: string;

  activityName: string;

  crqReviewShift: string;
  crqReviewMinimumLevelRequirement: string;
  crqReviewRequiredTimeMinutes: number | null;
  crqReviewTeamName: string;

  impactAnalysisShift: string;
  impactAnalysisMinimumLevelRequirement: string;
  impactAnalysisRequiredTimeMinutes: number | null;
  impactAnalysisTeamName: string;

  schedulingShift: string;
  schedulingMinimumLevelRequirement: string;
  schedulingRequiredTimeMinutes: number | null;
  schedulingTeamName: string;

  mopCreateShift: string;
  mopCreateMinimumLevelRequirement: string;
  mopCreateRequiredTimeMinutes: number | null;
  mopCreateTeamName: string;

  mopValidateShift: string;
  mopValidateMinimumLevelRequirement: string;
  mopValidateRequiredTimeMinutes: number | null;
  mopValidateTeamName: string;

  crqExecutionShift: string;
  crqExecutionMinimumLevelRequirement: string;
  crqExecutionRequiredTimeMinutes: number | null;
  crqExecutionDaysMargin: number | null;
  crqExecutionReservationMargin: number | null;
  crqExecutionRollbackTime: number | null;
  crqExecutionTeamName: string;
}

export interface PlanActivityValidationError {
  rowNumber: number;
  column: string;
  value: string | null;
  error: string;
}

export interface PlanActivityExcelParseResponse {
  totalRows: number;
  validRowCount: number;
  invalidRowCount: number;
  rows: PlanActivityExcelRow[];
  errors: PlanActivityValidationError[];
}

export interface PlanActivityExcelRowResult {
  rowNumber: number;
  activityName: string;
  status: "SUCCESS" | "FAILED";
  message: string;
  planId: number | null;
  activityId: string | null;
}

export interface PlanActivityExcelUploadSummary {
  totalRows: number;
  successCount: number;
  failedCount: number;
  processingTimeMs: number;
  results: PlanActivityExcelRowResult[];
}

// ─── API Endpoints ────────────────────────────────────────────────────────────

export const planApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPlanView: builder.query<PlanPageResponse<PlanViewRow>, PlanViewQueryParams>({
      query: (params) => ({ url: "/plan/view", method: "GET", params }),
      providesTags: ["Plan"],
    }),
    getActivityPhaseView: builder.query<ActivityPhaseView, { planId: number }>({
      query: ({ planId }) => ({
        url: "/activity/phase-view",
        method: "GET",
        params: { planId },
      }),
      providesTags: ["ActivityPhase"],
    }),
    getShiftDropdowns: builder.query<ShiftDropdown[], void>({
      query: () => ({
        url: "/monthlyrosterview/shiftdropdowns",
        method: "GET",
      }),
      providesTags: ["ShiftDropdown"],
    }),
    addActivity: builder.mutation<void, AddActivityRequest>({
      query: (body) => ({
        url: "/activity/insert",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ActivityPhase"],
    }),
    updateActivityPhase: builder.mutation<
      { status?: string; message?: string },
      UpdateActivityPhaseRequest
    >({
      query: (body) => ({
        url: "/activity/phase-update",
        method: "POST",
        body,
      }),
      invalidatesTags: ["ActivityPhase"],
    }),
    updatePlan: builder.mutation<{ status?: string; message?: string }, UpdatePlanRequest>({
      query: (body) => ({
        url: "/activity/updateplan",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Plan"],
    }),
    addPlan: builder.mutation<{ status?: string; message?: string }, AddPlanRequest>({
      query: (body) => ({
        url: "/activity/insertPlan",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Plan"],
    }),

    // ── Plan+Activity Bulk Excel Upload ──────────────────────────────────────
    downloadPlanActivityTemplate: builder.query<Blob, void>({
      query: () => ({
        url: "/activity/excel/v1/template",
        method: "GET",
        responseHandler: (response) => response.blob(),
        cache: "no-cache",
      }),
    }),
    parsePlanActivityExcel: builder.mutation<PlanActivityExcelParseResponse, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append("file", file);
        return {
          url: "/activity/excel/v1/parse",
          method: "POST",
          body: formData,
        };
      },
    }),
    uploadPlanActivityExcel: builder.mutation<PlanActivityExcelUploadSummary, PlanActivityExcelRow[]>({
      query: (rows) => ({
        url: "/activity/excel/v1/upload",
        method: "POST",
        body: rows,
      }),
      invalidatesTags: ["Plan"],
    }),
  }),
});

export const {
  useGetPlanViewQuery,
  useGetActivityPhaseViewQuery,
  useGetShiftDropdownsQuery,
  useAddActivityMutation,
  useUpdateActivityPhaseMutation,
  useUpdatePlanMutation,
  useAddPlanMutation,
  useLazyDownloadPlanActivityTemplateQuery,
  useParsePlanActivityExcelMutation,
  useUploadPlanActivityExcelMutation,
} = planApi;
