import React, { useState } from "react";
import { Box, CircularProgress, Popover, Typography, alpha } from "@mui/material";
import { AddOutlined } from "@mui/icons-material";
import type { useTabColorTokens } from "../../../../style/theme";
import type { ModuleModel } from "../api/globalSettingsPermissionApi";

interface AddModulePopoverProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  loading: boolean;
  availableModules: ModuleModel[];
  onClose: () => void;
  onSelect: (module: ModuleModel) => void;
  /** Create a brand-new module (owned by the active role) instead of fetching an existing one. */
  onCreate: (moduleName: string) => void | Promise<void>;
  c: ReturnType<typeof useTabColorTokens>;
}

export const AddModulePopover: React.FC<AddModulePopoverProps> = ({
  anchorEl,
  open,
  loading,
  availableModules,
  onClose,
  onSelect,
  onCreate,
  c,
}) => {
  const [newModuleName, setNewModuleName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    const trimmed = newModuleName.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      await onCreate(trimmed);
      setNewModuleName("");
      onClose();
    } finally {
      setCreating(false);
    }
  };

  return (
  <Popover
    open={open}
    anchorEl={anchorEl}
    onClose={onClose}
    anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
    transformOrigin={{ vertical: "top", horizontal: "left" }}
    PaperProps={{
      sx: {
        mt: 0.5,
        bgcolor: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: "8px",
        boxShadow: c.isDark ? "0 12px 30px -12px rgba(0,0,0,0.5)" : "0 12px 30px -12px rgba(13,27,42,0.2)",
        minWidth: 240,
        maxHeight: 320,
        overflow: "hidden",
      },
    }}
  >
    <Box sx={{ px: 1.5, py: 1, borderBottom: `1px solid ${c.border}` }}>
      <Typography fontSize="0.65rem" fontWeight={700} color={c.textDim} letterSpacing="0.08em" textTransform="uppercase">
        Fetch From Database
      </Typography>
    </Box>
    <Box sx={{ maxHeight: 200, overflowY: "auto", py: 0.5 }}>
      {loading ? (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress size={16} sx={{ color: c.accent }} />
        </Box>
      ) : availableModules.length === 0 ? (
        <Typography fontSize="0.78rem" color={c.textDim} fontStyle="italic" px={1.5} py={2} textAlign="center">
          Every catalog module is already assigned to this role.
        </Typography>
      ) : (
        availableModules.map((m) => (
          <Box
            key={m.moduleId}
            component="button"
            onClick={() => {
              onSelect(m);
              onClose();
            }}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              width: "100%",
              px: 1.5,
              py: 1,
              border: "none",
              bgcolor: "transparent",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.1s",
              "&:hover": { bgcolor: alpha(c.accent, 0.08) },
            }}
          >
            <AddOutlined sx={{ fontSize: 13, color: c.accent }} />
            <Typography fontSize="0.82rem" color={c.textPrimary} fontWeight={500} sx={{ flex: 1 }}>
              {m.moduleName}
            </Typography>
          </Box>
        ))
      )}
    </Box>

    <Box sx={{ px: 1.5, py: 1.25, borderTop: `1px solid ${c.border}`, display: "flex", gap: "6px" }}>
      <input
        value={newModuleName}
        onChange={(e) => setNewModuleName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        placeholder="Create new module…"
        style={{
          flex: 1,
          minWidth: 0,
          border: `1px solid ${c.border}`,
          borderRadius: 6,
          padding: "6px 8px",
          fontSize: "0.78rem",
          fontFamily: "inherit",
          background: c.surface,
          color: c.textPrimary,
          outline: "none",
        }}
      />
      <Box
        component="button"
        onClick={handleCreate}
        disabled={!newModuleName.trim() || creating}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          px: "10px",
          borderRadius: "6px",
          border: `1px solid ${c.border}`,
          bgcolor: "transparent",
          color: c.textSecondary,
          fontSize: "0.75rem",
          fontFamily: "inherit",
          cursor: newModuleName.trim() && !creating ? "pointer" : "not-allowed",
          opacity: newModuleName.trim() && !creating ? 1 : 0.5,
          "&:hover:not(:disabled)": { bgcolor: alpha(c.accent, 0.08), color: c.accent, border: `1px solid ${alpha(c.accent, 0.3)}` },
        }}
      >
        <AddOutlined sx={{ fontSize: 12 }} />
        {creating ? "Creating…" : "Create"}
      </Box>
    </Box>
  </Popover>
  );
};
