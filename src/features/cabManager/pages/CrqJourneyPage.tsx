import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate, useParams } from "react-router";
import { useGetCrqJourneyQuery } from "../api/cabManagerApiSlice";
import { StageChip, StatusChip } from "../components/shared/Chips";
import { errMsg } from "../components/shared/errMsg";

const STATE_COLORS = {
  completed:   { bg: "#E8F5E9", fg: "#2E7D32", border: "#2E7D32", icon: "✓", time: "Completed" },
  in_progress: { bg: "#FFF4E5", fg: "#ED6C02", border: "#ED6C02", icon: "•", time: "Awaiting"  },
  pending:     { bg: "#FFF",    fg: "rgba(0,0,0,0.4)", border: "rgba(0,0,0,0.15)", icon: "·", time: "Pending"   },
  rejected:    { bg: "#FDECEA", fg: "#D32F2F", border: "#D32F2F", icon: "×", time: "Rejected"  },
  not_started: { bg: "#FFF",    fg: "rgba(0,0,0,0.4)", border: "rgba(0,0,0,0.15)", icon: "·", time: "—"          },
};

const TRACK_STATUS_COLORS = {
  approved:  { fg: "#2E7D32", bg: "#E8F5E9", label: "Approved" },
  reviewing: { fg: "#ED6C02", bg: "#FFF4E5", label: "Reviewing" },
  pending:   { fg: "rgba(0,0,0,0.55)", bg: "#F1F3F4", label: "Pending" },
  queued:    { fg: "rgba(0,0,0,0.45)", bg: "#F4F5F7", label: "Not triggered" },
  rejected:  { fg: "#D32F2F", bg: "#FDECEA", label: "Rejected" },
};

