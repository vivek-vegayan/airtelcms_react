import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Drawer,
  FormControlLabel,
  IconButton,
  MenuItem,
  Skeleton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { errMsg } from "../../cabManager/components/shared/errMsg";
import { orDash } from "../../scheduler/sub-feature/cancelledCrq/cancelledCrqFormat";
import { useGetReassignCandidatesQuery, useReassignMemberMutation } from "../api/crqReassignApi";
import type { ReassignGridRow, ReassignStage } from "../types/crqReassign.types";
import { isPairedStage, LEVEL_OPTIONS, mopCounterpart, STAGE_NAMES } from "../utils/crqReassign.utils";
import { useReassignTokens } from "../hooks/useReassignTokens";
import type { Note } from "./reassignUi";

export interface StageSelection {
  row: ReassignGridRow;
  stage: ReassignStage;
  owner: string | null;
}

interface Props {
  sel: StageSelection | null;
  batchId: string | null;
  onBatch: (batchId: string | null) => void;
  setNote: (note: Note) => void;
  onClose: () => void;
}

/** Opens from a stage cell: the current owner, and who can take the stage (CANDIDATES → MEMBER). */
export const StageOwnerDrawer = ({ sel, batchId, onBatch, setNote, onClose }: Props) => {
  const { tk, rule, label } = useReassignTokens();
  const [level, setLevel] = useState("all");
  const [sameTeam, setSameTeam] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [pick, setPick] = useState<string | null>(null);

  const { data: candidates = [], isFetching, error } = useGetReassignCandidatesQuery(
    { crqNo: sel?.row.crq_no ?? "", stage: sel?.stage ?? "VALIDATE", level, sameTeam },
    { skip: !sel },
  );
  const [reassignMember, { isLoading: saving }] = useReassignMemberMutation();

  const paired = isPairedStage(sel?.stage);
  // MOP Creation and MOP Validation can never share an owner (the proc refuses it too).
  const mop = mopCounterpart(sel?.stage);
  const mopOwner = mop && sel ? (sel.row[mop.key] as string | null) : null;
  const picked = candidates.find((c) => c.olmid === pick) ?? null;
  const firstName = picked?.employee_name.split(" ")[0];

  const submit = async (newOlmId: string | null) => {
    if (!sel) return;
    try {
      const res = await reassignMember({
        crqNo: sel.row.crq_no,
        stage: sel.stage,
        newOlmId,
        batchId,
        remarks: remarks.trim() || undefined,
      }).unwrap();
      onBatch(res.batchId);
      setNote({ text: res.message, bad: false });
      onClose();
    } catch (e) {
      setNote({ text: errMsg(e), bad: true });
    }
  };

  return (
    <Drawer anchor="right" open={!!sel} onClose={onClose} PaperProps={{ sx: { width: 420 } }}>
      {sel && (
        <>
          {/* Header */}
          <Box sx={{ p: 2.5, borderBottom: rule }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1.5}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography sx={{ fontFamily: "'Roboto Mono', monospace", color: "primary.main", fontWeight: 500 }}>
                  {sel.row.crq_no}
                </Typography>
                <Chip size="small" label={`CAB ${orDash(sel.row.cab_approval_flag)}`} variant="outlined" />
              </Stack>
              <IconButton onClick={onClose} size="small">
                <CloseIcon />
              </IconButton>
            </Stack>
            <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 500, lineHeight: 1.3 }}>
              {paired ? "Network Execution + Task Closure" : STAGE_NAMES[sel.stage]}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {orDash(sel.row.team_name)}
            </Typography>
          </Box>

          {/* Body */}
          <Box sx={{ flex: 1, overflowY: "auto", p: 2.5 }}>
            <Typography sx={{ ...label, mb: 0.75 }}>Current owner</Typography>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
              <Typography sx={{ fontWeight: 600, fontFamily: sel.owner ? "'Roboto Mono', monospace" : "inherit" }}>
                {sel.owner ?? "Unassigned"}
              </Typography>
              {sel.owner && !paired && (
                <Button size="small" color="error" disabled={saving} onClick={() => submit(null)} sx={{ textTransform: "none" }}>
                  Remove owner
                </Button>
              )}
            </Stack>

            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography sx={label}>Assign to</Typography>
              <Typography variant="caption">{candidates.length} members</Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
              <TextField select size="small" value={level} onChange={(e) => setLevel(e.target.value)} sx={{ width: 120 }}>
                {LEVEL_OPTIONS.map((l) => (
                  <MenuItem key={l} value={l}>{l === "all" ? "All levels" : l}</MenuItem>
                ))}
              </TextField>
              <FormControlLabel
                control={<Switch size="small" checked={sameTeam} onChange={(e) => setSameTeam(e.target.checked)} />}
                label={<Typography variant="body2">Same team only</Typography>}
              />
            </Stack>

            {error && <Alert severity="error">{errMsg(error)}</Alert>}
            {isFetching && (
              <Stack spacing={1}>
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="rounded" height={64} />
                ))}
              </Stack>
            )}
            {!isFetching && !error && (
              <Stack spacing={1}>
                {candidates.map((c) => {
                  const on = pick === c.olmid;
                  // Eligibility is judged on the confirmed execution slot, which only
                  // moves for the EXECUTION / CLOSURE pair; for the other stages the
                  // reason is a warning, not a block.
                  const mopClash = !!mopOwner && c.olmid === mopOwner;
                  const blocked = mopClash || (paired && c.is_eligible !== 1);
                  const reason = mopClash
                    ? `Already owns ${STAGE_NAMES[mop!.stage]} — MOP creator and validator must be different.`
                    : c.ineligible_reason;
                  const need = Number(c.required_min ?? 0);
                  const free = Number(c.free_min ?? 0);
                  return (
                    <Box
                      key={c.olmid}
                      onClick={() => !blocked && setPick(c.olmid)}
                      sx={{
                        cursor: blocked ? "not-allowed" : "pointer",
                        opacity: blocked ? 0.6 : 1,
                        p: 1.25,
                        borderRadius: tk.radius,
                        bgcolor: on ? tk.accentDim : tk.surface,
                        border: `1px solid ${on ? tk.accent : tk.border}`,
                        transition: "border-color .15s, background .15s",
                        "&:hover": blocked ? undefined : { borderColor: tk.accent },
                      }}
                    >
                      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontSize: 13, fontWeight: 600 }} noWrap>{c.employee_name}</Typography>
                          {c.job_level && <Chip size="small" label={c.job_level} sx={{ height: 18, fontSize: 10 }} />}
                        </Stack>
                        <Chip
                          size="small"
                          label={c.match_status}
                          sx={{
                            height: 20,
                            fontSize: 10.5,
                            fontWeight: 700,
                            color: c.match_status === "Team match" ? tk.success : tk.warning,
                            bgcolor: c.match_status === "Team match" ? tk.successDim : tk.warningDim,
                            border: `1px solid ${c.match_status === "Team match" ? tk.successBorder : tk.warningBorder}`,
                          }}
                        />
                      </Stack>
                      <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                        {c.olmid} · {orDash(c.team_name)} · Shift {orDash(c.shift_name)} · {free}m free
                        {need ? ` / needs ${need}m` : ""} · {c.activities_today} activities
                      </Typography>
                      {(reason || c.busy_with) && (
                        <Typography variant="caption" component="div" sx={{ mt: 0.25, color: blocked ? tk.danger : tk.warning }}>
                          {reason}
                          {c.busy_with && !mopClash ? ` — ${c.busy_with}` : ""}
                        </Typography>
                      )}
                    </Box>
                  );
                })}
                {candidates.length === 0 && (
                  <Typography variant="body2" color="text.secondary">No member matches these filters.</Typography>
                )}
              </Stack>
            )}

            <Alert severity={paired || mop ? "warning" : "info"} sx={{ mt: 2 }}>
              {paired
                ? "Network Execution and Task Closure share one owner: this assignment applies to both, and moves the booked roster minutes."
                : mop
                  ? `MOP Creation and MOP Validation need different owners: the ${STAGE_NAMES[mop.stage]} owner${mopOwner ? ` (${mopOwner})` : ""} cannot take this stage.`
                  : "MOP Creation and MOP Validation need different owners; Network Execution and Task Closure always share one."}
            </Alert>

            <TextField
              size="small"
              fullWidth
              label="Remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value.slice(0, 255))}
              sx={{ mt: 2 }}
            />
          </Box>

          {/* Footer */}
          <Stack direction="row" spacing={1} sx={{ p: 2, borderTop: rule }}>
            <Button variant="contained" disabled={!picked || saving} onClick={() => submit(pick)} sx={{ flex: 1, textTransform: "none" }}>
              {picked ? (paired ? `Assign both stages to ${firstName}` : `Assign to ${firstName}`) : "Select a member"}
            </Button>
            <Button variant="outlined" onClick={onClose} sx={{ textTransform: "none" }}>
              Cancel
            </Button>
          </Stack>
        </>
      )}
    </Drawer>
  );
};

export default StageOwnerDrawer;
