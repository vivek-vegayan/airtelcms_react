import { api } from "../../../service/api";
import {
  parseImpactBatchStatus,
  type ImpactAnalysisEntity,
  type ImpactBatchStatus,
  type ImpactBatchStatusMap,
  type ImpactScriptResult,
} from "../types/impactBatch.types";

interface ErrorBody {
  message?: string;
  status?: string;
}

function toErrorMessage(response: { data?: unknown }, fallback: string): string {
  const data = response.data as ErrorBody | undefined;
  return data?.message || fallback;
}

/**
 * Impact Analysis stage. The two summary calls are strictly ordered:
 *
 *   1. getImpactBatchStatus  -> GET /impact/statuscsv/batch?crqNo=...
 *      Lists the batches that actually have CSVs on SFTP, each with the
 *      `modifiedDate` (SFTP mtime, "yyyy-MM-dd HH:mm:ss") of that batch.
 *
 *   2. getImpactAnalysisSummary -> GET /crqworkflow/impactanalysis/batch
 *      Must be called with the batchNo *and* the modifiedDate step 1 reported
 *      for that batch: the proc (chm_get_main_summary_data) matches rows on
 *      the date portion of modifiedDate, so any locally-invented date (e.g.
 *      "today at noon") silently returns nothing for a batch produced earlier.
 *
 * Nothing here changes a backend contract - step 2's params are unchanged,
 * they are just now sourced from step 1 instead of from the clock.
 */
export const impactBatchApiSlice = api.injectEndpoints({
  endpoints: (builder) => ({
    // STEP 1 - GET /impact/statuscsv/batch?crqNo=
    // Body: {"Batch_1": {files: [...], modifiedDate: "yyyy-MM-dd HH:mm:ss"}, ...}
    // 404 {status:"ERROR", message:"No batch CSV files found for CRQ: ..."}
    // when the script has never produced files for this CRQ.
    getImpactBatchStatus: builder.query<ImpactBatchStatus[], { crqNo: string }>({
      query: ({ crqNo }) => ({
        url: "/impact/statuscsv/batch",
        method: "GET",
        params: { crqNo },
      }),
      transformResponse: (response: ImpactBatchStatusMap) => parseImpactBatchStatus(response),
      providesTags: (_r, _e, arg) => [{ type: "ImpactBatch", id: `status-${arg.crqNo}` }],
      transformErrorResponse: (response) =>
        toErrorMessage(response, "No impact analysis batch files found for this CRQ yet."),
    }),

    // STEP 2 - GET /crqworkflow/impactanalysis/batch?crqNo=&batchNo=&flag=&modifiedDate=
    // flag="Main" (default) -> top-level entity categories (B2B, IWAN, ...);
    // flag=<category> -> that category's sub-entity breakdown.
    // `modifiedDate` is passed through verbatim as the string step 1 returned,
    // so no local re-formatting/timezone shift can move it off the run's date.
    getImpactAnalysisSummary: builder.query<
      ImpactAnalysisEntity[],
      { crqNo: string; batchNo: number; modifiedDate: string; flag?: string }
    >({
      query: ({ crqNo, batchNo, modifiedDate, flag }) => ({
        url: "/crqworkflow/impactanalysis/batch",
        method: "GET",
        params: {
          crqNo,
          batchNo,
          flag: flag || "Main",
          modifiedDate,
        },
      }),
      providesTags: (_r, _e, arg) => [
        {
          type: "ImpactBatch",
          id: `${arg.crqNo}-${arg.batchNo}-${arg.flag || "Main"}-${arg.modifiedDate}`,
        },
      ],
      transformErrorResponse: (response) =>
        toErrorMessage(response, "Failed to load impact analysis summary."),
    }),

    // POST /crqworkflow/impactanalysis-script?crqNo=&attempt= - runs the
    // remote script for that attempt/batch. It writes new CSVs to SFTP, so it
    // invalidates the whole ImpactBatch type: step 1 has to re-list the
    // batches (and pick up the new modifiedDate) before step 2 can be right.
    runImpactAnalysisScript: builder.mutation<ImpactScriptResult, { crqNo: string; attempt: number }>({
      query: ({ crqNo, attempt }) => ({
        url: "/crqworkflow/impactanalysis-script",
        method: "POST",
        params: { crqNo, attempt },
      }),
      invalidatesTags: ["ImpactBatch"],
      transformErrorResponse: (response) =>
        toErrorMessage(response, "Failed to execute impact analysis script."),
    }),

    // POST /excel/impact-batchwise - merges the given CSV file names into one multi-sheet .xlsx.
    downloadImpactBatchExcel: builder.query<Blob, { fileNames: string[] }>({
      query: ({ fileNames }) => ({
        url: "/excel/impact-batchwise",
        method: "POST",
        body: fileNames,
        responseHandler: (response: Response) => response.blob(),
        cache: "no-cache",
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetImpactBatchStatusQuery,
  useGetImpactAnalysisSummaryQuery,
  useRunImpactAnalysisScriptMutation,
  useLazyDownloadImpactBatchExcelQuery,
} = impactBatchApiSlice;
