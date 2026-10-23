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
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import dayjs, { type Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import {
  useAddServiceRuleMutation,
  useGetCircleDropdownQuery,
  useGetServicesDropdownQuery,
} from "../../api/cabManagerApiSlice";
import type { ServiceApprovalRule } from "../../types/types";

// Needed for dayjs("14:30", "HH:mm").
dayjs.extend(customParseFormat);

type AddServiceRuleModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  /** Row to edit — omitted/null opens the dialog in "add" mode. */
  editRow?: ServiceApprovalRule | null;
};

const EMPTY_FORM = {
  service: "",
  circle: "",
  l1: "",
  l2: "",
  l3: "",
  l1EscalationTime: "",
  l2EscalationTime: "",
  l3EscalationTime: "",
  active: true,
};

type FormState = typeof EMPTY_FORM;

const TIERS = [
  { key: "l1", label: "L1", placeholder: "e.g. B0093363", required: true },
  { key: "l2", label: "L2", placeholder: "e.g. B0093364", required: false },
  { key: "l3", label: "L3", placeholder: "e.g. B0093365", required: false },
] as const;

const orNull = (v: string) => (v.trim() ? v.trim() : null);

// TIME arrives as "HH:mm:ss"; the form keeps "HH:mm" (24-hour).
const toTimeInput = (v?: string | null) => (v ? v.slice(0, 5) : "");

const formFromRow = (row: ServiceApprovalRule): FormState => ({
  service: row.service ?? "",
  circle: row.circle ?? "",
  l1: row.l1OlmId ?? "",
  l2: row.l2OlmId ?? "",
  l3: row.l3OlmId ?? "",
  l1EscalationTime: toTimeInput(row.l1EscalationTime),
  l2EscalationTime: toTimeInput(row.l2EscalationTime),
  l3EscalationTime: toTimeInput(row.l3EscalationTime),
  active: row.active ?? true,
});

export function AddServiceRuleModal({ open, onClose, onSuccess, editRow }: AddServiceRuleModalProps) {
  const isEdit = Boolean(editRow);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // Re-seed on every open so the dialog always reflects the row clicked.
  useEffect(() => {
    if (open) setForm(editRow ? formFromRow(editRow) : EMPTY_FORM);
  }, [open, editRow]);
  const [addServiceRule, { isLoading }] = useAddServiceRuleMutation();
  const { data: services = [], isFetching: isLoadingServices } = useGetServicesDropdownQuery(undefined, {
    skip: !open,
  });
  const { data: circles = [], isFetching: isLoadingCircles } = useGetCircleDropdownQuery(undefined, {
    skip: !open,
  });

  const canSubmit = !!form.service && !!form.circle && !!form.l1.trim();

  const handleClose = () => {
    setForm(EMPTY_FORM);
    onClose();
  };

  const submit = async () => {
    if (!canSubmit) return;
    const l2 = orNull(form.l2);
    const l3 = orNull(form.l3);
    try {
      const result = await addServiceRule({
        // Same upsert endpoint for add and edit; Esc_Id makes it an update.
        id: editRow ? Number(editRow.id) : undefined,
        service: form.service,
        circle: form.circle,
        l1: form.l1.trim(),
        l2,
        l3,
        l1EscalationTime: orNull(form.l1EscalationTime),
        // A tier without an OLM id carries no escalation time (the proc clears it too).
        l2EscalationTime: l2 ? orNull(form.l2EscalationTime) : null,
        l3EscalationTime: l3 ? orNull(form.l3EscalationTime) : null,
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
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? `Edit Service Approval · ${editRow?.id}` : "Add Service Approval"}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Configure the impacted-party approval chain for a service and circle. L1 is the primary
          approver; L2 and L3 are optional escalation tiers, each with its own escalation time.
        </Typography>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              select fullWidth required
              label="Service Type"
              InputLabelProps={{ shrink: true }}
              value={form.service}
              onChange={(e) => setForm((f) => ({ ...f, service: e.target.value }))}
              disabled={isLoadingServices || isEdit}
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
              disabled={isLoadingCircles || isEdit}
            >
              {circles.map((c) => (
                <MenuItem key={c.circleCode} value={c.circleCode}>{c.circleCode}</MenuItem>
              ))}
            </TextField>
          </Stack>
          {TIERS.map(({ key, label, placeholder, required }) => {
            const timeKey = `${key}EscalationTime` as const;
            const hasOlm = !!form[key].trim();
            return (
              <Stack key={key} direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  fullWidth
                  size="small"
                  required={required}
                  label={`${label} OLM ID`}
                  placeholder={placeholder}
                  InputLabelProps={{ shrink: true }}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                />
                <TimePicker
                  label={`${label} Escalation Time`}
                  ampm={false}
                  format="HH:mm"
                  views={["hours", "minutes"]}
                  value={form[timeKey] ? dayjs(form[timeKey], "HH:mm") : null}
                  disabled={!hasOlm}
                  onChange={(v: Dayjs | null) =>
                    setForm((f) => ({ ...f, [timeKey]: v && v.isValid() ? v.format("HH:mm") : "" }))
                  }
                  slotProps={{
                    textField: {
                      size: "small",
                      // Keep the label pinned on top, like the OLM ID field.
                      InputLabelProps: { shrink: true },
                      sx: { width: { xs: "100%", sm: 160 }, flexShrink: 0 },
                    },
                    openPickerButton: { size: "small" },
                    // The Cancel/OK bar spans all 3 layout grid columns but the clock
                    // only sits in the middle one, leaving an empty strip before the
                    // hours. Span the clock across the full width and let the HH / mm
                    // columns share it equally.
                    layout: {
                      sx: {
                        "& .MuiPickersLayout-contentWrapper": { gridColumn: "1 / 4" },
                        "& .MuiMultiSectionDigitalClock-root": { width: "100%" },
                        "& .MuiMultiSectionDigitalClockSection-root": { flex: 1 },
                      },
                    },
                  }}
                />
              </Stack>
            );
          })}
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
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button variant="contained" onClick={submit} disabled={isLoading || !canSubmit}>
          {isLoading ? "Saving..." : isEdit ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
