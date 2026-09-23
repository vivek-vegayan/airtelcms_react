import { Box, Chip, Divider, Typography, useTheme } from "@mui/material";
import type { ReactNode } from "react";
import { useTabColorTokens } from "../../../../../style/theme";
import type { CancelledCrq } from "../../../types/cancelledCrq.types";
import {
  formatDateTime,
  formatWindow,
  orDash,
  stageLabel,
} from "../cancelledCrqFormat";

/** One label/value pair. Values are never editable — this screen is a record. */
const Field = ({
  label,
  value,
  wide = false,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  wide?: boolean;
  mono?: boolean;
}) => {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);

  return (
    <Box sx={{ gridColumn: wide ? "1 / -1" : "auto", minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 0.55,
          textTransform: "uppercase",
          color: tk.textSecondary,
          mb: 0.35,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 12.5,
          color: tk.textPrimary,
          fontFamily: mono ? "monospace" : undefined,
          wordBreak: "break-word",
          lineHeight: 1.5,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
};

/** A titled group of fields; groups stack into a responsive grid. */
const Section = ({
  title,
  accent,
  children,
}: {
  title: string;
  accent: string;
  children: ReactNode;
}) => {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);

  return (
    <Box
      sx={{
        minWidth: 0,
        p: 1.75,
        borderRadius: tk.radiusL,
        bgcolor: tk.surface,
        border: `1px solid ${tk.border}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Box
          sx={{
            width: 3,
            height: 14,
            borderRadius: 99,
            bgcolor: accent,
            flexShrink: 0,
          }}
        />
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: tk.textSecondary,
          }}
        >
          {title}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 1.5,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

interface Props {
  crq: CancelledCrq;
}

/**
 * The full record for one cancelled CRQ, shown when its row is expanded.
 *
 * Everything here is read-only by design — a cancelled CRQ is terminal, and
 * the ask for this screen was explicitly a view with no actions, so there is
 * no button, menu or editable control anywhere in this component.
 *
 * The Remedy section renders even when its feed is empty (CRQ_DETAIL_TBL has
 * no rows in this environment): hiding it would make the layout jump between
 * CRQs, and the dashes are an honest statement that the field has no value
 * rather than that it does not exist.
 */
export const CancelledCrqDetail = ({ crq }: Props) => {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);

  const fromRemedy = crq.cancelledSource === "Remedy";

  return (
    <Box sx={{ p: 2, bgcolor: tk.surface2, borderTop: `1px solid ${tk.border}` }}>
      {/* Header line: what was cancelled, and where it died. */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1.25,
          mb: 2,
        }}
      >
        <Typography
          sx={{ fontSize: 14, fontWeight: 800, fontFamily: "monospace", color: tk.textPrimary }}
        >
          {crq.crqNo}
        </Typography>
        <Chip
          size="small"
          label="Cancelled"
          sx={{
            height: 20,
            fontSize: 10.5,
            fontWeight: 800,
            color: tk.danger,
            bgcolor: tk.dangerDim,
            border: `1px solid ${tk.dangerBorder}`,
          }}
        />
        <Chip
          size="small"
          label={`Cancelled at: ${stageLabel(crq.cancelledStage)}`}
          sx={{
            height: 20,
            fontSize: 10.5,
            fontWeight: 700,
            color: tk.textSecondary,
            bgcolor: tk.surface,
            border: `1px solid ${tk.border}`,
          }}
        />
        <Chip
          size="small"
          label={fromRemedy ? "Raised by Remedy" : "Raised in CHM"}
          sx={{
            height: 20,
            fontSize: 10.5,
            fontWeight: 700,
            color: fromRemedy ? tk.info : tk.accent,
            bgcolor: fromRemedy ? tk.infoDim : tk.accentDim,
            border: `1px solid ${fromRemedy ? tk.infoBorder : tk.accentBorder}`,
          }}
        />
        {(crq.rescheduleCount ?? 0) > 0 && (
          <Chip
            size="small"
            label={`Rescheduled ${crq.rescheduleCount}×`}
            sx={{
              height: 20,
              fontSize: 10.5,
              fontWeight: 700,
              color: tk.warning,
              bgcolor: tk.warningDim,
              border: `1px solid ${tk.warningBorder}`,
            }}
          />
        )}
      </Box>

      {/* A grid rather than a wrapping flex row: with flex, whichever section
          landed alone on the last line stretched to the full width and its
          fields spread into an unreadably sparse single row. Auto-fill keeps
          every section the same width at every viewport. */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
          alignItems: "start",
          gap: 1.5,
        }}
      >
        <Section title="Cancellation" accent={tk.danger}>
          <Field label="Reason" value={orDash(crq.cancellationReason)} wide />
          <Field label="Type" value={orDash(crq.cancellationType)} />
          <Field label="Disposition" value={orDash(crq.cancelStatus)} />
          <Field label="Rollback owner" value={orDash(crq.rollbackOwner)} />
          <Field
            label="Cancelled by"
            value={
              crq.cancelledByName
                ? `${crq.cancelledByName} (${crq.cancelledBy})`
                : orDash(crq.cancelledBy)
            }
          />
          <Field label="Cancelled on" value={formatDateTime(crq.cancelledAt)} />
          <Field
            label="Days to cancel"
            value={crq.daysToCancel === null ? "—" : `${crq.daysToCancel} day(s)`}
          />
          <Field label="Remark" value={orDash(crq.remark)} wide />
        </Section>

        <Section title="Organisation" accent={tk.accent}>
          <Field label="Vertical" value={orDash(crq.verticalName)} />
          <Field label="Function" value={orDash(crq.functionName)} />
          <Field label="Domain" value={orDash(crq.domainName)} />
          <Field label="Sub domain" value={orDash(crq.subDomainName)} />
          <Field label="Circle" value={orDash(crq.crqCircle)} />
          <Field label="Plan" value={orDash(crq.planNumber)} mono />
          <Field label="Plan type" value={orDash(crq.planType)} wide />
        </Section>

        <Section title="Timeline" accent={tk.info}>
          <Field label="Raised" value={formatDateTime(crq.raisedAt)} />
          <Field label="Closed" value={formatDateTime(crq.closedAt)} />
          <Field
            label="Requested window"
            value={formatWindow(crq.requestedStartDate, crq.requestedEndDate)}
            wide
          />
          <Field
            label="Execution slot"
            value={formatWindow(crq.executionSlotStart, crq.executionSlotEnd)}
            wide
          />
          <Field
            label="Entered final stage"
            value={formatDateTime(crq.enteredCurrentStageAt)}
          />
          <Field label="Stage started" value={formatDateTime(crq.stageStartedAt)} />
          <Field label="Assigned to" value={orDash(crq.assignedOlmid)} mono />
          <Field label="Last acted by" value={orDash(crq.performedByOlmid)} mono />
        </Section>

        <Section title={`Tasks (${crq.taskCount ?? 0})`} accent={tk.warning}>
          <Field label="Task IDs" value={orDash(crq.taskIds)} wide mono />
          <Field label="NE labels" value={orDash(crq.neLabels)} wide />
          <Field label="Activities" value={orDash(crq.taskActivities)} wide />
        </Section>

        <Section title="Remedy details" accent={tk.textDim}>
          <Field label="Description" value={orDash(crq.description)} wide />
          <Field label="Detailed description" value={orDash(crq.detailedDescription)} wide />
          <Field label="Type of CR" value={orDash(crq.typeOfCr)} />
          <Field label="Change impact" value={orDash(crq.remedyChangeImpact)} />
          <Field label="Support organisation" value={orDash(crq.supportOrganization)} />
          <Field label="Support group" value={orDash(crq.supportGroupName)} />
          <Field label="Tier 1" value={orDash(crq.categorizationTier1)} />
          <Field label="Tier 2" value={orDash(crq.categorizationTier2)} />
          <Field label="Tier 3" value={orDash(crq.categorizationTier3)} />
          <Field label="ASCPY" value={orDash(crq.ascpy)} />
          <Field label="ASORG" value={orDash(crq.asorg)} />
          <Field label="ASGRP" value={orDash(crq.asgrp)} />
          <Field label="Company 3" value={orDash(crq.company3)} />
        </Section>
      </Box>

      <Divider sx={{ mt: 2, mb: 1, borderColor: tk.border }} />
      <Typography sx={{ fontSize: 10.5, color: tk.textDim }}>
        Read-only record. Cancellation is terminal — this screen offers no
        actions on the CRQ.
      </Typography>
    </Box>
  );
};

export default CancelledCrqDetail;
