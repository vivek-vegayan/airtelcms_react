import { useState } from "react";
import {
  alpha,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { type InboxItem } from "./TaskInbox";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { formatModuleName } from "../utils/formatModuleName";
import { AppScrollView } from "../../../components/ui/AppScrollView";
import { useNotificationAction } from "../hooks/useNotificationAction";
import { authStorage } from "../../../app/store/auth.storage";
import { toast } from "react-toastify";
import {
  decisionTypeLabel,
  deriveNotificationDecisionType,
} from "../utils/notificationType";
import { getSubModuleActionMeta } from "../config/notificationActionConfig";
import { RejectRemarksDialog } from "./RejectRemarksDialog";
import { ApproveConfirmDialog } from "./ApproveConfirmDialog";

export const DetailView = ({
  activeItem,
  onBack,
}: {
  activeItem: InboxItem | undefined;
  onBack: () => void;
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const loggedUser = authStorage.getUser();
  const roleName = loggedUser?.roleCode ?? "TEAM_MEMBER";
  const { handleAction, isLoading } = useNotificationAction();
  const currentUserRole = roleName;
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  if (!activeItem) {
    return (
      <Stack
        flex={1}
        alignItems="center"
        justifyContent="center"
        gap={1.5}
        bgcolor="background.default"
      >
        <CheckCircleOutlineIcon sx={{ fontSize: 48, color: "text.disabled" }} />
        <Typography fontSize="0.875rem" color="text.disabled" fontWeight={500}>
          Select an item to view details
        </Typography>
      </Stack>
    );
  }

  const processResponse = (res: any, action?: string) => {
    let data = typeof res === "string" ? JSON.parse(res) : res;
    if (data && typeof data === "object" && !data.status) {
      data = data.data || data;
    }
    if (data?.status === "Success" || data?.status === "SUCCESS") {
      const successMessage = data?.message?.trim()
        ? data.message
        : getDefaultSuccessMessage(action);
      toast.success(successMessage, { autoClose: 3000 });
      onBack();
    } else {
      const errorMessage =
        data?.message || "Operation failed. Please try again.";
      toast.error(errorMessage, { autoClose: 3000 });
    }
  };

  const getDefaultSuccessMessage = (action?: string): string => {
    switch (action) {
      case "APPROVED":
        return "Request approved successfully";
      case "REJECTED":
        return "Request rejected successfully";
      case "ACKNOWLEDGE":
        return "Request acknowledged successfully";
      default:
        return "Operation completed successfully";
    }
  };

  const onApprove = async () => {
    if (!activeItem) return;
    try {
      const res = await handleAction(activeItem, "APPROVED", currentUserRole);
      setApproveDialogOpen(false);
      processResponse(res, "APPROVED");
    } catch (err: any) {
      setApproveDialogOpen(false);
      toast.error(
        err?.data?.message || err?.message || "Failed to approve request",
      );
    }
  };

  const onReject = async (remark: string, reasonText?: string) => {
    if (!activeItem) return;
    try {
      const res = await handleAction(activeItem, "REJECTED", currentUserRole, {
        reason: remark,
        reasonText,
      });
      setRejectDialogOpen(false);
      processResponse(res, "REJECTED");
    } catch (err: any) {
      setRejectDialogOpen(false);
      toast.error(
        err?.data?.message || err?.message || "Failed to reject request",
      );
    }
  };

  const onAcknowledge = async () => {
    if (!activeItem) return;
    try {
      const res = await handleAction(
        activeItem,
        "ACKNOWLEDGE",
        currentUserRole,
      );
      processResponse(res, "ACKNOWLEDGE");
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || "Failed to acknowledge",
      );
    }
  };

  const decisionType = deriveNotificationDecisionType(activeItem.originalData);
  const isActionable = decisionType === "APPROVAL_REQUIRED";
  const actionMeta = getSubModuleActionMeta(activeItem.originalData.subModule);

  return (
    <Stack sx={{ height: "100%", overflow: "hidden" }}>
      {/* Detail Header */}
      <Box
        sx={{
          px: 2,
          pt: 1.5,
          pb: 1.5,
          borderBottom: `1px solid ${theme.palette.divider}`,
          bgcolor: "background.paper",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          mb={1}
        >
          <Stack direction="row" alignItems="center" gap={0.75}>
            <IconButton
              onClick={onBack}
              size="small"
              sx={{ display: { md: "none" }, mr: 0.25 }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <Chip
              label={formatModuleName(activeItem.displayModule)}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 22,
                color: "primary.main",
                bgcolor: alpha(
                  theme.palette.primary.main,
                  isDark ? 0.18 : 0.08,
                ),
                "& .MuiChip-label": { px: 1 },
              }}
            />
            {/* Chip label is driven by the derived decision type - not just a boolean */}
            <Chip
              label={decisionTypeLabel(decisionType)}
              size="small"
              sx={{
                fontWeight: 600,
                fontSize: "0.7rem",
                height: 22,
                color:
                  decisionType === "APPROVAL_REQUIRED"
                    ? isDark
                      ? "warning.light"
                      : "warning.dark"
                    : decisionType === "APPROVAL_COMPLETED"
                      ? isDark
                        ? "success.light"
                        : "success.dark"
                      : "text.secondary",
                bgcolor: alpha(
                  decisionType === "APPROVAL_REQUIRED"
                    ? theme.palette.warning.main
                    : decisionType === "APPROVAL_COMPLETED"
                      ? theme.palette.success.main
                      : theme.palette.text.secondary,
                  isDark ? 0.18 : 0.08,
                ),
                "& .MuiChip-label": { px: 1 },
              }}
            />
          </Stack>
          <IconButton size="small" sx={{ color: "text.secondary" }}>
            <MoreHorizIcon fontSize="small" />
          </IconButton>
        </Stack>

        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "1rem",
            lineHeight: 1.35,
            color: "text.primary",
            mb: 0.5,
          }}
        >
          {activeItem.shortTitle}
        </Typography>

        <Typography sx={{ fontSize: "0.75rem", color: "text.disabled" }}>
          Received{" "}
          <Box component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>
            {activeItem.date}
          </Box>{" "}
          at{" "}
          <Box component="span" sx={{ color: "text.secondary", fontWeight: 500 }}>
            {activeItem.time}
          </Box>
        </Typography>
      </Box>

      {/* Message body */}
      <AppScrollView
        sx={{
          flex: 1,
          overflow: "auto",
          p: { xs: 1.5, md: 2.5 },
          bgcolor: isDark ? "#111" : "#f5f6f8",
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 2.5 },
            borderRadius: "10px",
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: "background.paper",
          }}
        >
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: "text.primary",
              whiteSpace: "pre-wrap",
              lineHeight: 1.75,
            }}
          >
            {activeItem.message}
          </Typography>
        </Paper>
      </AppScrollView>

      {/* Action Footer */}
      <Box
        sx={{
          px: 2,
          py: 3,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: isDark ? "#161616" : "#fafafa",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Typography
          fontSize="0.75rem"
          color="text.disabled"
          sx={{ flexShrink: 0 }}
        >
          {isActionable
            ? "Review and take action"
            : decisionType === "APPROVAL_COMPLETED"
              ? "This request has already been decided"
              : "No action required"}
        </Typography>

        {isActionable ? (
          actionMeta ? (
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Button
                variant="outlined"
                color="error"
                size="small"
                disabled={isLoading}
                onClick={() => setRejectDialogOpen(true)}
                sx={{
                  py: 0.6,
                  px: 1.5,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  textTransform: "none",
                  borderRadius: "7px",
                  minWidth: 0,
                }}
              >
                Reject
              </Button>

              <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

              <Button
                variant="contained"
                color="success"
                size="small"
                disabled={isLoading}
                startIcon={
                  isLoading ? (
                    <CircularProgress size={12} color="inherit" />
                  ) : null
                }
                onClick={() => setApproveDialogOpen(true)}
                sx={{
                  py: 0.6,
                  px: 1.5,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  textTransform: "none",
                  borderRadius: "7px",
                  boxShadow: "none",
                  minWidth: 0,
                  "&:hover": { boxShadow: "none" },
                }}
              >
                {isLoading ? "Approving…" : "Approve"}
              </Button>
            </Stack>
          ) : (
            <Button
              variant="contained"
              color="primary"
              size="small"
              disableElevation
              disabled={isLoading}
              onClick={onAcknowledge}
              sx={{
                py: 0.6,
                px: 1.75,
                fontWeight: 600,
                fontSize: "0.75rem",
                textTransform: "none",
                borderRadius: "7px",
                minWidth: 0,
              }}
            >
              {isLoading ? "Marking…" : "Mark as Read"}
            </Button>
          )
        ) : (
          <Button
            variant="contained"
            color="primary"
            size="small"
            disableElevation
            disabled={isLoading}
            onClick={onAcknowledge}
            sx={{
              py: 0.6,
              px: 1.75,
              fontWeight: 600,
              fontSize: "0.75rem",
              textTransform: "none",
              borderRadius: "7px",
              minWidth: 0,
            }}
          >
            {isLoading ? "Marking…" : "Mark as Read"}
          </Button>
        )}
      </Box>

      <ApproveConfirmDialog
        open={approveDialogOpen}
        title={`Approve "${activeItem.shortTitle}"`}
        isLoading={isLoading}
        onCancel={() => setApproveDialogOpen(false)}
        onConfirm={onApprove}
      />

      {actionMeta && (
        <RejectRemarksDialog
          open={rejectDialogOpen}
          title={`Reject "${activeItem.shortTitle}"`}
          rejectInput={actionMeta.rejectInput}
          isLoading={isLoading}
          onCancel={() => setRejectDialogOpen(false)}
          onConfirm={onReject}
        />
      )}
    </Stack>
  );
};
