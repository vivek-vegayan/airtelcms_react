import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import { toast } from "react-toastify";
import {
  useGetCrqConflictsQuery,
  useSubmitCrqConflictDecisionMutation,
} from "../../api/cabManagerApiSlice";
import type { CrqConflictFlag } from "../../types/types";
import { errMsg } from "../shared/errMsg";

type ConflictCrqModalProps = {
  open: boolean;
  crqNo: string | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function ConflictCrqModal({
  open,
  crqNo,
  onClose,
  onSuccess,
}: ConflictCrqModalProps) {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = useGetCrqConflictsQuery(crqNo ?? "", { skip: !open || !crqNo });

  const [submitDecision, { isLoading: isSubmitting }] =
    useSubmitCrqConflictDecisionMutation();

  const rows = data ?? [];
  const showSkeleton = isLoading || isFetching;

  const decide = async (flag: CrqConflictFlag) => {
    if (!crqNo) return;
    try {
      const result = await submitDecision({ crqNo, flag }).unwrap();
      if (result.status === "Success") {
        toast.success(result.message);
        onSuccess ? onSuccess() : onClose();
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to record conflict decision.");
    }
  };

  return (
    <Dialog open={open && !!crqNo} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: "#FFF4E5",
              color: "#ED6C02",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ReportProblemOutlinedIcon />
          </Box>
          Conflict Check
        </Box>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Other CRQs touching the same network element(s) on the same
          execution date as{" "}
          <Box
            component="span"
            sx={{
              fontFamily: "'Roboto Mono', monospace",
              color: "primary.main",
              fontWeight: 500,
            }}
          >
            {crqNo}
          </Box>
          . Review the conflicts below, then confirm whether to proceed.
        </Typography>

        {isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errMsg(error)}
          </Alert>
        )}

        {showSkeleton && (
          <Stack spacing={1} sx={{ mb: 2 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} variant="rounded" height={40} />
            ))}
          </Stack>
        )}

        {!showSkeleton && !isError && rows.length === 0 && (
          <Alert severity="success" sx={{ mb: 2 }}>
            No conflicting CRQs found for this change request.
          </Alert>
        )}

        {!showSkeleton && rows.length > 0 && (
          <TableContainer
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1 }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Conflicting CRQ</TableCell>
                  <TableCell>NE Label</TableCell>
                  <TableCell>Execution Date</TableCell>
                  <TableCell>Stage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Activity</TableCell>
                  <TableCell>Window</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r, i) => (
                  <TableRow key={`${r.conflictingCrqNo}-${r.taskId}-${i}`} hover>
                    <TableCell
                      sx={{
                        fontFamily: "'Roboto Mono', monospace",
                        color: "primary.main",
                        fontWeight: 500,
                      }}
                    >
                      {r.conflictingCrqNo}
                    </TableCell>
                    <TableCell>{r.neLabel}</TableCell>
                    <TableCell>{r.executionDate}</TableCell>
                    <TableCell>
                      <Chip label={r.currentStage} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={r.currentStatus}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{r.planActivityDetails || "—"}</TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {r.activityPlanStartDate} → {r.activityPlanEndDate}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button
          variant="outlined"
          color="error"
          onClick={() => decide("NO")}
          disabled={isSubmitting || !crqNo}
        >
          {isSubmitting ? "Submitting..." : "No"}
        </Button>

        <Button
          variant="contained"
          color="success"
          onClick={() => decide("YES")}
          disabled={isSubmitting || !crqNo}
        >
          {isSubmitting ? "Submitting..." : "Yes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
