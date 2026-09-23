import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import PersonPinCircleOutlinedIcon from "@mui/icons-material/PersonPinCircleOutlined";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import { useTabColorTokens } from "../../../../style/theme";
import type { AuditLogEntry } from "../../types/auditLog";
import AuditActionBadge from "./AuditActionBadge";
import {
  formatAuditDate,
  humanise,
  orDash,
  rawTimestamp,
} from "./auditLogFormat";

interface Props {
  entry: AuditLogEntry | null;
  onClose: () => void;
}

/**
 * The whole audit record for one action.
 *
 * Shows every column the row carries, including the ones the table has no space
 * for (log id, actor role and email, affected user's email, and the raw
 * microsecond timestamp) — the requirement is that nothing stored is silently
 * discarded on the way to the screen, and this dialog is where the overflow
 * lands.
 *
 * Deliberately narrow (`maxWidth="sm"`): it is a record to read, not a
 * workspace, and a wide dialog over a dense table loses the reader's place.
 */
const AuditLogDetailDialog = ({ entry, onClose }: Props) => {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  if (!entry) return null;

  const Field = ({
    label,
    value,
    mono = false,
  }: {
    label: string;
    value: string;
    mono?: boolean;
  }) => (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: tk.textDim,
          lineHeight: 1.6,
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
        }}
      >
        {value}
      </Typography>
    </Box>
  );

  const Section = ({
    icon,
    title,
    children,
  }: {
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
  }) => (
    <Box
      sx={{
        p: 1.5,
        borderRadius: tk.radius,
        bgcolor: tk.surface2,
        border: `1px solid ${tk.border}`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1 }}>
        {icon}
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.5,
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
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1.25,
        }}
      >
        {children}
      </Box>
    </Box>
  );

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={fullScreen}
      slotProps={{
        paper: {
          sx: { borderRadius: fullScreen ? 0 : tk.radiusL, bgcolor: tk.surface },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          py: 1.5,
          px: 2,
          borderBottom: `1px solid ${tk.border}`,
        }}
      >
        <AuditActionBadge action={entry.action} size="medium" />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography sx={{ fontSize: 14, fontWeight: 800, color: tk.textPrimary }}>
            {entry.module}
            {entry.subModule ? ` · ${entry.subModule}` : ""}
          </Typography>
          <Typography sx={{ fontSize: 11, color: tk.textSecondary }}>
            Audit record #{entry.logId}
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <CloseRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {/* What happened — the remark is the sentence a reader wants first. */}
        <Box>
          <Typography
            sx={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: tk.textDim,
              mb: 0.4,
            }}
          >
            Remark
          </Typography>
          <Typography sx={{ fontSize: 13, color: tk.textPrimary, lineHeight: 1.5 }}>
            {orDash(entry.remark)}
          </Typography>
        </Box>

        <Divider />

        <Section
          icon={<ScheduleRoundedIcon sx={{ fontSize: 15, color: tk.textSecondary }} />}
          title="When"
        >
          <Field label="Date" value={formatAuditDate(entry)} />
          <Field label="Time" value={orDash(entry.actionTime)} mono />
          <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
            {/* Verbatim, microseconds included: this is exactly what the
                database recorded, and an auditor is entitled to see it
                unrounded and untranslated. */}
            <Field label="Full timestamp (as stored)" value={rawTimestamp(entry)} mono />
          </Box>
        </Section>

        <Section
          icon={<PersonOutlineRoundedIcon sx={{ fontSize: 15, color: tk.textSecondary }} />}
          title="Actor"
        >
          <Field label="Name" value={orDash(entry.actorName)} />
          <Field label="OLM ID" value={orDash(entry.actorOlmid)} mono />
          <Field label="Role" value={humanise(entry.actorRole)} />
          <Field label="User ID" value={orDash(entry.actorUserId)} mono />
          <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
            <Field label="Email" value={orDash(entry.actorEmail)} />
          </Box>
        </Section>

        {entry.affectedUserId ? (
          <Section
            icon={
              <PersonPinCircleOutlinedIcon sx={{ fontSize: 15, color: tk.textSecondary }} />
            }
            title="Affected user"
          >
            <Field label="Name" value={orDash(entry.affectedName)} />
            <Field label="OLM ID" value={orDash(entry.affectedOlmid)} mono />
            <Field label="User ID" value={orDash(entry.affectedUserId)} mono />
            <Field label="Email" value={orDash(entry.affectedEmail)} />
          </Section>
        ) : (
          <Typography sx={{ fontSize: 11.5, color: tk.textDim, fontStyle: "italic" }}>
            This action did not target a specific user.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuditLogDetailDialog;
