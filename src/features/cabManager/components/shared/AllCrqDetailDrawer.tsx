import {
  Alert,
  Box,
  Button,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import ReplayIcon from "@mui/icons-material/Replay";
import ReportProblemOutlinedIcon from "@mui/icons-material/ReportProblemOutlined";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useGetCrqByIdQuery } from "../../api/cabManagerApiSlice";
import { ApproveCrqModal } from "../modals/ApproveCrqModal";
import { RejectCrqModal } from "../modals/RejectCrqModal";
import { RescheduleCrqModal } from "../modals/RescheduleCrqModal";
import { ConflictCrqModal } from "../modals/ConflictCrqModal";
import { CrqImpactAnalysisPanel } from "./CrqImpactAnalysisPanel";
import { StageChip, StatusChip } from "./Chips";
import { errMsg } from "./errMsg";

type Props = {
  serviceApprovalId: number | null;
  crqNo: string | null;
  onClose: () => void;
};

export function AllCrqDetailDrawer({
  serviceApprovalId,
  crqNo,
  onClose,
}: Props) {
  const open = !!serviceApprovalId;
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useGetCrqByIdQuery(
    serviceApprovalId ?? 0,
    {
      skip: !serviceApprovalId,
    }
  );

  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);

  // Impact analysis is collapsed by default and only mounted once expanded, so
  // opening the drawer for a CRQ nobody wants the impact for costs no calls.
  // The expansion is stored as *which* approval it belongs to rather than a
  // bare flag, so it collapses by itself on the next CRQ instead of carrying
  // one CRQ's open state (and its fetched batches) into another.
  const [impactOpenFor, setImpactOpenFor] = useState<number | null>(null);
  const impactOpen = impactOpenFor !== null && impactOpenFor === serviceApprovalId;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 480 } }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2.5,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={1.5}
        >
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {data && (
              <>
                <Typography
                  sx={{
                    fontFamily: "'Roboto Mono', monospace",
                    color: "primary.main",
                    fontWeight: 500,
                  }}
                >
                  {data.crqNo}
                </Typography>
                <StatusChip status={data.serviceApprovalStatus} />
              </>
            )}
          </Stack>

          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
        {isError && <Alert severity="error">{errMsg(error)}</Alert>}

        {isLoading && (
          <Stack spacing={1.5}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={48} />
            ))}
          </Stack>
        )}

        {data && (
          <>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<OpenInNewIcon />}
              onClick={() => {
                onClose();
                navigate(`/cabmanager/journey/${data.crqNo}`);
              }}
              sx={{ mb: 2.5 }}
            >
              View full CRQ journey
            </Button>

            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                mb: 1,
                display: "block",
              }}
            >
              Overview
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 2,
                mb: 3,
              }}
            >
              {[
                ["Domain", data.domainName],
                ["Circle", data.circleCode],
                ["Plan ID", data.planId],
                ["Stage", <StageChip key="stage" stage={data.currentStage} />],
                ["Service", data.serviceCode],
                ["Stage Status", data.stageStatus],
              ].map(([k, v]) => (
                <Box key={String(k)}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      display: "block",
                    }}
                  >
                    {k}
                  </Typography>

                  {typeof v === "string" ||
                  v === null ||
                  v === undefined ? (
                    <Typography variant="body2">{v || "—"}</Typography>
                  ) : (
                    v
                  )}
                </Box>
              ))}
            </Box>

            {/* Impact Analysis — same batch/summary/Excel flow as the
                scheduler's Impact Analysis review, laid out for the drawer. */}
            <Paper
              variant="outlined"
              sx={{ borderRadius: 2, overflow: "hidden", mb: 3 }}
            >
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                onClick={() =>
                  setImpactOpenFor(impactOpen ? null : serviceApprovalId)
                }
                sx={{
                  px: 1.75,
                  py: 1.25,
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <InsightsRoundedIcon
                  sx={{ fontSize: 17, color: "primary.main" }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    flex: 1,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    color: "text.secondary",
                  }}
                >
                  Impact Analysis Summary
                </Typography>
                <ExpandMoreRoundedIcon
                  sx={{
                    fontSize: 20,
                    color: "text.secondary",
                    transition: "transform 0.2s",
                    transform: impactOpen ? "rotate(180deg)" : "none",
                  }}
                />
              </Stack>

              <Collapse in={impactOpen} unmountOnExit>
                <Box
                  sx={{
                    px: 1.75,
                    pb: 1.75,
                    borderTop: "1px solid",
                    borderColor: "divider",
                    pt: 1.75,
                  }}
                >
                  <CrqImpactAnalysisPanel crqNo={data.crqNo} service={data.serviceCode} />
                </Box>
              </Collapse>
            </Paper>

            <Divider sx={{ mb: 2 }} />

            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                startIcon={<CheckCircleOutlineIcon />}
                onClick={() => setApproveOpen(true)}
              >
                Approve
              </Button>

              <Button
                fullWidth
                variant="outlined"
                color="error"
                startIcon={<CancelOutlinedIcon />}
                onClick={() => setRejectOpen(true)}
              >
                Reject
              </Button>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<ReplayIcon />}
                onClick={() => setScheduleOpen(true)}
              >
                Reschedule
              </Button>
            </Stack>

            <Button
              fullWidth
              variant="outlined"
              color="warning"
              startIcon={<ReportProblemOutlinedIcon />}
              onClick={() => setConflictOpen(true)}
              sx={{ mb: 1 }}
            >
              Conflict
            </Button>
          </>
        )}
      </Box>

      <ApproveCrqModal
        open={approveOpen}
        serviceApprovalId={serviceApprovalId}
        crqNo={crqNo}
        onClose={() => setApproveOpen(false)}
        onSuccess={() => {
          setApproveOpen(false);
          onClose();
        }}
      />

      <RejectCrqModal
        open={rejectOpen}
        serviceApprovalId={serviceApprovalId}
        crqNo={crqNo}
        onClose={() => setRejectOpen(false)}
        onSuccess={() => {
          setRejectOpen(false);
          onClose();
        }}
      />

      <RescheduleCrqModal
        open={scheduleOpen}
        serviceApprovalId={serviceApprovalId}
        crqNo={crqNo}
        onClose={() => setScheduleOpen(false)}
        onSuccess={() => {
          setScheduleOpen(false);
          onClose();
        }}
      />

      <ConflictCrqModal
        open={conflictOpen}
        crqNo={crqNo}
        onClose={() => setConflictOpen(false)}
        onSuccess={() => setConflictOpen(false)}
      />
    </Drawer>
  );
}
