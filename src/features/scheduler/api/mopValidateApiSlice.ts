import { api } from "../../../service/api";
import type { MopValidateDetails } from "../types/mopValidate.types";

/**
 * The MOP Validate stage's preview panel - the CRQ's current MOP version and
 * the review opened against it.
 *
 * Kept out of `stageWorkflowApiSlice`, which is stage-agnostic by design (every
 * endpoint in it is keyed by `StageKey` and shared by all seven stages), and
 * out of `mopDocumentApiSlice`, which owns the MOP *document* in `CRQ_PDF_TBL`.
 * This slice owns the MOP *record* - `mop_version` / `mop_review` - which is a
 * separate store reached through separate procedures.
 */
export const mopValidateApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /crqworkflow/mopvalidate/{crqNo}/details - SP_GET_MOP_CURRENT_VERSION
    // for the version id, then the version, its document and any open review.
    // A CRQ with no MOP is a 200 with `mopExists: false`, not an error.
    getMopValidateDetails: builder.query<MopValidateDetails, string>({
      query: (crqNo) => ({
        url: `/crqworkflow/mopvalidate/${crqNo}/details`,
        method: "GET",
      }),
      providesTags: (_result, _error, crqNo) => [{ type: "MopReview", id: crqNo }],
    }),

    // POST /crqworkflow/mopvalidate/{crqNo}/review/start - sp_mop_review_start.
    // A mutation, not part of the query above, because it writes: it inserts
    // `mop_review`, audits the open and moves both the version and the MOP to
    // in_review. The procedure INSERTs unconditionally and `mop_review` has no
    // unique key, so firing it on every dialog open would leave a trail of
    // duplicate open reviews - the backend refuses a second one, and this is
    // only ever sent on an explicit click.
    //
    // Answers with the refreshed details, so the panel needs no follow-up read.
    startMopReview: builder.mutation<MopValidateDetails, string>({
      query: (crqNo) => ({
        url: `/crqworkflow/mopvalidate/${crqNo}/review/start`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, crqNo) => [{ type: "MopReview", id: crqNo }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetMopValidateDetailsQuery,
  useStartMopReviewMutation,
} = mopValidateApiSlice;
