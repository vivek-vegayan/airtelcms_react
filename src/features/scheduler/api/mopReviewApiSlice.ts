import { api } from "../../../service/api";
import type {
  AddMopFindingArgs,
  MopDecisionArgs,
  MopReviewWorkspace,
  SetMopFindingStateArgs,
} from "../types/mopReview.types";

/**
 * The fullscreen MOP validation workspace - the version under review, its
 * findings, the version history, the audit trail and the two decisions.
 *
 * Every mutation here answers with the whole refreshed workspace rather than a
 * status, so the rail, the header and the decision buttons move to the new
 * truth together. The tag invalidation below is therefore a safety net for
 * other subscribers (the light MOP Validate panel), not how this dialog
 * updates itself.
 */
export const mopReviewApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /crqworkflow/mopvalidate/{crqNo}/workspace?versionId=
    // versionId omitted -> the MOP's current version.
    getMopReviewWorkspace: builder.query<
      MopReviewWorkspace,
      { crqNo: string; versionId?: number | null }
    >({
      query: ({ crqNo, versionId }) => ({
        url: `/crqworkflow/mopvalidate/${crqNo}/workspace`,
        method: "GET",
        params: versionId != null ? { versionId } : undefined,
      }),
      providesTags: (_result, _error, arg) => [{ type: "MopReview", id: arg.crqNo }],
    }),

    // POST /crqworkflow/mopvalidate/{crqNo}/findings - sp_mop_finding_add,
    // which numbers the finding ("F-01"), stores it and audits the raise.
    addMopFinding: builder.mutation<MopReviewWorkspace, AddMopFindingArgs>({
      query: ({ crqNo, ...body }) => ({
        url: `/crqworkflow/mopvalidate/${crqNo}/findings`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: "MopReview", id: arg.crqNo }],
    }),

    // POST /crqworkflow/mopvalidate/{crqNo}/findings/{id}/state
    // The rail's "Delete" sends `withdrawn`, not a row deletion: the finding's
    // own "raised" audit entry would otherwise point at nothing.
    setMopFindingState: builder.mutation<MopReviewWorkspace, SetMopFindingStateArgs>({
      query: ({ crqNo, findingId, state }) => ({
        url: `/crqworkflow/mopvalidate/${crqNo}/findings/${findingId}/state`,
        method: "POST",
        body: { state },
      }),
      invalidatesTags: (_result, _error, arg) => [{ type: "MopReview", id: arg.crqNo }],
    }),

    // POST /crqworkflow/mopvalidate/{crqNo}/validate - sp_mop_version_validate.
    // `force` is the procedure's own override for validating while findings
    // are still open; without it the procedure refuses and says so.
    validateMopVersion: builder.mutation<MopReviewWorkspace, MopDecisionArgs>({
      query: ({ crqNo, ...body }) => ({
        url: `/crqworkflow/mopvalidate/${crqNo}/validate`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "MopReview", id: arg.crqNo },
        { type: "MopDocument", id: arg.crqNo },
      ],
    }),

    // POST /crqworkflow/mopvalidate/{crqNo}/reject - sp_mop_version_reject,
    // which requires a non-empty reason.
    rejectMopVersion: builder.mutation<MopReviewWorkspace, MopDecisionArgs>({
      query: ({ crqNo, ...body }) => ({
        url: `/crqworkflow/mopvalidate/${crqNo}/reject`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: "MopReview", id: arg.crqNo },
        { type: "MopDocument", id: arg.crqNo },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMopReviewWorkspaceQuery,
  useAddMopFindingMutation,
  useSetMopFindingStateMutation,
  useValidateMopVersionMutation,
  useRejectMopVersionMutation,
} = mopReviewApiSlice;
