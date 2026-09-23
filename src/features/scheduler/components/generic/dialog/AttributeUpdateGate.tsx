import React, { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Collapse, Stack, Typography, alpha } from "@mui/material";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import { toast } from "react-toastify";
import { useOpenAttributeUpdate } from "../../../sub-feature/attributeUpdate/hooks/useOpenAttributeUpdate";

/** Single copy for the "you skipped Attribute Update" nudge, shared by the
 * toast and the inline alert so both stay in sync. */
export const ATTRIBUTE_UPDATE_WARNING =
  "Please click Attribute Update and review the CRQ attributes before recording an outcome.";

interface UseAttributeUpdateGateArgs {
  /** CRQ the hosting review dialog is acting on. */
  crq: any;
  /** The review dialog's own `open` flag - flipping it resets the gate, so
   * each visit to the dialog has to visit Attribute Update again. */
  open: boolean;
  /** Cancelled / view-only - the button is inert. A Done stage stays
   * clickable so attributes can still be updated after the outcome. */
  disabled?: boolean;
}

/**
 * Tracks whether the user has opened the Attribute Update dialog during this
 * visit to a stage's review form, and warns (never blocks) when an outcome is
 * chosen without doing so.
 *
 * Every stage's review form - the six generic stages via `GenericFormPanel`
 * and Plan & Inventory via the plan-inv `FormPanel` - drives the button from
 * this one hook, so the affordance and the warning behave identically in all
 * phases.
 */
export function useAttributeUpdateGate({ crq, open, disabled = false }: UseAttributeUpdateGateArgs) {
  const openAttributeUpdate = useOpenAttributeUpdate();
  const [visited, setVisited] = useState(false);
  const [warned, setWarned] = useState(false);

  // A different CRQ, or a fresh open of the review dialog, is a fresh review.
  useEffect(() => {
    setVisited(false);
    setWarned(false);
  }, [open, crq?.crqNo]);

  const isDisabled = disabled || !crq;

  const openDialog = useCallback(() => {
    if (isDisabled) return;
    setVisited(true);
    setWarned(false);
    toast.dismiss("attribute-update-pending");
    openAttributeUpdate(crq);
  }, [crq, isDisabled, openAttributeUpdate]);

  /** Called when an outcome (Pass/Failed/Cancelled) is picked. Returns true
   * when the nudge fired; the caller records the outcome either way. */
  const warnIfPending = useCallback(() => {
    if (visited || isDisabled) return false;
    setWarned(true);
    // toastId de-dupes repeated outcome clicks into a single live toast
    // instead of stacking one per click.
    toast.warn(ATTRIBUTE_UPDATE_WARNING, { toastId: "attribute-update-pending" });
    return true;
  }, [visited, isDisabled]);

  return { visited, warned, isDisabled, openDialog, warnIfPending };
}

interface AttributeUpdateGateProps {
  visited: boolean;
  warned: boolean;
  disabled: boolean;
  colors: any;
  onOpen: () => void;
}

/**
 * The "Attribute Update" button as it appears inside a review form, directly
 * above the outcome selector, plus the inline warning shown once an outcome
 * has been picked without visiting it.
 */
export const AttributeUpdateGate: React.FC<AttributeUpdateGateProps> = ({
  visited,
  warned,
  disabled,
  colors,
  onOpen,
}) => (
  <Box>
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 1 }}>
      <Typography
        variant="caption"
        sx={{ fontWeight: 600, color: colors.textSecondary, fontSize: 12 }}
      >
        CRQ attributes
      </Typography>
      {visited && (
        <CheckCircleRoundedIcon sx={{ fontSize: 14, color: colors.success ?? "#16a34a" }} />
      )}
    </Stack>

    <Button
      fullWidth
      variant="outlined"
      disabled={disabled}
      onClick={onOpen}
      startIcon={<EditNoteRoundedIcon sx={{ fontSize: "17px !important" }} />}
      sx={{
        textTransform: "none",
        fontSize: 13,
        fontWeight: 600,
        borderRadius: 2,
        py: 0.9,
        justifyContent: "flex-start",
        color: colors.accent,
        borderColor: alpha(colors.accent, 0.45),
        "&:hover": { borderColor: colors.accent, bgcolor: alpha(colors.accent, 0.06) },
      }}
    >
      Attribute Update
    </Button>

    <Collapse in={warned && !visited} unmountOnExit>
      <Alert severity="warning" sx={{ mt: 1, py: 0.25, fontSize: 12, borderRadius: 2 }}>
        {ATTRIBUTE_UPDATE_WARNING}
      </Alert>
    </Collapse>
  </Box>
);

export default AttributeUpdateGate;
