import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import EngineeringOutlinedIcon from "@mui/icons-material/EngineeringOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import { useGetSpocFeDetailsQuery } from "../../api/cabManagerApiSlice";
import { errMsg } from "../shared/errMsg";

type SpocFeDetailsModalProps = {
  open: boolean;
  crqNo: string | null;
  onClose: () => void;
};

/** One labelled contact line; renders "—" for a column the proc returned NULL for. */
function ContactRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
}) {
  return (
    <Stack direction="row" spacing={1.25} alignItems="flex-start">
      <Box sx={{ color: "text.disabled", display: "flex", mt: 0.25 }}>{icon}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" sx={{ color: "text.secondary", display: "block" }}>
          {label}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            wordBreak: "break-word",
            color: value ? "text.primary" : "text.disabled",
            fontFamily: label === "OLM ID" || label === "Phone" ? "'Roboto Mono', monospace" : undefined,
          }}
        >
          {value || "—"}
        </Typography>
      </Box>
    </Stack>
  );
}

/**
 * One assignment block (SPOC or Field Engineer).
 *
 * "Assigned" is decided by the OLM id *or* the name being present, not by the
 * whole block being filled: sp_get_SPOC_FE_details routinely returns a SPOC
 * with a NULL email, and treating that as unassigned would hide a real
 * assignment behind an empty state.
 */
function AssignmentCard({
  title,
  icon,
  olmId,
  name,
  number,
  email,
}: {
  title: string;
  icon: React.ReactNode;
  olmId: string | null;
  name: string | null;
  number: string | null;
  email: string | null;
}) {
  const assigned = !!(olmId || name);

  return (
    <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: assigned ? 1.75 : 1 }}>
        <Box sx={{ color: "primary.main", display: "flex" }}>{icon}</Box>
        <Typography
          variant="caption"
          sx={{ flex: 1, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: "text.secondary" }}
        >
          {title}
        </Typography>
        {!assigned && <Chip size="small" variant="outlined" label="Not assigned" />}
      </Stack>

      {assigned && (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.75 }}>
          <ContactRow icon={<PersonOutlineIcon sx={{ fontSize: 16 }} />} label="Name" value={name} />
          <ContactRow icon={<BadgeOutlinedIcon sx={{ fontSize: 16 }} />} label="OLM ID" value={olmId} />
          <ContactRow icon={<PhoneOutlinedIcon sx={{ fontSize: 16 }} />} label="Phone" value={number} />
          <ContactRow icon={<EmailOutlinedIcon sx={{ fontSize: 16 }} />} label="Email" value={email} />
        </Box>
      )}
    </Paper>
  );
}

/**
 * Read-only view of a CRQ's SPOC and Field Engineer, from
 * GET /cab/crqs/{crqNo}/spoc-fe-details (sp_get_SPOC_FE_details).
 *
 * Purely informational - it replaced the "Re-assign SPOC" / "Re-assign FE"
 * controls, so nothing here mutates an assignment.
 */
export function SpocFeDetailsModal({ open, crqNo, onClose }: SpocFeDetailsModalProps) {
  const { data, isLoading, isFetching, isError, error } = useGetSpocFeDetailsQuery(
    crqNo ?? "",
    { skip: !open || !crqNo },
  );

  const showSkeleton = isLoading || isFetching;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        SPOC &amp; Field Engineer
        {crqNo && (
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", fontFamily: "'Roboto Mono', monospace", mt: 0.25 }}
          >
            {crqNo}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent>
        {isError && <Alert severity="error">{errMsg(error)}</Alert>}

        {!isError && showSkeleton && (
          <Stack spacing={2}>
            <Skeleton variant="rounded" height={140} />
            <Skeleton variant="rounded" height={140} />
          </Stack>
        )}

        {!isError && !showSkeleton && !data && (
          <Alert severity="info">No SPOC or Field Engineer has been assigned to this CRQ yet.</Alert>
        )}

        {!isError && !showSkeleton && data && (
          <Stack spacing={2}>
            <AssignmentCard
              title="SPOC"
              icon={<PersonOutlineIcon sx={{ fontSize: 18 }} />}
              olmId={data.spocOlmId}
              name={data.spocName}
              number={data.spocNumber}
              email={data.spocEmail}
            />
            <AssignmentCard
              title="Field Engineer"
              icon={<EngineeringOutlinedIcon sx={{ fontSize: 18 }} />}
              olmId={data.feOlmId}
              name={data.feName}
              number={data.feNumber}
              email={data.feEmail}
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
