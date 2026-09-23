import {
  Alert,
  AlertTitle,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useGetCabPlanConflictQuery, usePlanCabMutation } from "../../api/cabManagerApiSlice";
import { todayIso } from "../shared/todayIso";

export function PlanCabModal({
  open,
  crqIds,
  onClose,
  onPlanned,
}: {
  open: boolean;
  crqIds: string[];
  onClose: () => void;
  onPlanned?: () => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("16:00");
  const [type, setType] = useState<"Critical" | "Normal" | "Emergency">("Normal");
  const [linkInput, setLinkInput] = useState("");
  const [emails, setEmails] = useState<string[]>([]);

  // The planning page keeps this modal mounted, so its fields survive a save -
  // the next batch of CRQs would otherwise open on the previous session's date
  // and link. Clearing as it opens covers every way it was dismissed: saved,
  // Cancel, or backdrop.
  useEffect(() => {
    if (open) {
      setDate("");
      setTime("16:00");
      setType("Normal");
      setLinkInput("");
      setEmails([]);
    }
  }, [open]);

  // Invitees are optional, but a typo silently drops someone from the invite,
  // so anything entered has to look like an address before the session is saved.
  const badEmails = emails.filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  const minDate = todayIso();
  // Also guards typed/pasted values - the input's `min` only constrains the picker.
  const isPastDate = !!date && date < minDate;

  // The slot has to be settled before the session can be planned: a session
  // already booked here means these CRQs join it rather than a second one
  // opening in the same slot, and that decision is what the POST sends as
  // `conflict`.
  const slotReady = !!date && !!time;
  const {
    data: slot,
    isFetching: checkingSlot,
    isError: slotCheckFailed,
  } = useGetCabPlanConflictQuery(
    { date, time: `${time}:00` },
    { skip: !open || !slotReady || isPastDate },
  );

  const existingSession = slot?.cabId ?? null;
  const existingLink = slot?.sessionLink ?? "";
  // Joining a session means meeting on the link it already runs on, so a typed
  // link only applies when the slot is free or that session has none yet.
  const sessionLink = existingLink || linkInput.trim();

  const [planCab, { isLoading }] = usePlanCabMutation();

  const submit = async () => {
    if (
      !slotReady ||
      isPastDate ||
      crqIds.length === 0 ||
      checkingSlot ||
      badEmails.length > 0
    ) return;
    try {
      const sessionDateTime = `${date} ${time}:00`;
      const result = await planCab({
        crqIds,
        sessionDateTime,
        type,
        sessionLink: sessionLink || undefined,
        conflict: !!slot?.conflict,
        emailList: emails,
      }).unwrap();
      if (result.status === "Success") {
        toast.success(result.message);
        setLinkInput("");
        setEmails([]);
        onPlanned?.();
        onClose();
      } else {
        toast.error(result.message);
      }
    } catch (err: any) {
      toast.error(err?.data?.message || "Failed to plan CAB session.");
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Plan CAB Session</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Grouping <Box component="span" sx={{ color: "primary.main", fontWeight: 500 }}>{crqIds.length} CRQ(s)</Box> into a single CAB session for discussion.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mb: 1 }}>Selected CRQs</Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {crqIds.map((id) => (
              <Chip key={id} size="small" label={id} sx={{ fontFamily: "'Roboto Mono', monospace" }} />
            ))}
          </Stack>
        </Box>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            fullWidth required
            type="date"
            label="Session date"
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: minDate }}
            error={isPastDate}
            helperText={isPastDate ? "Pick today or a future date." : " "}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <TextField
            fullWidth required
            type="time"
            label="Session time"
            InputLabelProps={{ shrink: true }}
            helperText=" "
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </Stack>

        {/* Slot status - what this date + time already holds. Skipped for a
            past date: nothing was asked, so there is nothing to report. */}
        {slotReady && !isPastDate && (
          <Box sx={{ mb: 2 }}>
            {checkingSlot ? (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "text.secondary" }}>
                <CircularProgress size={14} color="inherit" />
                <Typography variant="caption">Checking this slot...</Typography>
              </Stack>
            ) : slotCheckFailed ? (
              <Alert severity="warning">
                Could not check this slot for an existing session. Planning will create a new one.
              </Alert>
            ) : existingSession ? (
              <Alert severity="warning">
                <AlertTitle sx={{ fontSize: 13, fontWeight: 600 }}>
                  Session already booked for this slot
                </AlertTitle>

                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                  sx={{ mb: 1 }}
                >
                  <Chip
                    size="small"
                    label={existingSession}
                    sx={{ fontFamily: "'Roboto Mono', monospace", fontWeight: 600 }}
                  />
                  <Chip
                    size="small"
                    variant="outlined"
                    color={slot?.conflict ? "warning" : "default"}
                    label={`Conflict: ${slot?.conflict ? "Yes" : "No"}`}
                  />
                </Stack>

                <Typography
                  variant="caption"
                  sx={{ display: "block", mb: slot?.crqList.length ? 0.75 : 0 }}
                >
                  {crqIds.length} selected CRQ(s) will be added to this session
                  {existingLink ? " on its existing link" : ""}.
                </Typography>

                {!!slot?.crqList.length && (
                  <>
                    <Typography
                      variant="caption"
                      sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
                    >
                      Already in this session
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                      {slot.crqList.map((id) => (
                        <Chip
                          key={id}
                          size="small"
                          variant="outlined"
                          label={id}
                          sx={{
                            fontFamily: "'Roboto Mono', monospace",
                            height: 20,
                            fontSize: 11,
                          }}
                        />
                      ))}
                    </Stack>
                  </>
                )}
              </Alert>
            ) : (
              <Alert severity="info">
                This slot is free - a new CAB session will be created.
              </Alert>
            )}
          </Box>
        )}

        <TextField
          select fullWidth
          label="Session type"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          sx={{ mb: 2 }}
        >
          <MenuItem value="Normal">Normal</MenuItem>
          <MenuItem value="Critical">Critical</MenuItem>
          <MenuItem value="Emergency">Emergency</MenuItem>
        </TextField>

        <TextField
          fullWidth
          required
          label="Session link"
          placeholder="e.g. meet.google.com/abc-defg"
          slotProps={{inputLabel: {shrink: true,},}}
          // InputLabelProps={{ shrink: true }}
          value={existingLink || linkInput}
          onChange={(e) => setLinkInput(e.target.value)}
          disabled={!!existingLink}
          helperText={
            existingLink
              ? `Reusing the link ${existingSession} already runs on.`
              : existingSession
                ? "This session does not have a link yet. Please provide one."
                : "Please enter the meeting link for this session."
          }
          sx={{ mb: 2 }}
        />

        {/* Invite list. autoSelect commits a half-typed address when focus
            leaves, so one entered without pressing Enter is not silently lost. */}
        <Autocomplete
          multiple
          freeSolo
          autoSelect
          options={[] as string[]}
          value={emails}
          onChange={(_event, next) => setEmails(next as string[])}
          renderValue={(values, getItemProps) =>
            values.map((email, index) => {
              const { key, ...itemProps } = getItemProps({ index });
              return (
                <Chip
                  {...itemProps}
                  key={key}
                  size="small"
                  variant="outlined"
                  label={email}
                  color={badEmails.includes(email) ? "error" : "default"}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Notify by email"
              placeholder="name@airtel.com"
              slotProps={{ inputLabel: { shrink: true } }}
              error={badEmails.length > 0}
              helperText={
                badEmails.length > 0
                  ? `Not a valid address: ${badEmails.join(", ")}`
                  : "Optional. Press Enter after each address."
              }
            />
          )}
        />

        
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={submit}
          disabled={
            isLoading ||
            checkingSlot ||
            !slotReady ||
            isPastDate ||
            crqIds.length === 0 ||
            badEmails.length > 0
          }
        >
          {isLoading
            ? "Saving..."
            : existingSession
              ? `Add to ${existingSession}`
              : "Schedule CAB"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
