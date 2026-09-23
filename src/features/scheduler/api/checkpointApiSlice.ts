import { api } from "../../../service/api";
import type { CheckpointsApiResponse } from "../types/checkpoint.types";

/**
 * CRQ Review's CheckPoint Summary Preview (PlanningWorkflowController's
 * /json/raw/{crqNo} pair, mirroring the legacy planning module's URL
 * contract). The GET streams back the validation JSON fetched live from
 * SFTP each call.
 *
 * "Data Refresh" is a separate call (CrqWorkflowController's
 * /refetchcheckpointscript, legacy schedular module) that re-runs the
 * validation script over SSH to regenerate CRQ_<crqNo>_output.json on the
 * SFTP side before the panel re-reads it.
 */
export const checkpointApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /planningworkflow/json/raw/{crqNo}
    getCheckpointsByCrqNo: builder.query<CheckpointsApiResponse, string>({
      query: (crqNo) => ({
        url: `/planningworkflow/json/raw/${crqNo}`,
        method: "GET",
      }),
      providesTags: (_result, _error, crqNo) => [
        { type: "Checkpoints", id: crqNo },
      ],
    }),

    // PUT /planningworkflow/json/raw/{crqNo} - flips one checkpoint's
    // Pass/Fail status in the JSON and re-uploads it to the same SFTP path.
    updateCheckpointStatus: builder.mutation<
      string,
      { crqNo: string; checkpointId: string; value: "Pass" | "Fail" }
    >({
      query: ({ crqNo, checkpointId, value }) => ({
        url: `/planningworkflow/json/raw/${crqNo}`,
        method: "PUT",
        body: { checkpointId, value },
      }),
      invalidatesTags: (_result, _error, { crqNo }) => [
        { type: "Checkpoints", id: crqNo },
      ],
    }),

    // POST /crqworkflow/refetchcheckpointscript?crqNo= - re-runs the
    // validation script over SSH, then invalidates the GET so the panel
    // re-reads the freshly generated file.
    refetchCheckpointScript: builder.mutation<string, string>({
      query: (crqNo) => ({
        url: "/crqworkflow/refetchcheckpointscript",
        method: "POST",
        params: { crqNo },
      }),
      invalidatesTags: (_result, _error, crqNo) => [
        { type: "Checkpoints", id: crqNo },
      ],
    }),
  }),
});

export const {
  useGetCheckpointsByCrqNoQuery,
  useUpdateCheckpointStatusMutation,
  useRefetchCheckpointScriptMutation,
} = checkpointApiSlice;
