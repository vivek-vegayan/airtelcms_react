import { api } from "../../../service/api";
import { STAGE_CONFIG_MAP } from "../constants/stageConfig";
import type { CrqReviewResponse } from "../types/crqWorkflow.types";
import type { StageActionParams, StageDonePayload, StageKey } from "../types/stageWorkflow.types";

/** Workflow order - used to invalidate the next stage's cache after a pass. */
const STAGE_SEQUENCE: StageKey[] = [
  "impactanalysis",
  "mopcreate",
  "mopvalidate",
  "scheduling",
  "activityimplement",
  "closer",
];

const nextStageKey = (stageKey: StageKey): StageKey | null => {
  const idx = STAGE_SEQUENCE.indexOf(stageKey);
  return idx >= 0 && idx + 1 < STAGE_SEQUENCE.length ? STAGE_SEQUENCE[idx + 1] : null;
};

export const stageWorkflowApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    // `domainId: null` means the caller's role has no domain scope
    // (TEAM_MEMBER/TEAM_LEAD) - the param is then left off the request
    // entirely, and the backend's stage procedures scope such a caller by
    // their own assignments + sub-domain instead. See util/orgScope.ts.
    getStageData: builder.query<
      CrqReviewResponse,
      { stageKey: StageKey; domainId?: number | null; subDomainId: number }
    >({
      query: ({ stageKey, domainId, subDomainId }) => ({
        url: STAGE_CONFIG_MAP[stageKey].reviewQueryUrl,
        method: "GET",
        params: { domainId: domainId ?? undefined, subDomainId },
      }),
      providesTags: (_result, _error, arg) => [
        { type: "StageWorkflow", id: arg.stageKey },
      ],
    }),

    // POST /crqworkflow/{endpointBase}/start|pause?crqNo=&crqId=
    updateStageStatus: builder.mutation<
      { message?: string },
      StageActionParams & { stageKey: StageKey; action: "start" | "pause" }
    >({
      query: ({ stageKey, crqNo, crqId, action }) => ({
        url: `/crqworkflow/${STAGE_CONFIG_MAP[stageKey].endpointBase}/${action}`,
        method: "POST",
        params: { crqNo, crqId },
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "StageWorkflow", id: arg.stageKey },
        "CrqReview",
      ],
    }),

    // POST /crqworkflow/{endpointBase}/done?<stage specific params>
    submitStageDone: builder.mutation<
      { message?: string },
      StageDonePayload & { stageKey: StageKey }
    >({
      query: ({ stageKey, ...params }) => ({
        url: `/crqworkflow/${STAGE_CONFIG_MAP[stageKey].endpointBase}/done`,
        method: "POST",
        params,
      }),
      // A pass moves the CRQ into the next stage, so refresh that stage's
      // listing (and the overview/cockpit data) alongside this one.
      invalidatesTags: (_result, _error, arg) => {
        const tags: any[] = [{ type: "StageWorkflow", id: arg.stageKey }, "CrqReview"];
        const next = nextStageKey(arg.stageKey);
        if (next) tags.push({ type: "StageWorkflow", id: next });
        return tags;
      },
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetStageDataQuery,
  useUpdateStageStatusMutation,
  useSubmitStageDoneMutation,
} = stageWorkflowApiSlice;
