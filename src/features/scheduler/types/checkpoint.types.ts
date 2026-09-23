/**
 * Wire shapes of /crqworkflow/json/raw/{crqNo} (CrqWorkflowController ->
 * CrqWorkflowService.fetchJsonFile / updateJsonFile), which reads and
 * rewrites the CRQ's validation JSON (`CRQ_<crqNo>_output.json`) straight off
 * the SFTP path configured via SFTP_JSON_RAW_FILE_PATH.
 *
 * The JSON's per-checkpoint item payload is produced by an external
 * validation script and varies by node/checkpoint type, so CheckpointItem
 * only pins down the fields every item is known to carry; everything else is
 * rendered dynamically off whatever keys are actually present.
 */

export interface CheckpointItem {
  node: string;
  interface: string;
  status?: string;
  [key: string]: unknown;
}

export interface Checkpoint {
  id: string;
  title: string;
  status?: "Pass" | "Fail" | string;
  items: CheckpointItem[];
}

/**
 * GET response shape. On success `Checkpoints` is populated; when the SFTP
 * file isn't found the backend instead returns `status: "FAILED"` with
 * `error`/`timestamp`/`CRQ_No` (buildErrorJson).
 */
export interface CheckpointsApiResponse {
  Checkpoints?: Checkpoint[];
  status?: string;
  error?: string;
  timestamp?: string;
  CRQ_No?: string;
}
