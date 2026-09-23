import React, { useEffect, useState } from "react";
import { Box, Drawer, Typography } from "@mui/material";
import { CloseOutlined } from "@mui/icons-material";
import type { useTabColorTokens } from "../../../../style/theme";
import { LEVEL_LABEL, type OrgDrawerState } from "../types/orgConfigTypes";

interface CreateEditEntityDrawerProps {
  open: boolean;
  state: OrgDrawerState | null;
  onClose: () => void;
  onCreate: (code: string, name: string) => Promise<void>;
  onUpdate: (entityId: number, code: string, name: string) => Promise<void>;
  c: ReturnType<typeof useTabColorTokens>;
}

const CODE_MAX = 20;
const NAME_MAX = 50;

export const CreateEditEntityDrawer: React.FC<CreateEditEntityDrawerProps> = ({
  open,
  state,
  onClose,
  onCreate,
  onUpdate,
  c,
}) => {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isEdit = state?.mode === "edit";

  useEffect(() => {
    if (!open || !state) return;
    setCode(state.mode === "edit" ? (state.initialCode ?? "") : "");
    setName(state.mode === "edit" ? (state.initialName ?? "") : "");
  }, [open, state]);

  const trimmedCode = code.trim();
  const trimmedName = name.trim();
  const isValid = trimmedCode.length > 0 && trimmedName.length > 0;

  const handleSubmit = async () => {
    if (!isValid || !state || submitting) return;
    setSubmitting(true);
    try {
      if (isEdit) {
        if (state.entityId == null) return;
        await onUpdate(state.entityId, trimmedCode, trimmedName);
      } else {
        await onCreate(trimmedCode, trimmedName);
      }
    } finally {
      setSubmitting(false);
      onClose();
    }
  };

  const btnSx = {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    height: 32,
    px: "13px",
    borderRadius: "7px",
    fontSize: "0.8rem",
    fontWeight: 500,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "all 0.1s",
    border: `1px solid ${c.border}`,
  };

  const inputSx = {
    width: "100%",
    border: `1px solid ${c.border}`,
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: "0.85rem",
    fontFamily: "inherit",
    background: c.surface,
    color: c.textPrimary,
    outline: "none",
    boxSizing: "border-box" as const,
  };

  const levelLabel = state ? LEVEL_LABEL[state.level] : "";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 400, bgcolor: c.surface, borderLeft: `1px solid ${c.border}`, display: "flex", flexDirection: "column" } }}
    >
      <Box sx={{ px: 2.5, py: 2.25, borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Typography fontSize="1rem" fontWeight={600} color={c.textPrimary} letterSpacing="-0.015em">
          {isEdit ? `Edit ${levelLabel}` : `Add ${levelLabel}`}
        </Typography>
        <Box flex={1} />
        <Box
          component="button"
          onClick={onClose}
          sx={{
            width: 28,
            height: 28,
            border: "none",
            borderRadius: "6px",
            bgcolor: "transparent",
            color: c.textSecondary,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "&:hover": { bgcolor: c.isDark ? "rgba(255,255,255,0.06)" : "rgba(13,27,42,0.05)" },
          }}
        >
          <CloseOutlined sx={{ fontSize: 16 }} />
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2.5, py: 2.5 }}>
        {state?.mode === "create" && state.parentLabel && (
          <Typography fontSize="0.75rem" color={c.textSecondary} mb={2}>
            Under <strong>{state.parentLabel}</strong>
          </Typography>
        )}

        <Typography component="label" fontSize="0.72rem" fontWeight={600} color={c.textSecondary} display="block" mb={0.75}>
          Code
        </Typography>
        <input
          autoFocus
          value={code}
          onChange={(e) =>
            setCode(
              e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9_]/g, "")
                .slice(0, CODE_MAX),
            )
          }
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="e.g. NOC"
          maxLength={CODE_MAX}
          style={inputSx}
        />
        <Typography fontSize="0.68rem" color={c.textDim} mt={0.5} mb={2}>
          {trimmedCode.length}/{CODE_MAX} — stored uppercase, must be unique among siblings
        </Typography>

        <Typography component="label" fontSize="0.72rem" fontWeight={600} color={c.textSecondary} display="block" mb={0.75}>
          Name
        </Typography>
        <input
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="e.g. Network Operations Center"
          maxLength={NAME_MAX}
          style={inputSx}
        />
        <Typography fontSize="0.68rem" color={c.textDim} mt={0.5}>
          {trimmedName.length}/{NAME_MAX}
        </Typography>
      </Box>

      <Box sx={{ px: 2.5, py: 1.75, borderTop: `1px solid ${c.border}`, display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <Box component="button" onClick={onClose} sx={{ ...btnSx, bgcolor: "transparent", color: c.textSecondary }}>
          Cancel
        </Box>
        <Box
          component="button"
          onClick={handleSubmit}
          sx={{
            ...btnSx,
            border: `1px solid ${c.textPrimary}`,
            bgcolor: c.textPrimary,
            color: c.bg,
            opacity: isValid && !submitting ? 1 : 0.45,
            cursor: isValid && !submitting ? "pointer" : "not-allowed",
          }}
        >
          {submitting ? (isEdit ? "Saving…" : "Creating…") : isEdit ? "Save" : "Create"}
        </Box>
      </Box>
    </Drawer>
  );
};
