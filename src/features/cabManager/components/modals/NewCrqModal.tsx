import {
  Alert,
  Box,
  Button,
  Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { useCreateCrqMutation } from "../../api/cabManagerApiSlice";
import { ASSIGN_CIRCLES, ASSIGN_DOMAINS } from "../../data/cabManager.mock";
import type { Circle, Domain, ImpactCode, NewCrqPayload } from "../../types/types";
import { errMsg } from "../shared/errMsg";

const EMPTY: NewCrqPayload = {
  activity: "",
  domain: "IP Core",
  circle: "MH",
  impact: "NSA",
  technology: "",
  scheduled: "",
  window: "",
  hostname: "",
  impactedParties: [],
};

export function NewCrqModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<NewCrqPayload>(EMPTY);
  const [create, { isLoading, isError, error }] = useCreateCrqMutation();

  const set = <K extends keyof NewCrqPayload>(k: K, v: NewCrqPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    try {
      await create(form).unwrap();
      setForm(EMPTY);
      onClose();
    } catch { /* error surfaced */ }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create new CRQ</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, pt: 1 }}>
          <TextField
            fullWidth required
            label="Activity"
            value={form.activity}
            onChange={(e) => set("activity", e.target.value)}
            sx={{ gridColumn: "span 2" }}
          />
          <TextField select fullWidth label="Domain" value={form.domain} onChange={(e) => set("domain", e.target.value as Domain)}>
            {ASSIGN_DOMAINS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
          </TextField>
          <TextField select fullWidth label="Circle" value={form.circle} onChange={(e) => set("circle", e.target.value as Circle)}>
            {ASSIGN_CIRCLES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <TextField select fullWidth label="Impact" value={form.impact} onChange={(e) => set("impact", e.target.value as ImpactCode)}>
            <MenuItem value="SA">SA — Service Affecting</MenuItem>
            <MenuItem value="NSA">NSA — Non Service Affecting</MenuItem>
          </TextField>
          <TextField fullWidth label="Technology" value={form.technology} onChange={(e) => set("technology", e.target.value)} />
          <TextField fullWidth type="date" label="Scheduled date" InputLabelProps={{ shrink: true }} value={form.scheduled} onChange={(e) => set("scheduled", e.target.value)} />
          <TextField fullWidth label="Maintenance window" placeholder="02:00 – 04:30 IST" value={form.window} onChange={(e) => set("window", e.target.value)} />
          <TextField fullWidth label="Hostname / Node" value={form.hostname} onChange={(e) => set("hostname", e.target.value)} sx={{ gridColumn: "span 2" }} />
        </Box>
        {isError && <Alert severity="error" sx={{ mt: 2 }}>{errMsg(error)}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={isLoading || !form.activity}>
          {isLoading ? "Creating…" : "Submit CRQ"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