export function CrqJourneyPage() {
  const navigate = useNavigate();
  const { id = "" } = useParams<{ id: string }>();
  const { data, isLoading, isError, error, refetch } = useGetCrqJourneyQuery(id, { skip: !id });

  if (isError) {
    return <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => void refetch()}>Retry</Button>}>{errMsg(error)}</Alert>;
  }
  if (isLoading || !data) {
    return <Stack spacing={2}><Skeleton variant="rounded" height={120} /><Skeleton variant="rounded" height={420} /></Stack>;
  }

  const { crq, approvalChain, parallelTracks, remarks } = data;
  const slaColor = crq.slaPercentage >= 80 ? "#D32F2F" : crq.slaPercentage >= 50 ? "#ED6C02" : "#2E7D32";

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Back to list
      </Button>

      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={3} sx={{ mb: 3 }}>
        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <Typography sx={{ fontFamily: "'Roboto Mono', monospace", color: "primary.main", fontWeight: 500 }}>{crq.crqNo}</Typography>
            <StatusChip status={crq.serviceApprovalStatus} />
            <StageChip stage={crq.currentStage} />
          </Stack>
          <Typography variant="h5" sx={{ fontWeight: 500, letterSpacing: "-0.3px" }}>{crq.domainName} · Circle {crq.circleCode}</Typography>
          <Typography variant="body2" sx={{ color: "text.secondary", mt: 1 }}>
            Raised by <Box component="span" sx={{ color: "text.primary" }}>{crq.raisedBy}</Box>
          </Typography>
        </Box>
      </Stack>

      {/* Approval chain timeline */}
      <Paper sx={{ p: 3, mb: 2, border: "1px solid", borderColor: "divider" }} elevation={0}>
        <Typography sx={{ fontWeight: 500, mb: 0.5 }}>CRQ Process Flow</Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Workflow and approvals advance in parallel — both tracks are active at the current stage.
        </Typography>

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3, mb: 2 }}>
          {approvalChain.map((step, i) => {
            const c = STATE_COLORS[step.state];
            return (
              <Box key={step.label} sx={{ flex: 1, textAlign: "center", position: "relative" }}>
                {i < approvalChain.length - 1 && (
                  <Box sx={{ position: "absolute", top: 20, left: "60%", right: "-40%", height: 2, bgcolor: "rgba(0,0,0,0.08)" }} />
                )}
                <Box sx={{
                  width: 40, height: 40, mx: "auto", borderRadius: "50%",
                  bgcolor: c.bg, color: c.fg, border: `2px solid ${c.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 600, fontSize: 14, position: "relative", zIndex: 1,
                }}>
                  {c.icon === "✓" ? <CheckIcon fontSize="small" /> : c.icon === "×" ? <CloseIcon fontSize="small" /> : (i + 1)}
                </Box>
                <Typography variant="caption" sx={{ display: "block", mt: 1, fontWeight: 500 }}>{step.label}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>{step.who}</Typography>
                <Typography variant="caption" sx={{ color: c.fg, fontWeight: 500 }}>{c.time}</Typography>
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Parallel tracks */}
      <Paper sx={{ p: 3, mb: 2, border: "1px solid", borderColor: "divider" }} elevation={0}>
        <Typography sx={{ fontWeight: 500, mb: 2 }}>Parallel approval tracks · {crq.currentStage}</Typography>
        <Stack spacing={1.5}>
          {parallelTracks.map((t) => {
            const tc = TRACK_STATUS_COLORS[t.status];
            return (
              <Box key={t.track} sx={{ display: "flex", alignItems: "center", gap: 2, p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}>
                <Box sx={{ width: 4, alignSelf: "stretch", bgcolor: t.color, borderRadius: 1 }} />
                <Box sx={{ minWidth: 220 }}>
                  <Typography sx={{ fontWeight: 500 }}>{t.track}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>{t.role}</Typography>
                </Box>
                <Typography variant="body2" sx={{ flex: 1 }}>{t.approver}</Typography>
                <Chip size="small" label={tc.label} sx={{ bgcolor: tc.bg, color: tc.fg, fontWeight: 500 }} />
              </Box>
            );
          })}
        </Stack>
      </Paper>

      {/* Two-column: details/remarks + SLA/gate */}
      <Box sx={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 2 }}>
        <Stack spacing={2}>
          <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }} elevation={0}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
              <Typography sx={{ fontWeight: 500 }}>CRQ Details</Typography>
              <Chip size="small" label="Read-only" sx={{ bgcolor: "#F4F5F7", color: "text.secondary", fontSize: 11 }} />
            </Box>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
              {[
                ["Domain", crq.domainName],
                ["Circle", crq.circleCode],
                ["Plan ID", crq.planId],
                ["Approver", crq.approverName],
                ["Scheduled", crq.assignStartTime],
                ["Raised By", crq.raisedBy],
              ].map(([k, v]) => (
                <Box key={k}>
                  <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>{k}</Typography>
                  <Typography variant="body2">{v}</Typography>
                </Box>
              ))}
            </Box>
          </Paper>

          <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }} elevation={0}>
            <Typography sx={{ fontWeight: 500, mb: 2 }}>Remarks</Typography>
            <Stack spacing={1.5}>
              {remarks.map((r, i) => (
                <Stack direction="row" spacing={1.5} key={i}>
                  <Avatar sx={{ width: 32, height: 32, bgcolor: "primary.main", fontSize: 12 }}>{r.who.split(" ").map((w) => w[0]).join("").slice(0, 2)}</Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>{r.who} <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>· {r.role}</Box></Typography>
                      <Typography variant="caption" sx={{ color: "text.secondary" }}>{r.time}</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: "primary.main" }}>{r.stage}</Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>{r.comment}</Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </Paper>
        </Stack>

        <Stack spacing={2}>
          <Paper sx={{ p: 2.5, border: "1px solid", borderColor: "divider" }} elevation={0}>
            <Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: 0.5, textTransform: "uppercase" }}>Current SLA · {crq.currentStage}</Typography>
            <Typography sx={{ fontSize: 30, fontWeight: 400, color: slaColor, fontFamily: "'Roboto Mono', monospace", letterSpacing: -1 }}>{crq.slaPercentage}%</Typography>
            <LinearProgress variant="determinate" value={crq.slaPercentage} sx={{ height: 8, borderRadius: 1, my: 1, bgcolor: "rgba(0,0,0,0.06)", "& .MuiLinearProgress-bar": { bgcolor: slaColor } }} />
            <Typography variant="caption" sx={{ color: slaColor }}>
              {crq.slaPercentage >= 80 ? "Critical — escalation may be triggered" : crq.slaPercentage >= 50 ? "On watch" : "Healthy"}
            </Typography>
          </Paper>

          <Paper sx={{ p: 3, border: "1px solid", borderColor: "divider" }} elevation={0}>
            <Typography sx={{ fontWeight: 500, mb: 2 }}>Approval Gate</Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box sx={{
                width: 66, height: 66, borderRadius: "50%",
                background: `conic-gradient(${slaColor} ${(parallelTracks.filter((t) => t.status === "approved").length / parallelTracks.length) * 100}%, rgba(0,0,0,0.08) 0)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Box sx={{ width: 50, height: 50, borderRadius: "50%", bgcolor: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, color: slaColor }}>
                  {parallelTracks.filter((t) => t.status === "approved").length}/{parallelTracks.length}
                </Box>
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 500, color: slaColor }}>{crq.currentStage}</Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Stage clears only when every parallel track approves.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
}
