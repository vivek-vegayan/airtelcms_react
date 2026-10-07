/**
 * Wire shape of GET /crqworkflow/fetch/by-crq/{crqNo}?stage= (one row of
 * V_CRQ_FETCH_JOB via CrqFetchProgressService). The fetch daemon starts jobs
 * on its own; a 204 (no job yet) arrives here as `null`.
 */

export type FetchStage = "VALIDATE" | "IMPACT_ANALYSIS";

export type FetchJobStatus =
  | "QUEUED"
  | "RUNNING"
  | "SUCCESS"
  | "PARTIAL"
  | "FAILED"
  | "CANCELLED"
  | "NOT_INGESTED"
  | string;

export interface FetchProgress {
  jobId: number;
  crqNo: string;
  planId?: string | null;
  stage: FetchStage;
  runType?: string | null;
  batchNo?: number | null;
  stageLabel?: string | null;
  status: FetchJobStatus;
  totalUnits: number;
  doneUnits: number;
  failedUnits: number;
  percent?: number | null;
  currentItem?: string | null;
  elapsedSec?: number | null;
  heartbeatAgeSec?: number | null;
  etaSec?: number | null;
  finished: boolean;
  /** Running, but no heartbeat for over a minute. */
  stalled: boolean;
  errorText?: string | null;
}
