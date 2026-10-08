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

// GET /activity/planshiftdropdown (activity_plan_shift_dropdown)
export interface ShiftDropdown {
  shiftId: number;
  shiftRange: string;
}

// GET /activity/layerdropdown (sp_get_layer_filter_dropdown)
export interface LayerDropdown {
  layerName: string;
}

// GET /activity/networkdomaindropdown (sp_get_domain_dropdown)
export interface NetworkDomainDropdown {
  domainName: string;
}

// ─── Plan+Activity Bulk Excel Upload Types ─────────────────────────────────────

/**
 * One phase row of an Activity block on the template's Upload sheet.
 * Mirrors backend PlanActivityExcelPhaseDto.
 */
export interface PlanActivityExcelPhase {
  rowNumber: number;
  phase: string;
  shift: string | null;
  minimumLevelRequirement: string | null;
  requiredTimeMinutes: number | null;
  /** "Vertical > Function > Domain > Sub Domain"; blank = activity's own Sub Domain. */
  teamPath: string | null;
  daysMargin: number | null;
  reservationMargin: number | null;
  rollbackTime: number | null;
}

/**
 * One Activity block (6 phase rows sharing an Activity Ref). Mirrors backend
 * PlanActivityExcelRowDto. Each phase is one sp_insert_plan_activity call,
 * which resolves every hierarchy/team name to IDs itself.
 */
export interface PlanActivityExcelRow {
  rowNumber: number;
  activityRef: string;

  verticalName: string;
  functionName: string;
  chmDomainName: string;
  chmSubDomainName: string;
  networkDomain: string;
  layer: string;
  planType: string;
  vendorOem: string;
  changeImpact: string;

  activityName: string;

  phases: PlanActivityExcelPhase[];
}

export interface PlanActivityValidationError {
  rowNumber: number;
  activityRef: string;
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
  activityRef: string;
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
        url: "/activity/planshiftdropdown",
        method: "GET",
      }),
      providesTags: ["ShiftDropdown"],
    }),
    getLayerDropdown: builder.query<LayerDropdown[], void>({
      query: () => ({
        url: "/activity/layerdropdown",
        method: "GET",
      }),
    }),
    getNetworkDomainDropdown: builder.query<NetworkDomainDropdown[], void>({
      query: () => ({
        url: "/activity/networkdomaindropdown",
        method: "GET",
      }),
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
  useGetLayerDropdownQuery,
  useGetNetworkDomainDropdownQuery,
  useAddActivityMutation,
  useUpdateActivityPhaseMutation,
  useUpdatePlanMutation,
  useAddPlanMutation,
  useParsePlanActivityExcelMutation,
  useUploadPlanActivityExcelMutation,
} = planApi;
