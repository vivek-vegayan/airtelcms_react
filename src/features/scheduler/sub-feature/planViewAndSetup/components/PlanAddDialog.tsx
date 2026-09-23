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
  FormControl,
  Select,
} from "@mui/material";
import { type TransitionProps } from "@mui/material/transitions";
import CloseIcon from "@mui/icons-material/Close";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import { toast } from "react-toastify";
import { useAddPlanMutation, type AddPlanRequest } from "../api/planApiSlice";

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

interface PlanAddDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  chmDomainOptions?: FilterOption[];
  chmSubDomainOptions?: FilterOption[];
  selectedChmDomain?: number;
  selectedChmSubDomain?: number;
}

interface FormDataState {
  chmDomain: number | "";
  chmSubDomain: number | "";
  networkDomain: string;
  layer: string;
  planType: string;
  vendorOem: string;
  changeImpact: string;
}

// Layer options
const LAYER_OPTIONS = [
  "Access",
  "Aggregation",
  "Core",
  "Backhaul",
  "Transmission",
  "IP/MPLS",
];

// Plan type options
const PLAN_TYPE_OPTIONS = [
  "IMPLEMENTATION",
  "Upgrade",
  "Greenfield",
  "Rollout",
  "Migration",
  "Decommission",
  "Maintenance",
];

// Change impact options (SA, NSA as requested)
const CHANGE_IMPACT_OPTIONS = ["SA", "NSA"];

