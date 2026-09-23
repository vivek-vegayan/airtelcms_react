import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import AssignmentTurnedInOutlinedIcon from "@mui/icons-material/AssignmentTurnedInOutlined";
import FactCheckOutlinedIcon from "@mui/icons-material/FactCheckOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { toast } from "react-toastify";
import { MopVersionStrip, formatStamp } from "./MopVersionStrip";
import {
  useGetMopValidateDetailsQuery,
  useStartMopReviewMutation,
} from "../../../../api/mopValidateApiSlice";
import { MopReviewWorkspaceDialog } from "./MopReviewWorkspaceDialog";

interface MopValidatePanelProps {
  crqNo: string | null;
  /** Cancelled / already-Done / view-only - the panel stays readable, but the
   *  review cannot be opened from it. */
  readOnly: boolean;
  colors: any;
}

/**
 * Right-hand pane of the MOP Validate stage dialog, sitting beside the
 * "MOP Validate Action" outcome form.
 *
 * Shows the CRQ's current MOP version - located by `SP_GET_MOP_CURRENT_VERSION`
 * - and the review standing against it, with a single action: open the review
 * via `sp_mop_review_start`.
 *
 * That procedure is not re-entrant. It INSERTs into `mop_review`
 * unconditionally, and the table has no unique key on (version_id,
 * reviewer_id), so calling it twice leaves two open reviews on one version with
 * no error. It is therefore never fired on mount - only from the button below,
 * and the backend refuses a second open on top of that.
 *
 * Sized to its container rather than its content, like MOP Create's panel: a
 * fixed-height strip, then a body that takes the rest. Nothing here measures
 * its own height, so it cannot feed the app shell's scrollbar oscillation (see
 * `useAutoFitScale`'s notes).
 */
export const MopValidatePanel: React.FC<MopValidatePanelProps> = ({ crqNo, readOnly, colors }) => {
  const { data, isLoading, isError } = useGetMopValidateDetailsQuery(crqNo as string, {
    skip: !crqNo,
  });

  const [startReview, { isLoading: isStarting }] = useStartMopReviewMutation();
  const [actionError, setActionError] = useState<string | null>(null);

  // The full validation workspace - the document, findings, history and the
  // two decisions - is a fullscreen dialog rather than more of this pane: the
  // design pairs a document viewer with a 420px rail, which cannot breathe
  // inside what is already the right half of the stage dialog.
  const [workspaceOpen, setWorkspaceOpen] = useState(false);

  const handleStart = async () => {
    if (!crqNo) return;
    setActionError(null);
    try {
      await startReview(crqNo).unwrap();
      toast.success(`Review opened for ${crqNo}.`);
    } catch (e: any) {
      // The backend turns the procedure's refusals and its own guards into a
      // 400 carrying the reason ("already under review by ..."), which is
      // worth showing in place rather than as a generic failure.
      setActionError(e?.data?.message ?? "The review could not be started.");
    }
  };

  if (!crqNo) {
    return (
      <Alert severity="info" sx={{ fontSize: 13, m: 2 }}>
        Select a CRQ to see its MOP version.
      </Alert>
    );
  }

  const hasVersion = Boolean(data?.versionId);
  const canStart = hasVersion && !data?.reviewOpen && !readOnly;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        height: "100%",
        minHeight: 0,
        p: 2,
        // Capped so a handful of short values don't stretch across a 1600px
        // monitor; it still fills anything narrower.
        maxWidth: 1100,
      }}
    >
      {isError ? (
        <Alert severity="warning" sx={{ fontSize: 12.5, flexShrink: 0 }}>
          The MOP version for {crqNo} could not be loaded.
        </Alert>
      ) : (
        <MopVersionStrip details={data} loading={isLoading} colors={colors} />
      )}

      {actionError && (
        <Alert
          severity="error"
          sx={{ fontSize: 12.5, py: 0.25, flexShrink: 0 }}
          onClose={() => setActionError(null)}
        >
          {actionError}
        </Alert>
      )}

      {/* Fill-height body. Exactly one of these is mounted, so the panel is
          always the same height and never scrolls. */}
      {isLoading || isError ? (
        <Box sx={{ flex: 1, minHeight: 132 }} />
      ) : !data?.mopExists ? (
        <EmptyState
          colors={colors}
          icon={<DescriptionOutlinedIcon sx={{ fontSize: 30, color: colors.textDim }} />}
          title="No MOP to validate"
          body={`MOP Create has not run for ${crqNo} yet. Once the MOP is created, its first version appears here for review.`}
        />
      ) : !hasVersion ? (
        <EmptyState
          colors={colors}
          icon={<DescriptionOutlinedIcon sx={{ fontSize: 30, color: colors.textDim }} />}
          title="No version to review"
          body="This MOP exists but carries no version yet, so there is nothing to open a review against."
        />
      ) : (
        <ReviewBody
          data={data}
          colors={colors}
          canStart={canStart}
          readOnly={readOnly}
          isStarting={isStarting}
          onStart={handleStart}
          onOpenWorkspace={() => setWorkspaceOpen(true)}
        />
      )}

      {/* Mounted only while open so its workspace query - which pulls the
          version history, findings and audit trail - never runs for a CRQ
          nobody has opened. */}
      {workspaceOpen && (
        <MopReviewWorkspaceDialog
          crqNo={crqNo}
          open={workspaceOpen}
          onClose={() => setWorkspaceOpen(false)}
        />
      )}
    </Box>
  );
};

