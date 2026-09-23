import React, { useState } from "react";
import { useTheme } from "@mui/material/styles";
import {
  Box,
  Typography,
  InputBase,
  CircularProgress,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  alpha,
} from "@mui/material";
import {
  ShieldOutlined,
  ViewModuleOutlined,
  SearchOutlined,
  AddOutlined,
  ContentCopyOutlined,
  LockOutlined,
  LockOpenOutlined,
  SelectAllOutlined,
  DeselectOutlined,
  RestartAltOutlined,
  BlockOutlined,
  DriveFileRenameOutlineOutlined,
  DeleteOutlineOutlined,
} from "@mui/icons-material";
import { useTabColorTokens } from "../../../style/theme";
import { useGlobalPermissionsController } from "./hooks/useGlobalPermissionsController";
import { ROLE_LABEL } from "./constants/roleLabels";
import { RailItem } from "./components/RailItem";
import { SubModuleCard } from "./components/SubModuleCard";
import { PermissionsErrorState } from "./components/PermissionsErrorState";
import { CreateEntityDrawer } from "./components/CreateEntityDrawer";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { AddModulePopover } from "./components/AddModulePopover";

export const AdminSettingDashboard: React.FC = () => {
  const theme = useTheme();
  const c = useTabColorTokens(theme);
  const s = useGlobalPermissionsController();
  const [fetchModuleAnchor, setFetchModuleAnchor] = useState<HTMLElement | null>(null);

  const railSx = {
    width: 256,
    flexShrink: 0,
    bgcolor: c.surface,
    borderRight: `1px solid ${c.border}`,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  } as const;
  const railHeadSx = {
    px: 2,
    pt: 2,
    pb: 1.25,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  } as const;
  const searchInputSx = {
    mx: 1.5,
    mb: 1,
    px: 1.25,
    py: 0.75,
    borderRadius: "6px",
    border: `1px solid ${c.border}`,
    bgcolor: c.isDark ? "rgba(255,255,255,0.03)" : "rgba(13,27,42,0.025)",
    display: "flex",
    alignItems: "center",
    gap: 1,
    "&:focus-within": {
      border: `1px solid ${c.accent}`,
      boxShadow: `0 0 0 3px ${alpha(c.accent, 0.12)}`,
    },
  } as const;
  const iconBtnSx = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    borderRadius: "6px",
    border: `1px solid ${c.border}`,
    bgcolor: "transparent",
    color: c.textSecondary,
    cursor: "pointer",
    transition: "all 0.1s",
    "&:hover": {
      bgcolor: c.accentDim,
      color: c.accent,
      border: `1px solid ${c.accentBorder}`,
    },
  } as const;
  const btnSx = {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    height: 30,
    px: "11px",
    borderRadius: "7px",
    fontSize: "0.78rem",
    fontWeight: 500,
    fontFamily: "inherit",
    cursor: "pointer",
    letterSpacing: "-0.005em",
    transition: "all 0.1s",
  } as const;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateRows: "0px 1fr",
        height: "80vh",
        bgcolor: c.bg,
        overflow: "hidden",
      }}
    >
      <Box />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "256px 236px 1fr",
          overflow: "hidden",
        }}
      >
        {/* ── Rail 1: Roles ── */}
        <Box sx={railSx}>
          <Box sx={railHeadSx}>
            <Typography
              fontSize="0.68rem"
              fontWeight={700}
              color={c.textDim}
              letterSpacing="0.08em"
              textTransform="uppercase"
            >
              Roles
            </Typography>
            <Box
              component="button"
              sx={iconBtnSx}
              onClick={() => s.setDrawerState({ kind: "role" })}
            >
              <AddOutlined sx={{ fontSize: 14 }} />
            </Box>
          </Box>
          <Box sx={searchInputSx}>
            <SearchOutlined
              sx={{ fontSize: 14, color: c.textDim, flexShrink: 0 }}
            />
            <InputBase
              value={s.roleQuery}
              onChange={(e) => s.setRoleQuery(e.target.value)}
              placeholder="Search roles…"
              sx={{
                fontSize: "0.78rem",
                color: c.textPrimary,
                flex: 1,
                "& input": { p: 0 },
              }}
            />
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 1.5 }}>
            {s.rolesLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={20} sx={{ color: c.accent }} />
              </Box>
            ) : (
              s.filteredRoles.map((r) => (
                <RailItem
                  key={r.roleId}
                  label={ROLE_LABEL[r.roleCode] ?? r.roleCode}
                  sublabel={r.roleCode}
                  isActive={r.roleId === s.activeRoleId}
                  icon={<ShieldOutlined sx={{ fontSize: 13 }} />}
                  onClick={() => s.setActiveRoleId(r.roleId)}
                  onMenuClick={(e) =>
                    s.setRailMenuAnchor({
                      el: e.currentTarget as HTMLElement,
                      roleId: r.roleId,
                    })
                  }
                  c={c}
                />
              ))
            )}
            {!s.rolesLoading && s.filteredRoles.length === 0 && (
              <Typography fontSize="0.75rem" color={c.textDim} px={1.5} py={2}>
                No roles match.
              </Typography>
            )}
          </Box>
        </Box>

        {/* ── Rail 2: Modules ── */}
        <Box
          sx={{
            ...railSx,
            bgcolor: c.isDark
              ? "rgba(255,255,255,0.01)"
              : "rgba(13,27,42,0.015)",
            width: 236,
          }}
        >
          <Box sx={railHeadSx}>
            <Typography
              fontSize="0.68rem"
              fontWeight={700}
              color={c.textDim}
              letterSpacing="0.08em"
              textTransform="uppercase"
            >
              Modules
            </Typography>
            <Box
              component="button"
              sx={iconBtnSx}
              onClick={(e) => {
                s.loadUnassignedModules();
                setFetchModuleAnchor(e.currentTarget as HTMLElement);
              }}
            >
              <AddOutlined sx={{ fontSize: 14 }} />
            </Box>
          </Box>
          <Box sx={searchInputSx}>
            <SearchOutlined
              sx={{ fontSize: 14, color: c.textDim, flexShrink: 0 }}
            />
            <InputBase
              value={s.modQuery}
              onChange={(e) => s.setModQuery(e.target.value)}
              placeholder="Search modules…"
              sx={{
                fontSize: "0.78rem",
                color: c.textPrimary,
                flex: 1,
                "& input": { p: 0 },
              }}
            />
          </Box>
          <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: 1.5 }}>
            {s.modulesLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress size={20} sx={{ color: c.accent }} />
              </Box>
            ) : (
              s.filteredModules.map((m) => (
                <RailItem
                  key={m.moduleId}
                  label={m.moduleName}
                  sublabel={
                    m.moduleId === s.activeModuleId
                      ? `${s.rolePermData.length} sub-modules`
                      : ""
                  }
                  isActive={m.moduleId === s.activeModuleId}
                  icon={<ViewModuleOutlined sx={{ fontSize: 13 }} />}
                  onClick={() => s.setActiveModuleId(m.moduleId)}
                  onMenuClick={(e) =>
                    s.setModuleMenuAnchor({
                      el: e.currentTarget as HTMLElement,
                      moduleId: m.moduleId,
                    })
                  }
                  c={c}
                />
              ))
            )}
            {!s.modulesLoading && s.modules.length === 0 && (
              <Box
                sx={{
                  mx: 0.5,
                  mt: 1,
                  px: 1.5,
                  py: 2,
                  borderRadius: "10px",
                  border: `1px dashed ${c.border}`,
                  textAlign: "center",
                }}
              >
                <Typography fontSize="0.72rem" fontWeight={600} color={c.textSecondary} mb={0.25}>
                  No Assigned Modules
                </Typography>
                <Typography fontSize="0.68rem" color={c.textDim} mb={1.25} lineHeight={1.5}>
                  This role has no modules yet. Fetch an existing one or create a new one.
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                  <Box
                    component="button"
                    onClick={(e) => {
                      s.loadUnassignedModules();
                      setFetchModuleAnchor(e.currentTarget as HTMLElement);
                    }}
                    sx={{
                      ...btnSx,
                      justifyContent: "center",
                      border: `1px solid ${c.textPrimary}`,
                      bgcolor: c.textPrimary,
                      color: c.bg,
                    }}
                  >
                    Add Module
                  </Box>
                </Box>
              </Box>
            )}

            {!s.modulesLoading && s.modules.length > 0 && s.filteredModules.length === 0 && (
              <Typography fontSize="0.75rem" color={c.textDim} px={1.5} py={2}>
                No modules match.
              </Typography>
            )}
          </Box>
        </Box>

        {/* ── Main panel ── */}
        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: "auto",
            px: 3.5,
            pt: 3,
            pb: 10,
            bgcolor: c.bg,
          }}
        >
          {s.isPageLoading ? (
            <Box
              display="flex"
              justifyContent="center"
              alignItems="center"
              py={10}
            >
              <CircularProgress size={28} sx={{ color: c.accent }} />
              <Typography ml={2} fontSize="0.82rem" color={c.textSecondary}>
                Loading…
              </Typography>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  mb: 2.5,
                  gap: 3,
                  flexWrap: "wrap",
                }}
              >
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography
                      fontSize="1.2rem"
                      fontWeight={600}
                      color={c.textPrimary}
                      letterSpacing="-0.02em"
                    >
                      {s.activeModule?.moduleName ?? "—"}
                    </Typography>
                    <Box
                      component="span"
                      sx={{
                        fontSize: "0.7rem",
                        fontFamily: "'JetBrains Mono', monospace",
                        px: "7px",
                        py: "2px",
                        borderRadius: "5px",
                        bgcolor: alpha(c.accent, 0.1),
                        color: c.accent,
                        border: `1px solid ${alpha(c.accent, 0.3)}`,
                      }}
                    >
                      {s.activeRole?.roleCode ?? "—"}
                    </Box>
                  </Box>
                  <Typography
                    fontSize="0.82rem"
                    color={c.textSecondary}
                    mt={0.5}
                    maxWidth="60ch"
                  >
                    Each sub-module shows only the permissions it has on record.
                    Hover a chip to disable & hide it, or click{" "}
                    <strong>+ Add</strong> to attach another from the catalog.
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    flexShrink: 0,
                    alignItems: "center",
                    flexWrap: "wrap",
                  }}
                >
                  {s.activeModuleId && (
                    <Tooltip title="Add a new sub-module" placement="top">
                      <Box
                        component="button"
                        onClick={() =>
                          s.setDrawerState({
                            kind: "sub-module",
                            contextModuleId: s.activeModuleId!,
                          })
                        }
                        sx={{
                          ...btnSx,
                          height: 30,
                          border: `1px solid ${c.border}`,
                          bgcolor: "transparent",
                          color: c.textSecondary,
                          "&:hover": {
                            bgcolor: c.accentDim,
                            color: c.accent,
                            border: `1px solid ${c.accentBorder}`,
                          },
                        }}
                      >
                        <AddOutlined sx={{ fontSize: 13 }} /> Add sub-module
                      </Box>
                    </Tooltip>
                  )}

                  {!s.isPermsLoading &&
                    !s.rolePermsIsError &&
                    s.rolePermData.length > 0 && (
                      <>
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.75,
                            px: 1.25,
                            py: 0.5,
                            borderRadius: "7px",
                            bgcolor: alpha(c.accent, 0.08),
                            border: `1px solid ${alpha(c.accent, 0.2)}`,
                            color: c.accent,
                            fontSize: "0.72rem",
                            fontWeight: 600,
                          }}
                        >
                          <LockOpenOutlined sx={{ fontSize: 12 }} />
                          {s.totalGranted} granted
                        </Box>
                        <Box
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.75,
                            px: 1.25,
                            py: 0.5,
                            borderRadius: "7px",
                            bgcolor: c.isDark
                              ? "rgba(255,255,255,0.04)"
                              : "rgba(13,27,42,0.04)",
                            border: `1px solid ${c.border}`,
                            color: c.textSecondary,
                            fontSize: "0.72rem",
                            fontWeight: 600,
                          }}
                        >
                          <LockOutlined sx={{ fontSize: 12 }} />
                          {s.totalRevoked} revoked
                        </Box>
                      </>
                    )}
                </Box>
              </Box>

              {s.isPermsLoading ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  py={8}
                >
                  <CircularProgress size={24} sx={{ color: c.accent }} />
                  <Typography ml={2} fontSize="0.82rem" color={c.textSecondary}>
                    Loading permissions…
                  </Typography>
                </Box>
              ) : s.rolePermsIsError ? (
                <PermissionsErrorState
                  error={s.rolePermsError}
                  roleName={
                    ROLE_LABEL[s.activeRole?.roleCode ?? ""] ??
                    s.activeRole?.roleCode ??
                    "—"
                  }
                  moduleName={s.activeModule?.moduleName ?? "—"}
                  onRetry={s.refetchRolePerms}
                  c={c}
                />
              ) : s.rolePermData.length === 0 ? (
                <Box
                  sx={{
                    border: `1px dashed ${c.border}`,
                    borderRadius: "12px",
                    px: 3,
                    py: 6,
                    textAlign: "center",
                    color: c.textDim,
                  }}
                >
                  <ViewModuleOutlined
                    sx={{ fontSize: 32, color: c.border, mb: 1.5 }}
                  />
                  <Typography
                    fontSize="0.9rem"
                    fontWeight={500}
                    color={c.textSecondary}
                  >
                    No sub-modules found
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}
                >
                  {s.rolePermData.map((row) => {
                    const attached = s.buildAttachedPermissions(row);
                    const addable = s.buildAddablePermissions(row);
                    const loadingPermId = s.getLoadingPermId(row.subModuleId);
                    return (
                      <SubModuleCard
                        key={row.subModuleId}
                        row={row}
                        attachedPermissions={attached}
                        addablePermissions={addable}
                        catalogLoading={s.catalogLoading}
                        loadingPermId={loadingPermId}
                        onToggle={(permId, currentGranted) =>
                          s.handleToggle(
                            row.subModuleId,
                            permId,
                            currentGranted,
                          )
                        }
                        onRemove={(permId, granted) =>
                          s.handleRemovePermissionFromSubModule(
                            row.subModuleId,
                            permId,
                            granted,
                          )
                        }
                        onAdd={(perm) =>
                          s.handleAddPermissionToSubModule(
                            row.subModuleId,
                            perm,
                          )
                        }
                        onCreatePermission={s.handleCreateNewPermission}
                        onMenuClick={(e) =>
                          s.setSubMenuAnchor({
                            el: e.currentTarget as HTMLElement,
                            row,
                          })
                        }
                        onGrantAll={() => s.handleGrantAll(row)}
                        onRevokeAll={() => s.handleRevokeAll(row)}
                        c={c}
                      />
                    );
                  })}
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      <AddModulePopover
        anchorEl={fetchModuleAnchor}
        open={!!fetchModuleAnchor}
        loading={s.unassignedModulesLoading}
        availableModules={s.unassignedModules}
        onClose={() => setFetchModuleAnchor(null)}
        onSelect={(m) => s.handleAssignModuleFromCatalog(m.moduleId, m.moduleName)}
        onCreate={(moduleName) => s.handleCreateModule(moduleName)}
        c={c}
      />

      {/* ── Role rail context menu ── */}
      <Menu
        anchorEl={s.railMenuAnchor?.el}
        open={!!s.railMenuAnchor}
        onClose={() => s.setRailMenuAnchor(null)}
        PaperProps={{
          sx: {
            bgcolor: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: "8px",
            minWidth: 200,
          },
        }}
      >
        <MenuItem
          sx={{ fontSize: "0.8rem", color: c.textPrimary }}
          onClick={() => {
            const roleId = s.railMenuAnchor!.roleId;
            const role = s.roles.find((r) => r.roleId === roleId);
            s.setRailMenuAnchor(null);
            s.setDrawerState({
              kind: "role",
              mode: "rename",
              entityId: roleId,
              initialLabel: role?.roleCode ?? "",
            });
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <DriveFileRenameOutlineOutlined
              sx={{ fontSize: 14, color: c.textSecondary }}
            />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "0.8rem" }}>
            Rename role…
          </ListItemText>
        </MenuItem>

        <MenuItem
          sx={{ fontSize: "0.8rem", color: c.textPrimary }}
          onClick={() => {
            if (s.railMenuAnchor)
              s.handleDuplicateRole(s.railMenuAnchor.roleId);
            s.setRailMenuAnchor(null);
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <ContentCopyOutlined
              sx={{ fontSize: 14, color: c.textSecondary }}
            />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "0.8rem" }}>
            Duplicate role…
          </ListItemText>
        </MenuItem>

        <Divider sx={{ borderColor: c.border, my: "4px" }} />

        <MenuItem
          sx={{ fontSize: "0.8rem", color: c.danger }}
          onClick={() => {
            const roleId = s.railMenuAnchor!.roleId;
            const role = s.roles.find((r) => r.roleId === roleId);
            const label =
              (role && (ROLE_LABEL[role.roleCode] ?? role.roleCode)) ??
              "this role";
            s.setRailMenuAnchor(null);
            s.setConfirmDialog({
              open: true,
              title: "Disable role?",
              body: `Disabling "${label}" immediately revokes it from anyone currently assigned this role and removes it from the roles list. This action cannot be undone from this screen.`,
              onConfirm: () => {
                s.handleDisableRole(roleId);
                s.setConfirmDialog((d) => ({ ...d, open: false }));
              },
            });
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <BlockOutlined sx={{ fontSize: 14, color: c.danger }} />
          </ListItemIcon>
          <ListItemText
            primaryTypographyProps={{ fontSize: "0.8rem", color: c.danger }}
          >
            Disable role…
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* ── Module rail context menu ── */}
      <Menu
        anchorEl={s.moduleMenuAnchor?.el}
        open={!!s.moduleMenuAnchor}
        onClose={() => s.setModuleMenuAnchor(null)}
        PaperProps={{
          sx: {
            bgcolor: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: "8px",
            minWidth: 200,
          },
        }}
      >
        <MenuItem
          sx={{ fontSize: "0.8rem", color: c.textPrimary }}
          onClick={() => {
            const moduleId = s.moduleMenuAnchor!.moduleId;
            const mod = s.modules.find((m) => m.moduleId === moduleId);
            s.setModuleMenuAnchor(null);
            s.setDrawerState({
              kind: "module",
              mode: "rename",
              entityId: moduleId,
              initialLabel: mod?.moduleName ?? "",
            });
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <DriveFileRenameOutlineOutlined
              sx={{ fontSize: 14, color: c.textSecondary }}
            />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: "0.8rem" }}>
            Rename module…
          </ListItemText>
        </MenuItem>

        <Divider sx={{ borderColor: c.border, my: "4px" }} />

        <MenuItem
          sx={{ fontSize: "0.8rem", color: c.danger }}
          onClick={() => {
            const moduleId = s.moduleMenuAnchor!.moduleId;
            const mod = s.modules.find((m) => m.moduleId === moduleId);
            const label = mod?.moduleName ?? "this module";
            const roleLabel = ROLE_LABEL[s.activeRole?.roleCode ?? ""] ?? s.activeRole?.roleCode ?? "this role";
            s.setModuleMenuAnchor(null);
            s.setConfirmDialog({
              open: true,
              title: "Delete module?",
              body: `This permanently removes "${label}" from ${roleLabel}. Other roles that still use it are unaffected; if no role uses it anymore, it is permanently deleted from the system. This cannot be undone.`,
              onConfirm: () => {
                s.handleDeleteModule(moduleId);
                s.setConfirmDialog((d) => ({ ...d, open: false }));
              },
            });
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <DeleteOutlineOutlined sx={{ fontSize: 14, color: c.danger }} />
          </ListItemIcon>
          <ListItemText
            primaryTypographyProps={{ fontSize: "0.8rem", color: c.danger }}
          >
            Delete module…
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* ── Sub-module context menu ── */}
      <Menu
        anchorEl={s.subMenuAnchor?.el}
        open={!!s.subMenuAnchor}
        onClose={() => s.setSubMenuAnchor(null)}
        PaperProps={{
          sx: {
            bgcolor: c.surface,
            border: `1px solid ${c.border}`,
            borderRadius: "8px",
            minWidth: 220,
          },
        }}
      >
        {s.subMenuAnchor && (
          <>
            <MenuItem
              sx={{ fontSize: "0.8rem", color: c.textPrimary }}
              onClick={() => {
                const row = s.subMenuAnchor!.row;
                s.setSubMenuAnchor(null);
                s.setDrawerState({
                  kind: "sub-module",
                  mode: "rename",
                  entityId: row.subModuleId,
                  initialLabel: row.subModuleName,
                });
              }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <DriveFileRenameOutlineOutlined
                  sx={{ fontSize: 14, color: c.textSecondary }}
                />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "0.8rem" }}>
                Rename sub-module…
              </ListItemText>
            </MenuItem>

            <Divider sx={{ borderColor: c.border, my: "4px" }} />

            <MenuItem
              sx={{ fontSize: "0.8rem", color: c.textPrimary }}
              onClick={() => {
                s.handleGrantAll(s.subMenuAnchor!.row);
                s.setSubMenuAnchor(null);
              }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <SelectAllOutlined
                  sx={{ fontSize: 14, color: c.textSecondary }}
                />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "0.8rem" }}>
                Grant all permissions
              </ListItemText>
            </MenuItem>

            <MenuItem
              sx={{ fontSize: "0.8rem", color: c.textPrimary }}
              onClick={() => {
                s.handleRevokeAll(s.subMenuAnchor!.row);
                s.setSubMenuAnchor(null);
              }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <DeselectOutlined
                  sx={{ fontSize: 14, color: c.textSecondary }}
                />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: "0.8rem" }}>
                Revoke all permissions
              </ListItemText>
            </MenuItem>

            <Divider sx={{ borderColor: c.border, my: "4px" }} />

            <MenuItem
              sx={{ fontSize: "0.8rem", color: c.danger }}
              onClick={() => {
                const row = s.subMenuAnchor!.row;
                s.setSubMenuAnchor(null);
                s.setConfirmDialog({
                  open: true,
                  title: "Reset permissions?",
                  body: `This clears every granted permission for "${row.subModuleName}" under the current role, back to the default (nothing granted). This cannot be undone.`,
                  onConfirm: () => {
                    s.handleResetSubModule(row);
                    s.setConfirmDialog((d) => ({ ...d, open: false }));
                  },
                });
              }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <RestartAltOutlined sx={{ fontSize: 14, color: c.danger }} />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ fontSize: "0.8rem", color: c.danger }}
              >
                Reset to defaults…
              </ListItemText>
            </MenuItem>

            <MenuItem
              sx={{ fontSize: "0.8rem", color: c.danger }}
              onClick={() => {
                const row = s.subMenuAnchor!.row;
                s.setSubMenuAnchor(null);
                s.setConfirmDialog({
                  open: true,
                  title: "Delete sub-module?",
                  body: `This permanently deletes "${row.subModuleName}" and every role's permission mapping for it. This cannot be undone.`,
                  onConfirm: () => {
                    s.handleDeleteSubModule(row.subModuleId);
                    s.setConfirmDialog((d) => ({ ...d, open: false }));
                  },
                });
              }}
            >
              <ListItemIcon sx={{ minWidth: 28 }}>
                <DeleteOutlineOutlined sx={{ fontSize: 14, color: c.danger }} />
              </ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ fontSize: "0.8rem", color: c.danger }}
              >
                Delete sub-module…
              </ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* ── Create Role / Module / Sub-module drawer ── */}
      <CreateEntityDrawer
        open={!!s.drawerState}
        state={s.drawerState}
        roles={s.roles}
        onClose={() => s.setDrawerState(null)}
        onCreateRole={s.handleCreateRole}
        onCreateModule={s.handleCreateModule}
        onCreateSubModule={s.handleCreateSubModule}
        onRenameRole={s.handleRenameRole}
        onRenameModule={s.handleRenameModule}
        onRenameSubModule={s.handleRenameSubModule}
        c={c}
      />

      {/* ── Confirm dialog (Reset to defaults) ── */}
      <ConfirmDialog
        state={s.confirmDialog}
        onClose={() => s.setConfirmDialog((d) => ({ ...d, open: false }))}
        c={c}
      />

      {/* ── Snackbar ── */}
      <Snackbar
        open={s.snackbar.open}
        autoHideDuration={3000}
        onClose={() => s.setSnackbar((sb) => ({ ...sb, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={s.snackbar.severity}
          onClose={() => s.setSnackbar((sb) => ({ ...sb, open: false }))}
          variant="filled"
          sx={{ fontSize: "0.8rem", borderRadius: "8px" }}
        >
          {s.snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
