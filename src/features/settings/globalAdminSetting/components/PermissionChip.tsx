import React from "react";
import { Box, Tooltip, alpha } from "@mui/material";
import { CheckOutlined, CloseOutlined } from "@mui/icons-material";
import type { useTabColorTokens } from "../../../../style/theme";

interface PermissionChipProps {
  permissionName: string;
  permissionCode: string;
  granted: boolean;
  loading: boolean;
  onClick: () => void;
  onRemove: () => void;
  c: ReturnType<typeof useTabColorTokens>;
}

export const PermissionChip: React.FC<PermissionChipProps> = ({
  permissionName,
  permissionCode,
  granted,
  loading,
  onClick,
  onRemove,
  c,
}) => (
  <Box sx={{ position: "relative", display: "inline-flex", "&:hover .perm-remove-btn": { opacity: 1 } }}>
    <Tooltip
      title={
        <Box>
          <Box sx={{ fontWeight: 700, mb: 0.25 }}>{granted ? "Click to disable" : "Click to enable"}</Box>
          <Box sx={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.7rem", opacity: 0.8 }}>
            code: {permissionCode}
          </Box>
        </Box>
      }
      placement="top"
      arrow
    >
      <Box
        component="button"
        onClick={onClick}
        disabled={loading}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          height: 32,
          px: "11px",
          pr: "26px",
          borderRadius: "8px",
          border: `1px solid ${granted ? alpha(c.accent, 0.5) : c.border}`,
          bgcolor: granted ? alpha(c.accent, 0.1) : c.surface,
          color: granted ? c.accent : c.textSecondary,
          fontSize: "0.8rem",
          fontWeight: granted ? 600 : 400,
          cursor: loading ? "wait" : "pointer",
          opacity: loading ? 0.55 : 1,
          transition: "all 0.12s",
          fontFamily: "inherit",
          letterSpacing: "-0.005em",
          flexShrink: 0,
          "&:hover:not(:disabled)": {
            border: `1px solid ${alpha(c.accent, 0.6)}`,
            bgcolor: alpha(c.accent, granted ? 0.18 : 0.07),
            color: c.accent,
          },
        }}
      >
        <Box
          sx={{
            width: 15,
            height: 15,
            borderRadius: "4px",
            border: `1.5px solid ${granted ? c.accent : alpha(c.textSecondary, 0.4)}`,
            bgcolor: granted ? c.accent : "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.1s",
          }}
        >
          {loading ? (
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                border: `1.5px solid ${c.accent}`,
                borderTopColor: "transparent",
                animation: "spin 0.6s linear infinite",
                "@keyframes spin": { to: { transform: "rotate(360deg)" } },
              }}
            />
          ) : (
            granted && <CheckOutlined sx={{ fontSize: 10, color: "#fff" }} />
          )}
        </Box>

        <span>{permissionName}</span>

        <Box
          component="span"
          sx={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "0.6rem",
            px: "4px",
            py: "1px",
            borderRadius: "3px",
            bgcolor: granted ? alpha(c.accent, 0.15) : c.isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
            color: granted ? c.accent : c.textDim,
            letterSpacing: "0.03em",
            lineHeight: 1,
          }}
        >
          {permissionCode}
        </Box>
      </Box>
    </Tooltip>

    <Tooltip title="Disable & hide from this view (no delete endpoint exists — it stays disabled server-side)" placement="top">
      <Box
        component="button"
        className="perm-remove-btn"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        sx={{
          position: "absolute",
          top: "50%",
          right: 4,
          transform: "translateY(-50%)",
          width: 18,
          height: 18,
          borderRadius: "4px",
          border: "none",
          bgcolor: c.isDark ? "rgba(255,255,255,0.08)" : "rgba(13,27,42,0.06)",
          color: c.textDim,
          cursor: "pointer",
          opacity: 0,
          transition: "opacity 0.12s, background 0.1s, color 0.1s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "&:hover": { bgcolor: alpha(c.danger ?? "#e53935", 0.18), color: c.danger },
        }}
      >
        <CloseOutlined sx={{ fontSize: 11 }} />
      </Box>
    </Tooltip>
  </Box>
);
