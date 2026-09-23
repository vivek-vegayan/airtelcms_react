import { api } from "../../../service/api";

/**
 * One hit of GET /crqworkflow/search - mirrors backend
 * schedular/dto/CrqGlobalSearchDto.java.
 *
 * Unlike every other CRQ endpoint in this feature, this one is NOT scoped to
 * the domain/sub-domain selected in the filter bar: it searches across the
 * whole estate (still subject to role visibility - a TEAM_MEMBER only matches
 * their own CRQs). Each hit therefore carries the CRQ's own org scope so the
 * workflow can retarget its filters before jumping to the stage.
 */
export interface CrqGlobalSearchHit {
  crqNo: string;
  crqId: number;

  /**
   * Raw CRQ_MASTER_TBL.current_stage enum - VALIDATE | IMPACT_ANALYSIS |
   * MOP_CREATION | MOP_VALIDATION | SCHEDULING_APPROVAL | EXECUTION | CLOSURE.
   * This is the authoritative field the stage routing is derived from; it is
   * mapped through STAGE_ENUM_TO_ID (constants/workflowStages.ts) rather than
   * matched on any display label.
   */
  currentStage: string | null;
  /** Same value pre-resolved to the frontend stage key by the backend; may be null. */
  stageKey: string | null;
  /** 1-based position of currentStage in the 7-stage workflow; may be null. */
  stageOrder: number | null;

  /** Raw CRQ_MASTER_TBL.current_status enum. */
  currentStatus: string | null;
  /** Display form of current_status, matching the rest of the cockpit. */
  crqStatus: string | null;

  domainId: number | null;
  subDomainId: number | null;
  domainName: string | null;
  subDomainName: string | null;

  planNumber: string | null;
  planType: string | null;
  description: string | null;

  executionSlotStart: string | null;
  executionSlotEnd: string | null;
  enteredCurrentStageAt: string | null;
  raised: string | null;
  lastUpdated: string | null;
}

export const crqGlobalSearchApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /crqworkflow/search?crqNo=&limit=
    //
    // Read-only lookup. Deliberately carries no cache tag: it must never be
    // invalidated by - or invalidate - the existing CrqReview / StageWorkflow
    // caches that drive the workflow's normal navigation, so adding the search
    // cannot disturb how any existing screen refreshes.
    searchCrqGlobally: builder.query<
      CrqGlobalSearchHit[],
      { crqNo: string; limit?: number }
    >({
      query: ({ crqNo, limit = 10 }) => ({
        url: "/crqworkflow/search",
        method: "GET",
        params: { crqNo, limit },
      }),
      // Tolerate a backend that returns null/an object instead of an array
      // rather than letting a malformed payload crash the search UI.
      transformResponse: (response: unknown): CrqGlobalSearchHit[] =>
        Array.isArray(response) ? (response as CrqGlobalSearchHit[]) : [],
    }),
  }),
  overrideExisting: false,
});

export const { useLazySearchCrqGloballyQuery } = crqGlobalSearchApiSlice;
