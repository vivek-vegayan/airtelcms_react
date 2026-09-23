import { format, parse } from "date-fns";

/**
 * The Impact Analysis stage runs an SSH script per "attempt" (aka batch),
 * which drops CSV files on SFTP and rows in IMPACT_ANALYSIS_FAILURE_TBL /
 * UIG_CHM_SUMMARY_TBL (CrqWorkflowController -> /crqworkflow/impactanalysis*).
 *
 * Which batches actually exist - and, crucially, *when* each one was produced -
 * is not guessable client-side, so the UI always resolves it in two steps:
 *
 *   1. GET /impact/statuscsv/batch?crqNo=...        -> the batches on SFTP
 *   2. GET /crqworkflow/impactanalysis/batch?...    -> per-batch summary rows,
 *      using the batchNo *and* the modifiedDate step 1 reported for it.
 *
 * BATCH_SLOTS is only presentation metadata now (the human label for a batch
 * number); it no longer decides which batches are fetched.
 */
export const BATCH_SLOTS = [
  { key: "BATCH_1", batchNo: 1, label: "Batch 1", sublabel: "Insert started" },
  { key: "BATCH_2", batchNo: 2, label: "Batch 2", sublabel: "24 hours before execution" },
  { key: "BATCH_3", batchNo: 3, label: "Batch 3", sublabel: "4 hours before execution" },
  { key: "BATCH_4", batchNo: 4, label: "Batch 4", sublabel: "POST execution" },
] as const;

/** Human label/sublabel for a batch number, tolerant of numbers past the 4 known slots. */
export function batchSlotMeta(batchNo: number): { label: string; sublabel: string } {
  const slot = BATCH_SLOTS.find((s) => s.batchNo === batchNo);
  return slot ? { label: slot.label, sublabel: slot.sublabel } : { label: `Batch ${batchNo}`, sublabel: "Additional run" };
}

/**
 * STEP 1 - one value of GET /impact/statuscsv/batch, whose body is a
 * Map<batchKey, {files, modifiedDate}> keyed "Batch_1", "Batch_2", ...
 * `modifiedDate` is the SFTP mtime of that batch's CSVs, already formatted
 * "yyyy-MM-dd HH:mm:ss" - it is fed verbatim into step 2.
 */
export interface ImpactBatchStatusDTO {
  files: string[];
  modifiedDate: string;
}

export type ImpactBatchStatusMap = Record<string, ImpactBatchStatusDTO>;

/** Normalised, batch-number-sorted form of the map above. */
export interface ImpactBatchStatus {
  /** Raw response key, e.g. "Batch_1" - kept as a stable React key. */
  key: string;
  batchNo: number;
  files: string[];
  /** "yyyy-MM-dd HH:mm:ss" exactly as the server reported it. */
  modifiedDate: string;
  label: string;
  sublabel: string;
}

/**
 * Turns the raw `{"Batch_1": {...}}` map into a sorted array. Keys are matched
 * on their trailing digits so "Batch_1" / "batch1" / "1" all parse; anything
 * without a batch number is dropped rather than rendered as a broken card.
 */
export function parseImpactBatchStatus(map: ImpactBatchStatusMap | null | undefined): ImpactBatchStatus[] {
  if (!map) return [];
  return Object.entries(map)
    .map(([key, value]) => {
      const batchNo = Number(key.match(/(\d+)\s*$/)?.[1]);
      if (!Number.isFinite(batchNo)) return null;
      return {
        key,
        batchNo,
        files: value?.files ?? [],
        modifiedDate: value?.modifiedDate ?? "",
        ...batchSlotMeta(batchNo),
      };
    })
    .filter((b): b is ImpactBatchStatus => b !== null && !!b.modifiedDate)
    .sort((a, b) => a.batchNo - b.batchNo);
}

/** Parses the server's "yyyy-MM-dd HH:mm:ss" into a Date (null if unparseable). */
export function parseImpactModifiedDate(modifiedDate: string): Date | null {
  if (!modifiedDate) return null;
  const parsed = parse(modifiedDate, "yyyy-MM-dd HH:mm:ss", new Date());
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Display form of a batch's modifiedDate, e.g. "18-Aug-2026 12:00". */
export function formatImpactModifiedDate(modifiedDate: string, pattern = "dd-MMM-yyyy HH:mm"): string {
  const parsed = parseImpactModifiedDate(modifiedDate);
  return parsed ? format(parsed, pattern) : modifiedDate || "—";
}

/**
 * One row of GET /crqworkflow/impactanalysis/batch - with flag="Main" (default)
 * these are the top-level entity categories (B2B, IWAN, ...); passing one of
 * those categories back as `flag` drills into its sub-entity breakdown.
 */
export interface ImpactAnalysisEntity {
  entity: string;
  cnt: number;
}

/** POST /crqworkflow/impactanalysis-script response. */
export interface ImpactScriptResult {
  status: "SUCCESS" | "ERROR";
  message: string;
}

/**
 * Batch CSVs land on SFTP as {PREFIX}_{crqNo}_{batchNo}.csv, crqNo already
 * carrying its "CRQ..." prefix - see ImpactBatchFileController's filename
 * parsing. /excel/impact-batchwise silently skips any name that isn't
 * actually present, so it's safe to offer the full candidate set. Only used
 * as a fallback now: step 1 reports the real file names per batch.
 */
export const IMPACT_FILE_PREFIXES = ["IP", "BTP", "MSAN", "PACKET", "OTN"] as const;

export function buildImpactBatchFileNames(crqNo: string, batchNo: number): string[] {
  return IMPACT_FILE_PREFIXES.map((prefix) => `${prefix}_${crqNo}_${batchNo}.csv`);
}

/**
 * getImpactAnalysisSummaryQuery/runImpactAnalysisScriptMutation/
 * getImpactBatchStatusQuery (impactBatchApiSlice.ts) all define
 * transformErrorResponse, which extracts the backend's {status, message}
 * error body into a plain string and, via RTK Query's rejectWithValue,
 * *becomes* the error itself - not `error.data`. So the `error` these
 * hooks/`.unwrap()` surface is already the final message.
 */
export function errorMessage(error: unknown, fallback: string): string {
  return typeof error === "string" && error ? error : fallback;
}
