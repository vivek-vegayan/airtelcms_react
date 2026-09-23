import {
  Button,
  Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { toast } from "react-toastify";
import {
  useAddServiceRuleMutation,
  useGetCircleDropdownQuery,
  useGetServicesDropdownQuery,
} from "../../api/cabManagerApiSlice";

type AddServiceRuleModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const EMPTY_FORM = { service: "", circle: "", l1: "", l2: "", l3: "", active: true };

export function AddServiceRuleModal({ open, onClose, onSuccess }: AddServiceRuleModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [addServiceRule, { isLoading }] = useAddServiceRuleMutation();
  const { data: services = [], isFetching: isLoadingServices } = useGetServicesDropdownQuery(undefined, {
    skip: !open,
  });
  const { data: circles = [], isFetching: isLoadingCircles } = useGetCircleDropdownQuery(undefined, {
    skip: !open,
  });

  const canSubmit = !!form.service && !!form.circle && !!form.l1 && !!form.l2 && !!form.l3;

  const handleClose = () => {
    setForm(EMPTY_FORM);
    onClose();
  };

  const submit = async () => {
    if (!canSubmit) return;
    try {
      const result = await addServiceRule({
        service: form.service,
        circle: form.circle,
        l1: form.l1,
        l2: form.l2,
        l3: form.l3,
        active: form.active,
      }).unwrap();

      if (result.status === "Success") {
        toast.success(result.message);
        setForm(EMPTY_FORM);
        onSuccess ? onSuccess() : onClose();
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to save service escalation rule.");
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add Service Approval</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Configure the impacted-party approval chain for a service and circle. L1 is the primary
          approver; L2 and L3 are the escalation tiers.
        </Typography>
        <Stack spacing={2}>
          <TextField
            select fullWidth required
            label="Service Type"
            InputLabelProps={{ shrink: true }}
            value={form.service}
            onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
            disabled={isLoadingServices}
          >
            {services.map((s) => (
              <MenuItem key={s.serviceCode} value={s.serviceCode}>{s.serviceCode}</MenuItem>
            ))}
          </TextField>
          <TextField
            select fullWidth required
            label="Circle"
            InputLabelProps={{ shrink: true }}
            value={form.circle}
            onChange={(e) => setForm((f) => ({ ...f, circle: e.target.value }))}
            disabled={isLoadingCircles}
          >
            {circles.map((c) => (
              <MenuItem key={c.circleCode} value={c.circleCode}>{c.circleCode}</MenuItem>
            ))}
          </TextField>
          <TextField
            fullWidth required
            label="L1 OLM ID"
            placeholder="e.g. B0093363"
            InputLabelProps={{ shrink: true }}
            value={form.l1}
            onChange={(e) => setForm((f) => ({ ...f, l1: e.target.value }))}
          />
          <TextField
            fullWidth required
            label="L2 OLM ID"
            placeholder="e.g. B0093364"
            InputLabelProps={{ shrink: true }}
            value={form.l2}
            onChange={(e) => setForm((f) => ({ ...f, l2: e.target.value }))}
          />
          <TextField
            fullWidth required
            label="L3 OLM ID"
            placeholder="e.g. B0093365"
            InputLabelProps={{ shrink: true }}
            value={form.l3}
            onChange={(e) => setForm((f) => ({ ...f, l3: e.target.value }))}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
            }
            label="Active"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={isLoading || !canSubmit}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
