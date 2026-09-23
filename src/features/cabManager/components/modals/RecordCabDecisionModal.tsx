import {
  Alert,
  Box,
  Button,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useRecordCabSessionCrqDecisionMutation } from "../../api/cabManagerApiSlice";
import type { CabAgendaRow, CabSessionCrqAction } from "../../types/types";

const ACTIONS: { value: CabSessionCrqAction; label: string; help: string }[] = [
  { value: "APPROVE",    label: "Approve",    help: "Circle presented and the change is cleared to go ahead." },
  { value: "REJECT",     label: "Reject",     help: "The change is not to be executed." },
  { value: "RESCHEDULE", label: "Reschedule", help: "Move the change out of this session to a later window." },
];

/**
 * Records the CAB's decision on one CRQ tabled at a session.
 *
 * The reason is mandatory for REJECT and RESCHEDULE — a change turned away with
 * no stated ground cannot be answered by the circle that raised it — and the
 * backend enforces the same rule, so a stale form cannot slip past it.
 */
export function RecordCabDecisionModal({
  open,
  sessionId,
  row,
  onClose,
}: {
  open: boolean;
  sessionId: string;
  row: CabAgendaRow | null;
  onClose: () => void;
}) {
  const [action, setAction] = useState<CabSessionCrqAction | null>(null);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");

  // The board keeps this dialog mounted, so its fields survive a save. Clearing
  // as it opens covers every way it was dismissed: saved, Cancel or backdrop.
  useEffect(() => {
    if (open) {
      setAction(null);
      setReason("");
      setComment("");
    }
  }, [open]);

  const [record, { isLoading }] = useRecordCabSessionCrqDecisionMutation();

  const reasonRequired = action === "REJECT" || action === "RESCHEDULE";
  const reasonMissing = reasonRequired && !reason.trim();

  const submit = async () => {
    if (!row || !action || reasonMissing) return;
    try {
      const result = await record({
        sessionId,
        mappingId: row.mappingId,
        action,
        reason: reason.trim() || undefined,
        comment: comment.trim() || undefined,
      }).unwrap();
      toast.success(`${result.crqNo} · ${result.previousStatus} → ${result.newStatus}`);
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to record the CAB decision.");
    }
  };

  const selected = ACTIONS.find((a) => a.value === action);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Record CAB decision</DialogTitle>
      <DialogContent>
        {row && (
          <Stack direction="row" spacing={1.5} alignItems="baseline" sx={{ mb: 2, flexWrap: "wrap" }}>
            <Typography sx={{ fontFamily: "'Roboto Mono', monospace", color: "primary.main", fontWeight: 500 }}>
              {row.crqNo}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              {row.circle ?? "Circle not set"} · {row.changeImpact ?? "Impact not set"} ·{" "}
              {row.nodeName ?? "Node not set"}
            </Typography>
          </Stack>
        )}

        {row && row.cabDecision?.toUpperCase() !== "PENDING" && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This CRQ already carries the decision <b>{row.cabDecision}</b>. Recording another
            replaces it on the minutes.
          </Alert>
        )}

        <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 0.75 }}>
          Decision
        </Typography>
        <ToggleButtonGroup
          exclusive
          fullWidth
          size="small"
          value={action}
          onChange={(_e, v: CabSessionCrqAction | null) => setAction(v)}
          sx={{ mb: 0.5 }}
        >
          {ACTIONS.map((a) => (
            <ToggleButton key={a.value} value={a.value} sx={{ textTransform: "none", fontWeight: 500 }}>
              {a.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Box sx={{ minHeight: 20, mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {selected?.help ?? "Pick what the CAB decided on this change."}
          </Typography>
        </Box>

        <TextField
          fullWidth
          multiline
          minRows={2}
          label={reasonRequired ? "Reason" : "Reason (optional)"}
          placeholder="Why the CAB decided this — the circle sees it against the CRQ"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          error={reasonMissing}
          helperText={reasonMissing ? `A reason is required to ${action?.toLowerCase()} a CRQ.` : " "}
          sx={{ mb: 1.5 }}
        />

        <TextField
          fullWidth
          multiline
          minRows={2}
          label="CAB comment (optional)"
          placeholder="Rollback plan, dependency, who confirmed, what the circle must close"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={isLoading || !action || reasonMissing}
        >
          {isLoading ? "Saving..." : "Record decision"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
