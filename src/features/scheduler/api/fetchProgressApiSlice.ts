import { api } from "../../../service/api";
import type { FetchProgress, FetchStage } from "../types/fetchProgress.types";

/**
 * Node/interface fetch progress (CrqFetchProgressController). The fetch
 * daemon runs 24x7 and starts jobs itself, so there is no job id to poll -
 * the newest job is looked up by CRQ and stage. Callers poll the GET while
 * the job is unfinished and stop once it is terminal.
 */
export const fetchProgressApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /crqworkflow/fetch/by-crq/{crqNo}?stage= - 204 (-> null) until
    // the daemon has started a job for this CRQ.
    getFetchProgressByCrq: builder.query<FetchProgress | null, { crqNo: string; stage: FetchStage }>({
      query: ({ crqNo, stage }) => ({
        url: `/crqworkflow/fetch/by-crq/${encodeURIComponent(crqNo)}`,
        method: "GET",
        params: { stage },
      }),
      transformResponse: (response: FetchProgress | null) => response ?? null,
      providesTags: (_r, _e, arg) => [{ type: "FetchProgress", id: `${arg.crqNo}-${arg.stage}` }],
    }),

    // GET /crqworkflow/fetch/by-crq/{crqNo}/batches - every Impact Analysis
    // batch job (Batch1..4 per run type), oldest -> newest within a batch.
    getImpactFetchBatches: builder.query<FetchProgress[], { crqNo: string }>({
      query: ({ crqNo }) => ({
        url: `/crqworkflow/fetch/by-crq/${encodeURIComponent(crqNo)}/batches`,
        method: "GET",
      }),
      providesTags: (_r, _e, arg) => [{ type: "FetchProgress", id: `${arg.crqNo}-batches` }],
    }),

    // POST /crqworkflow/fetch/{jobId}/cancel - the daemon checks the flag
    // between units, so it lands mid-job.
    cancelFetchJob: builder.mutation<{ status: string; message: string }, { jobId: number }>({
      query: ({ jobId }) => ({
        url: `/crqworkflow/fetch/${jobId}/cancel`,
        method: "POST",
      }),
      invalidatesTags: ["FetchProgress"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetFetchProgressByCrqQuery,
  useGetImpactFetchBatchesQuery,
  useCancelFetchJobMutation,
} = fetchProgressApiSlice;
