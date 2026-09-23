import React from "react";
import { Alert, AlertTitle, Box, Button, Typography } from "@mui/material";
import type { AlertColor } from "@mui/material";
import type {
  StageActionError,
  StageActionErrorCode,
} from "../../../types/stageWorkflow.types";

/**
 * The follow-up a given refusal actually deserves.
 *
 * - `retry`  - the blocker is external and temporary (an Ops task still to be
 *              closed, a CAB decision still to come). The form keeps what was
 *              typed, so once it clears the same submission goes through.
 * - `reset`  - this outcome can never succeed (CAB rejected it outright), so
 *              the only way forward is a different one.
 * - `refresh`- what's on screen is stale (the CRQ moved on, or is gone).
 *              Reload the listing rather than submitting again.
 */
type BlockedAction = "retry" | "reset" | "refresh";

interface CopyEntry {
  severity: AlertColor;
  title: string;
  actions: BlockedAction[];
}

const COPY: Record<StageActionErrorCode, CopyEntry> = {
  CRQ_NOT_FOUND: {
    severity: "error",
    title: "CRQ not found",
    actions: ["refresh"],
  },
  STAGE_MISMATCH: {
    severity: "warning",
    title: "Already actioned elsewhere",
    actions: ["refresh"],
  },
  OPS_DEPLOY_TASK_OPEN: {
    severity: "warning",
    title: "Deployment & Operation task still open",
    actions: ["retry", "reset"],
  },
  CAB_APPROVAL_PENDING: {
    severity: "warning",
    title: "CAB approval pending",
    actions: ["retry", "reset"],
  },
  CAB_APPROVAL_REJECTED: {
    severity: "error",
    title: "CAB approval rejected",
    actions: ["reset"],
  },
  INVALID_OUTCOME: {
    severity: "error",
    title: "Outcome not accepted",
    actions: ["reset"],
  },
  STAGE_ACTION_FAILED: {
    severity: "error",
    title: "Stage could not be updated",
    actions: ["retry"],
  },
};

const ACTION_LABEL: Record<BlockedAction, string> = {
  retry: "Try again",
  reset: "Change outcome",
  refresh: "Refresh",
};

interface StageActionBlockedAlertProps {
  error: StageActionError;
  /** Re-submit the form exactly as it stands. */
  onRetry: () => void;
  /** Clear the selected outcome so a different one can be picked. */
  onReset: () => void;
  /** Refetch this stage's data and close the dialog - the row is stale. */
  onRefresh: () => void;
  /** Disables every action while a submission is already in flight. */
  busy?: boolean;
}

/**
 * Renders a refused stage outcome inline, above the outcome selector.
 *
 * The stored procedure behind each stage's /done endpoint validates its own
 * preconditions and rolls back when one fails - nothing was written. That is
 * not a transient toast: it is a state the user has to resolve, so it stays
 * on screen with the reason, what to do about it, and the one or two actions
 * that can actually move it forward.
 */
export const StageActionBlockedAlert: React.FC<StageActionBlockedAlertProps> = ({
  error,
  onRetry,
  onReset,
  onRefresh,
  busy = false,
}) => {
  const copy = COPY[error.code] ?? COPY.STAGE_ACTION_FAILED;

  const handler: Record<BlockedAction, () => void> = {
    retry: onRetry,
    reset: onReset,
    refresh: onRefresh,
  };

  return (
    <Alert severity={copy.severity} sx={{ alignItems: "flex-start" }}>
      <AlertTitle sx={{ fontSize: 13, fontWeight: 700, mb: 0.25 }}>
        {copy.title}
      </AlertTitle>

      <Typography sx={{ fontSize: 12.5, lineHeight: 1.5 }}>
        {error.message}
      </Typography>

      {error.hint && (
        <Typography sx={{ fontSize: 12, mt: 0.75, opacity: 0.85 }}>
          {error.hint}
        </Typography>
      )}

      <Box sx={{ display: "flex", gap: 1, mt: 1.25, flexWrap: "wrap" }}>
        {copy.actions.map((action) => (
          <Button
            key={action}
            size="small"
            variant="outlined"
            color={copy.severity === "error" ? "error" : "warning"}
            disabled={busy}
            onClick={handler[action]}
            sx={{ textTransform: "none", fontSize: 12, py: 0.25 }}
          >
            {ACTION_LABEL[action]}
          </Button>
        ))}
      </Box>
    </Alert>
  );
};

export default StageActionBlockedAlert;
