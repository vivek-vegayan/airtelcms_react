import {
  Alert,
  Box,
  Chip,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import { useGetImplementationQuery } from "../api/cabManagerApiSlice";
import { errMsg } from "../components/shared/errMsg";
import type { SeRing } from "../types/types";

/**
 * Field Execution — a read-only view.
 *
 * Every control has been removed: no "Call NOC-NS", no per-ring
 * Proceed / Do Not Proceed, no blocker comment box, no Save / Start Execution.
 * The page reports what the backend holds and nothing on it mutates state, so
 * the ring decisions and the NOC contact flag are rendered straight from
 * GET /cab/implementation rather than from local component state.
 */

/**
 * Read-only presentation of a ring's recorded decision. "pending" has no entry
 * on purpose - an unvalidated ring shows no chip at all rather than a
 * "Not validated" label.
 */
const DECISION_CHIP: Partial<
  Record<SeRing["decision"], { label: string; color: "success" | "error" }>
> = {
  proceed: { label: "Proceed", color: "success" },
  block: { label: "Do Not Proceed", color: "error" },
};

export function ImplementationPage() {
  const { data, isLoading, isError, error } = useGetImplementationQuery();

  if (isError) return <Alert severity="error">{errMsg(error)}</Alert>;
  if (isLoading || !data)
    return (
      <Stack spacing={2}>
        <Skeleton variant="rounded" height={120} />
        <Skeleton variant="rounded" height={400} />
      </Stack>
    );

  const { crq, noc, rings } = data;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 500, letterSpacing: "-0.3px" }}>Field Execution — {crq.crqNo}</Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          {crq.domainName} · Circle {crq.circleCode}. Readiness recorded with NOC-NS before execution.
        </Typography>
      </Box>

      {/* Two-col: CRQ details + NOC contact */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 2, mb: 2 }}>
        <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }} elevation={0}>
          <Typography sx={{ fontWeight: 500, mb: 2 }}>CRQ Details</Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
            {[
              ["Support Group",   "NOC-NS Optics West"],
              ["Type of CR",      "Normal · Planned"],
              ["Approver",        crq.approverName],
              ["Scheduled Start", crq.assignStartTime],
              ["Status",          crq.serviceApprovalStatus],
              ["Raised By",       crq.raisedBy],
            ].map(([k, v]) => (
              <Box key={k}>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>{k}</Typography>
                <Typography variant="body2">{v}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>

        <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }} elevation={0}>
          <Typography sx={{ fontWeight: 500, mb: 2 }}>NOC-NS Contact</Typography>
          <Stack spacing={1.5} sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 38, height: 38, borderRadius: 1, bgcolor: "#E3F2FD", color: "#1565C0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PhoneInTalkIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>Toll-Free</Typography>
                <Typography sx={{ fontFamily: "'Roboto Mono', monospace" }}>{noc.tollFree}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 38, height: 38, borderRadius: 1, bgcolor: "#F3E5F5", color: "#7B1FA2", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <EmailOutlinedIcon fontSize="small" />
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>Email</Typography>
                <Typography sx={{ color: "primary.main" }}>{noc.email}</Typography>
              </Box>
            </Stack>
          </Stack>
          {/* Reported, not triggered - the flag comes from the backend row.
              Shown only once contact has happened; "not contacted" renders
              nothing rather than a negative label. */}
          {noc.called && (
            <Chip size="small" variant="outlined" color="success" label="NOC-NS contacted" />
          )}
        </Paper>
      </Box>

      {/* Ring validation */}
      <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider", mb: 2 }} elevation={0}>
        <Typography sx={{ fontWeight: 500, mb: 2 }}>Impact Validation</Typography>
        <Stack spacing={1.5}>
          {rings.map((r) => (
            <Paper key={r.id} sx={{ p: 2, border: "1px solid", borderColor: "divider" }} elevation={0}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 500 }}>{r.ring}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", fontFamily: "'Roboto Mono', monospace" }}>
                    {r.locA} → {r.locB} · {r.type} · {r.slotStart}–{r.slotEnd}
                  </Typography>
                </Box>
                {DECISION_CHIP[r.decision] && (
                  <Chip
                    size="small"
                    color={DECISION_CHIP[r.decision]!.color}
                    label={DECISION_CHIP[r.decision]!.label}
                  />
                )}
              </Stack>
            </Paper>
          ))}
        </Stack>
      </Paper>

      <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider" }} elevation={0}>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {rings.every((r) => r.decision === "proceed")
            ? "All rings cleared. Ready to start execution."
            : "Not every ring has been validated yet."}
        </Typography>
      </Paper>
    </Box>
  );
}
