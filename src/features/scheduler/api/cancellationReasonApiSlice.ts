import { api } from "../../../service/api";

/** One row of sp_Get_Distinct_Cancellation_Reasons (CrqWorkflowController). */
export interface CancellationReasonOption {
  cancellationReason: string;
  /** Owner the cancellation rolls back to - fixed by the reason, not chosen. */
  cancellationRollbackOwner: string;
}

/**
 * GET /crqworkflow/cancellation-reasons - the reason/owner pairs behind the
 * cancellation block of every stage review dialog.
 *
 * The list is caller-independent and changes only when the database's reason
 * table does, so it is fetched once and kept for an hour rather than being
 * re-requested each time a dialog opens. It carries no tag for the same
 * reason: nothing in the app invalidates it.
 */
export const cancellationReasonApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    getCancellationReasons: builder.query<CancellationReasonOption[], void>({
      query: () => ({
        url: "/crqworkflow/cancellation-reasons",
        method: "GET",
      }),
      keepUnusedDataFor: 3600,
    }),
  }),
  overrideExisting: false,
});

export const { useGetCancellationReasonsQuery } = cancellationReasonApiSlice;
