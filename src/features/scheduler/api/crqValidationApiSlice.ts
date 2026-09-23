import { api } from "../../../service/api";
import type { CrqValidationDetails, CrqValidationSaveRequest } from "../types/crqValidation.types";

/**
 * The Validate dialog's two procedure calls (CrqValidationController ->
 * get_crq_validation_details / update_validation_details).
 *
 * The read is cached per CRQ, so re-opening the dialog for a CRQ already
 * loaded in this session renders from cache instead of refetching; the dialog
 * only subscribes while it is open (`skip`), which is what keeps the call off
 * the cockpit's initial render.
 *
 * The save returns the refreshed row, so RTK Query writes the authoritative
 * (trimmed, upserted) values straight into the cache - no follow-up GET. The
 * tag invalidation is therefore only a safety net for other subscribers.
 */
export const crqValidationApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /crqworkflow/validation/details?crqNo=
    getCrqValidationDetails: builder.query<CrqValidationDetails, { crqNo: string }>({
      query: ({ crqNo }) => ({
        url: "/crqworkflow/validation/details",
        method: "GET",
        params: { crqNo },
      }),
      providesTags: (_r, _e, arg) => [{ type: "CrqValidation", id: arg.crqNo }],
    }),

    // POST /crqworkflow/validation/save
    saveCrqValidationDetails: builder.mutation<CrqValidationDetails, CrqValidationSaveRequest>({
      query: (body) => ({
        url: "/crqworkflow/validation/save",
        method: "POST",
        body,
      }),
      // Seed the cache from the response the save already returned, so the
      // dialog re-renders from DB truth without a second round trip.
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            crqValidationApiSlice.util.upsertQueryData(
              "getCrqValidationDetails",
              { crqNo: arg.crqNo },
              data,
            ),
          );
        } catch {
          // Save failed - the dialog surfaces the server's message itself and
          // the cache must keep the last known-good row.
        }
      },
    }),
  }),
  overrideExisting: false,
});

export const { useGetCrqValidationDetailsQuery, useSaveCrqValidationDetailsMutation } =
  crqValidationApiSlice;
