import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  Divider,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Avatar,
  Slide,
  useTheme,
  alpha,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import { type TransitionProps } from "@mui/material/transitions";
import CloseIcon from "@mui/icons-material/Close";
import EditNoteOutlinedIcon from "@mui/icons-material/EditNoteOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { toast } from "react-toastify";
import { type PlanViewRow, useUpdatePlanMutation } from "../api/planApiSlice";
import { authStorage } from "../../../../../app/store/auth.storage";

export interface FilterOption {
  label: string;
  value: number;
} 

// Smooth Slide-up transition for the dialog
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface PlanEditDialogProps {
  open: boolean;
  onClose: () => void;
  data: PlanViewRow | null;
  chmDomainOptions?: FilterOption[];
  chmSubDomainOptions?: FilterOption[];
}

type FormDataState = PlanViewRow;

export const PlanEditDialog: React.FC<PlanEditDialogProps> = ({
  open,
  onClose,
  data,
  chmDomainOptions = [],
  chmSubDomainOptions = [],
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [formData, setFormData] = useState<FormDataState | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormDataState, string>>>({});
  const [updatePlan, { isLoading: isUpdating }] = useUpdatePlanMutation();
  const loggedUser = authStorage.getUser();

  // CHANGE_IMPACT options
  const CHANGE_IMPACT_OPTIONS = ["SA", "NSA"];
  // Matches PLAN_MASTER.status enum('Active','Inactive')
  const STATUS_OPTIONS = ["Active", "Inactive"];

  useEffect(() => {
    // chmDomainId/chmSubDomainId now come straight from the backend
    // (GET /plan/view), no more guessing the ID from a label match.
    setFormData(data ? { ...data } : null);
    setErrors({});
  }, [data, open]);

  if (!data || !formData) return null;

  const handleChange = (key: keyof FormDataState, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [key]: value } : null));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  /** Mirrors UpdatePlanRequest's required fields (see planApiSlice.ts). */
  const validateForm = (data: FormDataState): boolean => {
    const newErrors: Partial<Record<keyof FormDataState, string>> = {};

    if (!data.planType?.trim()) newErrors.planType = "Required";
    if (!data.status) newErrors.status = "Required";
    if (!data.chmDomainId) newErrors.chmDomainId = "Required";
    if (!data.chmSubDomainId) newErrors.chmSubDomainId = "Required";
    if (!data.networkDomain?.trim()) newErrors.networkDomain = "Required";
    if (!data.layer?.trim()) newErrors.layer = "Required";
    if (!data.planVendor?.trim()) newErrors.planVendor = "Required";
    if (!data.changeImpact) newErrors.changeImpact = "Required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveClick = async () => {
    if (formData) {
      if (!validateForm(formData)) return;
      try {
        const updatePayload = {
          actorUserId: loggedUser?.id ?? 0,
          planId: formData.planId,
          planType: formData.planType,
          status: formData.status,
          chmDomainId: formData.chmDomainId,
          chmSubDomain: formData.chmSubDomainId,
          networkDomain: formData.networkDomain,
          layer: formData.layer,
          planVendor: formData.planVendor,
          changeImpact: formData.changeImpact,
        };

        const res = await updatePlan(updatePayload).unwrap();
        toast.success(res?.message || "Plan Updated Successfully");
        onClose();
      } catch (error) {
        console.error("Failed to update plan:", error);
        // Attempt to show an error toast
        try {
          // Try to extract message from common error shapes
          const errMsg = (error as any)?.data?.message || (error as any)?.message || "Failed to update plan";
          toast.error(errMsg);
        } catch (e) {
          toast.error("Failed to update plan");
        }
      }
    }
  };

  // Explicit editable field list — mirrors UpdatePlanRequest exactly, so a new
  // field on PlanViewRow no longer silently becomes an editable input.
  type FieldConfig =
    | { key: keyof FormDataState; label: string; kind: "text" }
    | { key: keyof FormDataState; label: string; kind: "dropdown"; options: FilterOption[] };

  const FIELDS: FieldConfig[] = [
    { key: "chmDomainId", label: "CHM Domain", kind: "dropdown", options: chmDomainOptions },
    { key: "chmSubDomainId", label: "CHM Sub Domain", kind: "dropdown", options: chmSubDomainOptions },
    { key: "networkDomain", label: "Network Domain", kind: "text" },
    { key: "layer", label: "Layer", kind: "text" },
    { key: "planType", label: "Plan Type", kind: "text" },
    { key: "planVendor", label: "Plan Vendor", kind: "text" },
    {
      key: "changeImpact",
      label: "Change Impact",
      kind: "dropdown",
      options: CHANGE_IMPACT_OPTIONS.map((v) => ({ label: v, value: v as any })),
    },
    {
      key: "status",
      label: "Status",
      kind: "dropdown",
      options: STATUS_OPTIONS.map((v) => ({ label: v, value: v as any })),
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md" 
      fullWidth
      TransitionComponent={Transition}
      PaperProps={{
        sx: {
          borderRadius: 3, 
          backgroundImage: "none",
          boxShadow: isDark
            ? "0 24px 48px rgba(0,0,0,0.5)"
            : "0 24px 48px rgba(0,0,0,0.08)",
        },
      }}
    >
      {/* ── Custom Header ── */}
      <DialogTitle sx={{ p: 0 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            px: 3,
            py: 2.5,
            bgcolor: isDark
              ? alpha(theme.palette.background.paper, 0.4)
              : alpha(theme.palette.primary.main, 0.02),
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
                width: 44,
                height: 44,
              }}
            >
              <EditNoteOutlinedIcon fontSize="medium" />
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, fontSize: "1.1rem", lineHeight: 1.2 }}
              >
                Edit Plan Details
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Modify the specific fields for this record below.
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              color: "text.secondary",
              "&:hover": {
                bgcolor: alpha(theme.palette.error.main, 0.1),
                color: "error.main",
              },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <Divider />
      </DialogTitle>

      {/* ── Form Content ── */}
      <DialogContent sx={{ p: 4 }}>
        <Grid container spacing={3}>
          {FIELDS.map(({ key, label, kind, options }) => {
            const value = formData[key];
            const hasError = !!errors[key];

            return (
              <Grid size={{ xs: 12, sm: 6 }} key={key}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 600,
                    color: "text.secondary",
                    mb: 0.75,
                    display: "block",
                    textTransform: "capitalize",
                  }}
                >
                  {label} <span style={{ color: "red" }}>*</span>
                </Typography>

                {kind === "dropdown" ? (
                  <TextField
                    select
                    fullWidth
                    size="small"
                    variant="outlined"
                    error={hasError}
                    value={value ?? ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: theme.palette.background.paper,
                        transition: "all 0.2s ease-in-out",
                        "&:hover fieldset": {
                          borderColor: theme.palette.primary.main,
                        },
                        "&.Mui-focused fieldset": {
                          borderWidth: "1.5px",
                        },
                      },
                    }}
                  >
                    {options.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : (
                  <TextField
                    fullWidth
                    size="small"
                    variant="outlined"
                    placeholder={`Enter ${label.toLowerCase()}`}
                    error={hasError}
                    value={value !== null && value !== undefined ? value : ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                        bgcolor: theme.palette.background.paper,
                        transition: "all 0.2s ease-in-out",
                        "&:hover fieldset": {
                          borderColor: theme.palette.primary.main,
                        },
                        "&.Mui-focused fieldset": {
                          borderWidth: "1.5px",
                        },
                      },
                    }}
                  />
                )}
                {hasError && (
                  <Typography sx={{ fontSize: 11, color: "error.main", mt: 0.5 }}>
                    {errors[key]}
                  </Typography>
                )}
              </Grid>
            );
          })}
        </Grid>
      </DialogContent>

      {/* ── Action Footer ── */}
      <Box
        sx={{
          px: 3,
          py: 2,
          bgcolor: isDark
            ? alpha(theme.palette.background.default, 0.5)
            : theme.palette.grey[50],
          borderTop: `1px solid ${theme.palette.divider}`,
          display: "flex",
          justifyContent: "flex-end",
          gap: 1.5,
        }}
      >
        <Button
          onClick={onClose}
          variant="text"
          color="inherit"
          disabled={isUpdating}
          sx={{ fontWeight: 600, px: 3, borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveClick}
          variant="contained"
          color="primary"
          startIcon={
            isUpdating ? (
              <CircularProgress size={20} />
            ) : (
              <SaveOutlinedIcon />
            )
          }
          disabled={isUpdating}
          disableElevation
          sx={{
            fontWeight: 600,
            px: 3,
            borderRadius: 2,
            textTransform: "none",
          }}
        >
          {isUpdating ? "Saving..." : "Save Changes"}
        </Button>
      </Box>
    </Dialog>
  );
};