/** Shared shape for the two "nothing here" bodies, so both fill the panel. */
const EmptyState: React.FC<{
  colors: any;
  icon: React.ReactNode;
  title: string;
  body: string;
}> = ({ colors, icon, title, body }) => (
  <Stack
    spacing={1.25}
    sx={{
      flex: 1,
      minHeight: 132,
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      border: `1px solid ${colors.border}`,
      borderRadius: 2,
      bgcolor: colors.surface,
      p: 3,
    }}
  >
    {icon}
    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary }}>
      {title}
    </Typography>
    <Typography sx={{ fontSize: 12, color: colors.textDim, maxWidth: 380 }}>{body}</Typography>
  </Stack>
);

/**
 * The review half: who has this version open and since when, or the control to
 * open it, plus the version's own note and any recorded decision.
 */
const ReviewBody: React.FC<{
  data: NonNullable<ReturnType<typeof useGetMopValidateDetailsQuery>["data"]>;
  colors: any;
  canStart: boolean;
  readOnly: boolean;
  isStarting: boolean;
  onStart: () => void;
  onOpenWorkspace: () => void;
}> = ({ data, colors, canStart, readOnly, isStarting, onStart, onOpenWorkspace }) => (
  <Box
    sx={{
      flex: 1,
      minHeight: 132,
      display: "flex",
      flexDirection: "column",
      gap: 1.5,
      border: `1px solid ${colors.border}`,
      borderRadius: 2,
      bgcolor: colors.surface,
      p: 2,
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
      <AssignmentTurnedInOutlinedIcon
        sx={{ fontSize: 20, color: data.reviewOpen ? colors.accent : colors.textDim }}
      />
      <Box sx={{ minWidth: 0, flex: "1 1 200px" }}>
        <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: colors.textPrimary }}>
          {data.reviewOpen ? "Review in progress" : "Review not started"}
        </Typography>
        <Typography sx={{ fontSize: 12, color: colors.textSecondary }}>
          {data.reviewOpen
            ? // OLM ids, not names: `app_user` is empty in this environment, so
              // a name column would always resolve to null.
              `${data.reviewOwnedByMe ? "You" : data.reviewerId ?? "Another reviewer"} opened this version${
                data.reviewStartedAt ? ` on ${formatStamp(data.reviewStartedAt)}` : ""
              }.`
            : "Opening the review assigns this MOP to you and moves it to In review."}
        </Typography>
      </Box>

      {data.reviewOpen && data.reviewOwnedByMe && (
        <Chip
          label="Yours"
          size="small"
          sx={{
            height: 20,
            fontSize: 10,
            fontWeight: 700,
            bgcolor: alpha(colors.accent, 0.15),
            color: colors.accent,
          }}
        />
      )}

      {/* The workspace is readable whatever the review state - a superseded or
          already-validated version still has findings and a history worth
          opening - so this is never gated on canStart. */}
      <Button
        size="small"
        variant="outlined"
        onClick={onOpenWorkspace}
        startIcon={<FactCheckOutlinedIcon sx={{ fontSize: "17px !important" }} />}
        sx={{
          textTransform: "none",
          fontSize: 12.5,
          fontWeight: 700,
          borderRadius: 1.5,
          px: 1.4,
          whiteSpace: "nowrap",
          color: colors.textPrimary,
          borderColor: colors.border,
        }}
      >
        Validate
      </Button>

      {!data.reviewOpen && (
        <Button
          size="small"
          variant="contained"
          onClick={onStart}
          disabled={!canStart || isStarting}
          startIcon={
            isStarting ? (
              <CircularProgress size={13} color="inherit" />
            ) : (
              <PlayArrowRoundedIcon sx={{ fontSize: "17px !important" }} />
            )
          }
          sx={{
            textTransform: "none",
            fontSize: 12.5,
            fontWeight: 700,
            borderRadius: 1.5,
            px: 1.4,
            whiteSpace: "nowrap",
            bgcolor: colors.accent,
            "&:hover": { bgcolor: colors.accent, filter: "brightness(1.08)" },
          }}
        >
          {isStarting ? "Starting…" : "Start review"}
        </Button>
      )}
    </Box>

    {readOnly && !data.reviewOpen && (
      <Alert severity="info" sx={{ fontSize: 12, py: 0.25 }}>
        This stage is closed, so the review cannot be opened from here.
      </Alert>
    )}

    {data.note && (
      <Field label="Version note" value={data.note} colors={colors} />
    )}

    {/* Only once a decision exists - an undecided version would otherwise show
        two empty rows that read as missing data. */}
    {data.decidedAt && (
      <Field
        label="Decision"
        value={`${data.decidedBy ?? "Unknown reviewer"} · ${formatStamp(data.decidedAt)}${
          data.decisionNote ? ` — ${data.decisionNote}` : ""
        }`}
        colors={colors}
      />
    )}

    <Box sx={{ flex: 1 }} />
  </Box>
);

const Field: React.FC<{ label: string; value: string; colors: any }> = ({
  label,
  value,
  colors,
}) => (
  <Box>
    <Typography
      sx={{
        fontSize: 9.5,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        fontWeight: 700,
        color: colors.textSecondary,
        lineHeight: 1.5,
      }}
    >
      {label}
    </Typography>
    <Typography sx={{ fontSize: 12.5, color: colors.textPrimary, lineHeight: 1.5 }}>
      {value}
    </Typography>
  </Box>
);

export default MopValidatePanel;
