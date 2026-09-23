import React from "react";
import { Box, Typography, alpha } from "@mui/material";
import {
  ShieldOutlined,
  ViewModuleOutlined,
  WarningAmberOutlined,
  ErrorOutlineOutlined,
  RefreshOutlined,
} from "@mui/icons-material";
import type { useTabColorTokens } from "../../../../style/theme";
import { extractErrorStatus, extractApiErrorMessage } from "../utils/permissionUtils";

interface PermissionsErrorStateProps {
  error: unknown;
  roleName: string;
  moduleName: string;
  onRetry: () => void;
  c: ReturnType<typeof useTabColorTokens>;
}

export const PermissionsErrorState: React.FC<PermissionsErrorStateProps> = ({
  error,
  roleName,
  moduleName,
  onRetry,
  c,
}) => {
  const statusCode = extractErrorStatus(error);
  const apiMessage = extractApiErrorMessage(error, "An unexpected error occurred while loading permissions.");
  const is500 = statusCode === 500;

  const icon = is500 ? (
    <WarningAmberOutlined sx={{ fontSize: 18, color: c.danger }} />
  ) : (
    <ErrorOutlineOutlined sx={{ fontSize: 18, color: c.danger }} />
  );

  const title = is500
    ? "Permissions Not Configured"
    : statusCode === 403
      ? "Access Denied"
      : statusCode === 404
        ? "Not Found"
        : "Failed to Load Permissions";

  const hint = is500
    ? "This role–module combination has no permission records in the database. Contact your administrator to set up permissions."
    : statusCode === 403
      ? "You don't have access to view permissions for this combination."
      : statusCode === 404
        ? "The requested resource could not be found."
        : "Check your network connection or try again in a moment.";

  return (
    <Box
      sx={{
        borderRadius: "12px",
        border: `1px solid ${alpha(c.danger, 0.25)}`,
        bgcolor: c.isDark ? alpha(c.danger, 0.05) : alpha(c.danger, 0.03),
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box sx={{ height: 3, background: `linear-gradient(90deg, ${c.danger}, ${alpha(c.danger, 0.4)})` }} />
      <Box sx={{ px: 3, py: 3 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "10px",
              bgcolor: alpha(c.danger, 0.1),
              border: `1px solid ${alpha(c.danger, 0.2)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 0.5 }}>
              <Typography fontSize="0.9rem" fontWeight={600} color={c.danger} letterSpacing="-0.01em">
                {title}
              </Typography>
              {statusCode && (
                <Box
                  sx={{
                    px: "7px",
                    py: "2px",
                    borderRadius: "5px",
                    bgcolor: alpha(c.danger, 0.1),
                    border: `1px solid ${alpha(c.danger, 0.2)}`,
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: c.danger,
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.02em",
                  }}
                >
                  {statusCode}
                </Box>
              )}
            </Box>
            <Typography fontSize="0.8rem" color={c.textSecondary} lineHeight={1.6}>
              {apiMessage}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 1,
            borderRadius: "8px",
            bgcolor: c.isDark ? "rgba(255,255,255,0.03)" : "rgba(13,27,42,0.025)",
            border: `1px solid ${c.border}`,
            mb: 2.5,
            flexWrap: "wrap",
          }}
        >
          <ShieldOutlined sx={{ fontSize: 12, color: c.textDim }} />
          <Typography fontSize="0.72rem" color={c.textSecondary} fontWeight={500}>
            {roleName}
          </Typography>
          <Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: c.border }} />
          <ViewModuleOutlined sx={{ fontSize: 12, color: c.textDim }} />
          <Typography fontSize="0.72rem" color={c.textSecondary} fontWeight={500}>
            {moduleName}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1,
            px: 1.5,
            py: 1.25,
            borderRadius: "8px",
            bgcolor: c.isDark ? "rgba(255,255,255,0.025)" : "rgba(13,27,42,0.02)",
            border: `1px dashed ${c.border}`,
            mb: 2.5,
          }}
        >
          <Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: c.textDim, mt: "7px", flexShrink: 0 }} />
          <Typography fontSize="0.75rem" color={c.textDim} lineHeight={1.6}>
            {hint}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Box
            component="button"
            onClick={onRetry}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              height: 32,
              px: "13px",
              borderRadius: "7px",
              fontSize: "0.78rem",
              fontWeight: 500,
              fontFamily: "inherit",
              cursor: "pointer",
              border: `1px solid ${alpha(c.danger, 0.4)}`,
              bgcolor: alpha(c.danger, 0.08),
              color: c.danger,
              transition: "all 0.1s",
              letterSpacing: "-0.005em",
              "&:hover": { bgcolor: alpha(c.danger, 0.14), border: `1px solid ${alpha(c.danger, 0.55)}` },
              "&:active": { transform: "scale(0.98)" },
            }}
          >
            <RefreshOutlined sx={{ fontSize: 13 }} />
            Retry
          </Box>
          <Typography fontSize="0.7rem" color={c.textDim}>
            or select a different role / module combination
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
