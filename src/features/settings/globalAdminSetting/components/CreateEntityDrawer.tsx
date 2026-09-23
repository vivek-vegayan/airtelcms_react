import React, { useEffect, useState } from "react";
import { Box, Divider, Drawer, Typography } from "@mui/material";
import { CloseOutlined } from "@mui/icons-material";
import type { useTabColorTokens } from "../../../../style/theme";
import type { RoleModel } from "../api/globalSettingsPermissionApi";
import type { DrawerState } from "../types/permissionTypes";
import { ROLE_LABEL } from "../constants/roleLabels";
import { slug } from "../utils/permissionUtils";

interface CreateEntityDrawerProps {
  open: boolean;
  state: DrawerState | null;
  roles: RoleModel[];
  onClose: () => void;
  onCreateRole: (roleCode: string, copiedRoleId?: number) => Promise<void>;
  onCreateModule: (moduleCode: string) => Promise<void>;
  onCreateSubModule: (subModuleCode: string, moduleId: number) => Promise<void>;
  onRenameRole: (roleId: number, newLabel: string) => Promise<void>;
  onRenameModule: (moduleId: number, newLabel: string) => Promise<void>;
  onRenameSubModule: (subModuleId: number, newLabel: string) => Promise<void>;
  c: ReturnType<typeof useTabColorTokens>;
}

export const CreateEntityDrawer: React.FC<CreateEntityDrawerProps> = ({
  open,
  state,
  roles,
  onClose,
  onCreateRole,
  onCreateModule,
  onCreateSubModule,
  onRenameRole,
  onRenameModule,
  onRenameSubModule,
  c,
}) => {
  const [label, setLabel] = useState("");
  const [copyFromRoleId, setCopyFromRoleId] = useState<number | "">("");
  const [submitting, setSubmitting] = useState(false);

  const isRename = state?.mode === "rename";

  useEffect(() => {
    if (!open || !state) return;
    setLabel(state.mode === "rename" ? (state.initialLabel ?? "") : "");
    setCopyFromRoleId(state.presetCopyFromRoleId ?? "");
  }, [open, state]);

  const titleMap: Record<DrawerState["kind"], string> = {
    role: isRename ? "Rename Role" : "Create Role",
    module: isRename ? "Rename Module" : "Create Module",
    "sub-module": isRename ? "Rename Sub-module" : "Add Sub-module",
  };

  const placeholderMap: Record<DrawerState["kind"], string> = {
    role: "e.g. Regional Manager",
    module: "e.g. Reports",
    "sub-module": "e.g. Monthly Summary",
  };

  const handleSubmit = async () => {
    const trimmed = label.trim();
    if (!trimmed || !state || submitting) return;
    setSubmitting(true);
    try {
      if (isRename) {
        if (state.entityId == null) return;
        switch (state.kind) {
          case "role":
            await onRenameRole(state.entityId, trimmed);
            break;
          case "module":
            await onRenameModule(state.entityId, trimmed);
            break;
          case "sub-module":
            await onRenameSubModule(state.entityId, trimmed);
            break;
        }
      } else {
        switch (state.kind) {
          case "role":
            await onCreateRole(trimmed, copyFromRoleId === "" ? undefined : copyFromRoleId);
            break;
          case "module":
            await onCreateModule(trimmed);
            break;
          case "sub-module":
            if (state.contextModuleId != null) await onCreateSubModule(trimmed, state.contextModuleId);
            break;
        }
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

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 400, bgcolor: c.surface, borderLeft: `1px solid ${c.border}`, display: "flex", flexDirection: "column" } }}
    >
      <Box sx={{ px: 2.5, py: 2.25, borderBottom: `1px solid ${c.border}`, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Typography fontSize="1rem" fontWeight={600} color={c.textPrimary} letterSpacing="-0.015em">
          {state ? titleMap[state.kind] : ""}
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
        <Typography component="label" fontSize="0.72rem" fontWeight={600} color={c.textSecondary} display="block" mb={0.75}>
          Display name
        </Typography>
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={state ? placeholderMap[state.kind] : "Enter name…"}
          style={{
            width: "100%",
            border: `1px solid ${c.border}`,
            borderRadius: 6,
            padding: "8px 10px",
            fontSize: "0.85rem",
            fontFamily: "inherit",
            background: c.surface,
            color: c.textPrimary,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <Typography fontSize="0.68rem" color={c.textDim} mt={0.5}>
          Stored as key{" "}
          <Box component="span" sx={{ fontFamily: "'JetBrains Mono', monospace", color: c.textSecondary }}>
            {slug(label) || "…"}
          </Box>
        </Typography>

        {state?.kind === "role" && !isRename && (
          <>
            <Divider sx={{ borderColor: c.border, my: 2 }} />
            <Typography fontSize="0.72rem" fontWeight={600} color={c.textSecondary} display="block" mb={0.75}>
              Copy permissions from (optional)
            </Typography>
            <select
              value={copyFromRoleId}
              onChange={(e) => setCopyFromRoleId(e.target.value ? Number(e.target.value) : "")}
              style={{
                width: "100%",
                border: `1px solid ${c.border}`,
                borderRadius: 6,
                padding: "8px 10px",
                fontSize: "0.82rem",
                fontFamily: "inherit",
                background: c.surface,
                color: c.textPrimary,
                outline: "none",
                cursor: "pointer",
                boxSizing: "border-box",
              }}
            >
              <option value="">— Start blank —</option>
              {roles.map((r) => (
                <option key={r.roleId} value={r.roleId}>
                  {ROLE_LABEL[r.roleCode] ?? r.roleCode}
                </option>
              ))}
            </select>
          </>
        )}
      </Box>

      <Box sx={{ px: 2.5, py: 1.75, borderTop: `1px solid ${c.border}`, display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <Box component="button" onClick={onClose} sx={{ ...btnSx, bgcolor: "transparent", color: c.textSecondary }}>
          Cancel
        </Box>
        <Box
          component="button"
          onClick={handleSubmit}
          disabled={!label.trim() || submitting}
          sx={{
            ...btnSx,
            border: `1px solid ${c.textPrimary}`,
            bgcolor: c.textPrimary,
            color: c.bg,
            opacity: label.trim() && !submitting ? 1 : 0.45,
            cursor: label.trim() && !submitting ? "pointer" : "not-allowed",
          }}
        >
          {submitting ? (isRename ? "Renaming…" : "Creating…") : isRename ? "Rename" : "Create"}
        </Box>
      </Box>
    </Drawer>
  );
};
