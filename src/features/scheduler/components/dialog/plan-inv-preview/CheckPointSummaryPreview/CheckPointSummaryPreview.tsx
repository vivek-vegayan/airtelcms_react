import { useState } from "react";
import { Box, alpha, Typography, Stack, Button, Alert, Collapse, CircularProgress, Tooltip } from "@mui/material";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";

import {
  useGetCheckpointsByCrqNoQuery,
  useUpdateCheckpointStatusMutation,
  useRefetchCheckpointScriptMutation,
} from "../../../../api/checkpointApiSlice";
import type { Checkpoint } from "../../../../types/checkpoint.types";
import HorizontalCheckpointStrip from "./HorizontalCheckpointStrip";

const EmptyState: React.FC<{ crqNo?: string | null; crqStatus?: string | null }> = ({
  crqNo,
  crqStatus,
}) => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 220,
      border: "1.5px dashed",
      borderColor: "divider",
      borderRadius: 3,
      p: 4,
      gap: 1.5,
      bgcolor: "background.paper",
    }}
  >
    <Box
      sx={{
        width: 52,
        height: 52,
        borderRadius: "50%",
        bgcolor: (t) => alpha(t.palette.text.disabled, 0.08),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AssignmentTurnedInOutlinedIcon sx={{ fontSize: 26, color: "text.disabled" }} />
    </Box>
    <Typography variant="subtitle2" fontWeight={600} color="text.primary">
      CheckPoint Summary Preview
    </Typography>
    <Stack direction="row" spacing={1} alignItems="center">
      <Typography variant="body2" color="text.secondary">
        CRQ:{" "}
        <Box component="strong" sx={{ color: "text.primary", fontFamily: "monospace" }}>
          {crqNo || "N/A"}
        </Box>
      </Typography>
      <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: "text.disabled" }} />
      <Typography variant="body2" color="text.secondary">
        Status:{" "}
        <Box component="strong" sx={{ color: "text.primary" }}>
          {crqStatus || "N/A"}
        </Box>
      </Typography>
    </Stack>
  </Box>
);

export const CheckPointSummaryPreview: React.FC<{
  crqNo?: string | null;
  crqStatus?: string | null;
  /** The stage this preview belongs to is closed (cancelled or already
   * reviewed). Covers every write on this panel - the checkpoint Pass/Fail
   * toggles and "Data Refresh", which re-runs the validation script over SSH
   * and rewrites the CRQ's JSON on SFTP. */
  disableActions?: boolean;
}> = ({ crqNo, crqStatus, disableActions = false }) => {
  const { data, isLoading, isFetching, isError } = useGetCheckpointsByCrqNoQuery(
    crqNo ?? "",
    { skip: !crqNo },
  );
  const [updateCheckpoint] = useUpdateCheckpointStatusMutation();
  const [refetchScript, { isLoading: isRefreshingScript }] = useRefetchCheckpointScriptMutation();
  const [refreshStatus, setRefreshStatus] = useState<{ ok: boolean; message: string } | null>(null);

  if (!crqNo) {
    return <EmptyState crqNo={crqNo} crqStatus={crqStatus} />;
  }

  const handleCheckpointStatusChange = async (checkpointId: string, newStatus: "Pass" | "Fail") => {
    try {
      await updateCheckpoint({ crqNo, checkpointId, value: newStatus }).unwrap();
    } catch (err: any) {
      // Errors surface via the alert below on the next render (isError from
      // the failed refetch triggered by cache invalidation is not guaranteed
      // here since the mutation itself failed) - nothing further to do.
      console.error("Error updating checkpoint status:", err);
    }
  };

  // Re-runs the validation script over SSH (regenerates CRQ_<crqNo>_output.json
  // on SFTP), then re-reads it via the GET's tag invalidation. The endpoint
  // always responds 200 - a failed script run comes back as plain text
  // ("Error: ..." / "Failed to run script: ...") rather than an HTTP error.
  const handleDataRefresh = async () => {
    setRefreshStatus(null);
    try {
      const result = await refetchScript(crqNo).unwrap();
      const failed = result.startsWith("Error:") || result.startsWith("Failed to run script:");
      setRefreshStatus({ ok: !failed, message: failed ? result : "Checkpoint data refreshed." });
    } catch {
      setRefreshStatus({ ok: false, message: "Failed to refresh checkpoint data." });
    }
  };

  const busy = isRefreshingScript || isFetching;
  const isFailed = data?.status === "FAILED";
  const checkpoints: Checkpoint[] = data?.Checkpoints ?? [];

  return (
    <Box>
      {/* Available whenever the stage is still open - it is exactly the
          action needed when the file below isn't found yet. A closed stage
          keeps it visible but inert: it re-runs the validation script and
          rewrites the CRQ's JSON on SFTP, which a cancelled or already
          reviewed CRQ has no business doing. The span carries the tooltip,
          since a disabled button receives no pointer events of its own. */}
      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1.25 }}>
        <Tooltip
          title={
            disableActions
              ? "This CRQ's stage is closed — the checkpoint validation script can no longer be run for it."
              : ""
          }
          arrow
        >
          <span>
            <Button
              size="small"
              variant="outlined"
              color="inherit"
              startIcon={<RefreshRoundedIcon sx={{ fontSize: 15 }} />}
              disabled={busy || disableActions}
              onClick={handleDataRefresh}
              sx={{ fontSize: 12, textTransform: "none", borderRadius: 1.5 }}
            >
              {busy ? "Refreshing…" : "Data Refresh"}
            </Button>
          </span>
        </Tooltip>
      </Stack>

      <Collapse in={Boolean(refreshStatus)} unmountOnExit>
        <Alert
          severity={refreshStatus?.ok ? "success" : "error"}
          sx={{ borderRadius: 1.5, mb: 1.25, fontSize: 12.5, py: 0.5 }}
          onClose={() => setRefreshStatus(null)}
        >
          {refreshStatus?.message}
        </Alert>
      </Collapse>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={26} />
        </Box>
      ) : isFailed ? (
        // Backend returns a 200 with { status: "FAILED", error, timestamp }
        // when the CRQ's validation JSON isn't found on SFTP - not an HTTP error.
        <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            CRQ Not Found
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {data?.error ?? "Unable to load checkpoints."}
          </Typography>
          {data?.timestamp && (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
              Timestamp: {data.timestamp}
            </Typography>
          )}
        </Alert>
      ) : isError || !data ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Failed to load checkpoints. Please try again.
        </Alert>
      ) : (
        <HorizontalCheckpointStrip
          checkpoints={checkpoints}
          onStatusChange={handleCheckpointStatusChange}
          disableActions={disableActions}
        />
      )}
    </Box>
  );
};

export default CheckPointSummaryPreview;