export const PlanAddDialog: React.FC<PlanAddDialogProps> = ({
  open,
  onClose,
  onSuccess,
  chmDomainOptions = [],
  chmSubDomainOptions = [],
  selectedChmDomain,
  selectedChmSubDomain,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [formData, setFormData] = useState<FormDataState>({
    chmDomain: "",
    chmSubDomain: "",
    networkDomain: "",
    layer: "",
    planType: "",
    vendorOem: "",
    changeImpact: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormDataState, string>>>({});
  const [addPlan, { isLoading: isAdding }] = useAddPlanMutation();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setFormData({
        chmDomain: selectedChmDomain ?? "",
        chmSubDomain: selectedChmSubDomain ?? "",
        networkDomain: "",
        layer: "",
        planType: "",
        vendorOem: "",
        changeImpact: "",
      });
      setErrors({});
    }
  }, [open, selectedChmDomain, selectedChmSubDomain]);

  const handleChange = (key: keyof FormDataState, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear error for this field when user changes it
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormDataState, string>> = {};

    if (!formData.chmDomain) newErrors.chmDomain = "Required";
    if (!formData.chmSubDomain) newErrors.chmSubDomain = "Required";
    if (!formData.networkDomain.trim()) newErrors.networkDomain = "Required";
    if (!formData.layer) newErrors.layer = "Required";
    if (!formData.planType) newErrors.planType = "Required";
    if (!formData.vendorOem.trim()) newErrors.vendorOem = "Required";
    if (!formData.changeImpact) newErrors.changeImpact = "Required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveClick = async () => {
    if (!validateForm()) return;

    try {
      const payload: AddPlanRequest = {
        chmDomain: Number(formData.chmDomain),
        chmSubDomain: Number(formData.chmSubDomain),
        networkDomain: formData.networkDomain.trim(),
        layer: formData.layer,
        planType: formData.planType,
        vendorOem: formData.vendorOem.trim(),
        changeImpact: formData.changeImpact,
      };

      const res = await addPlan(payload).unwrap();
      toast.success(res?.message || "Plan created successfully");

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to add plan:", error);
      try {
        const errMsg =
          (error as any)?.data?.message ||
          (error as any)?.message ||
          "Failed to create plan";
        toast.error(errMsg);
      } catch (e) {
        toast.error("Failed to create plan");
      }
    }
  };

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
                bgcolor: alpha(theme.palette.success.main, 0.1),
                color: "success.main",
                width: 44,
                height: 44,
              }}
            >
              <AddOutlinedIcon fontSize="medium" />
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, fontSize: "1.1rem", lineHeight: 1.2 }}
              >
                Add New Plan
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
              >
                Create a new plan with all required details.
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            disabled={isAdding}
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
          {/* CHM Domain */}
          <Grid size={{ xs: 12, sm: 6 }}>
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
              CHM Domain <span style={{ color: "red" }}>*</span>
            </Typography>
            <FormControl
              fullWidth
              size="small"
              error={!!errors.chmDomain}
            >
              <Select
                value={formData.chmDomain}
                displayEmpty
                onChange={(e) => handleChange("chmDomain", e.target.value)}
                sx={{
                  borderRadius: 2,
                  "& .MuiOutlinedInput-root": {
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
                <MenuItem value="" disabled>
                  Select CHM Domain
                </MenuItem>
                {chmDomainOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {errors.chmDomain && (
              <Typography sx={{ fontSize: 11, color: "error.main", mt: 0.5 }}>
                {errors.chmDomain}
              </Typography>
            )}
          </Grid>

          {/* CHM Sub Domain */}
          <Grid size={{ xs: 12, sm: 6 }}>
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
              CHM Sub Domain <span style={{ color: "red" }}>*</span>
            </Typography>
            <FormControl
              fullWidth
              size="small"
              error={!!errors.chmSubDomain}
              disabled={!formData.chmDomain}
            >
              <Select
                value={formData.chmSubDomain}
                displayEmpty
                onChange={(e) => handleChange("chmSubDomain", e.target.value)}
                sx={{
                  borderRadius: 2,
                  "& .MuiOutlinedInput-root": {
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
                <MenuItem value="" disabled>
                  Select CHM Sub Domain
                </MenuItem>
                {chmSubDomainOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {errors.chmSubDomain && (
              <Typography sx={{ fontSize: 11, color: "error.main", mt: 0.5 }}>
                {errors.chmSubDomain}
              </Typography>
            )}
          </Grid>

          {/* Network Domain */}
          <Grid size={{ xs: 12, sm: 6 }}>
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
              Network Domain <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="e.g. IP Core, Access"
              value={formData.networkDomain}
              onChange={(e) => handleChange("networkDomain", e.target.value)}
              error={!!errors.networkDomain}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
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
            {errors.networkDomain && (
              <Typography sx={{ fontSize: 11, color: "error.main", mt: 0.5 }}>
                {errors.networkDomain}
              </Typography>
            )}
          </Grid>

          {/* Layer */}
          <Grid size={{ xs: 12, sm: 6 }}>
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
              Layer <span style={{ color: "red" }}>*</span>
            </Typography>
            <FormControl
              fullWidth
              size="small"
              error={!!errors.layer}
            >
              <Select
                value={formData.layer}
                displayEmpty
                onChange={(e) => handleChange("layer", e.target.value)}
                sx={{
                  borderRadius: 2,
                  "& .MuiOutlinedInput-root": {
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
                <MenuItem value="" disabled>
                  Select Layer
                </MenuItem>
                {LAYER_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {errors.layer && (
              <Typography sx={{ fontSize: 11, color: "error.main", mt: 0.5 }}>
                {errors.layer}
              </Typography>
            )}
          </Grid>

          {/* Plan Type */}
          <Grid size={{ xs: 12, sm: 6 }}>
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
              Plan Type <span style={{ color: "red" }}>*</span>
            </Typography>
            <FormControl
              fullWidth
              size="small"
              error={!!errors.planType}
            >
              <Select
                value={formData.planType}
                displayEmpty
                onChange={(e) => handleChange("planType", e.target.value)}
                sx={{
                  borderRadius: 2,
                  "& .MuiOutlinedInput-root": {
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
                <MenuItem value="" disabled>
                  Select Plan Type
                </MenuItem>
                {PLAN_TYPE_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {errors.planType && (
              <Typography sx={{ fontSize: 11, color: "error.main", mt: 0.5 }}>
                {errors.planType}
              </Typography>
            )}
          </Grid>

          {/* Vendor OEM */}
          <Grid size={{ xs: 12, sm: 6 }}>
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
              Vendor / OEM <span style={{ color: "red" }}>*</span>
            </Typography>
            <TextField
              fullWidth
              size="small"
              variant="outlined"
              placeholder="e.g. Cisco, Huawei"
              value={formData.vendorOem}
              onChange={(e) => handleChange("vendorOem", e.target.value)}
              error={!!errors.vendorOem}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
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
            {errors.vendorOem && (
              <Typography sx={{ fontSize: 11, color: "error.main", mt: 0.5 }}>
                {errors.vendorOem}
              </Typography>
            )}
          </Grid>

          {/* Change Impact */}
          <Grid size={{ xs: 12, sm: 6 }}>
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
              Change Impact <span style={{ color: "red" }}>*</span>
            </Typography>
            <FormControl
              fullWidth
              size="small"
              error={!!errors.changeImpact}
            >
              <Select
                value={formData.changeImpact}
                displayEmpty
                onChange={(e) => handleChange("changeImpact", e.target.value)}
                sx={{
                  borderRadius: 2,
                  "& .MuiOutlinedInput-root": {
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
                <MenuItem value="" disabled>
                  Select Change Impact
                </MenuItem>
                {CHANGE_IMPACT_OPTIONS.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {errors.changeImpact && (
              <Typography sx={{ fontSize: 11, color: "error.main", mt: 0.5 }}>
                {errors.changeImpact}
              </Typography>
            )}
          </Grid>
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
          disabled={isAdding}
          sx={{ fontWeight: 600, px: 3, borderRadius: 2 }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveClick}
          variant="contained"
          color="success"
          startIcon={
            isAdding ? (
              <CircularProgress size={20} />
            ) : (
              <SaveOutlinedIcon />
            )
          }
          disabled={isAdding}
          disableElevation
          sx={{
            fontWeight: 600,
            px: 3,
            borderRadius: 2,
            textTransform: "none",
          }}
        >
          {isAdding ? "Creating..." : "Create Plan"}
        </Button>
      </Box>
    </Dialog>
  );
};
