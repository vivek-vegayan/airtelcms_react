import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useGetRolesQuery,
  useGetModulesForRoleQuery,
  useLazyGetUnassignedModulesForRoleQuery,
  useLazyGetModuleByRoleAndCodeQuery,
  useGetPermissionTypesQuery,
  useGetAllRolePermissionsQuery,
  useEnablePermissionMutation,
  useDisablePermissionMutation,
  useBulkUpdatePermissionsMutation,
  useResetPermissionsMutation,
  useAddNewRolePermissionMutation,
  useDisableRoleMutation,
  useCreateNewRoleMutation,
  useRenameRoleMutation,
  useAssignModuleToRoleMutation,
  useDeleteModuleForRoleMutation,
  useCreateNewModuleMutation,
  useRenameModuleMutation,
  useCreateNewSubModuleMutation,
  useCreateNewPermissionMutation,
  useRenameSubModuleMutation,
  useDeleteSubModuleMutation,
  type RolePermissionViewModel,
  type GrantedPermissionItem,
} from "../api/globalSettingsPermissionApi";
import { slug, humanizeCode, extractApiErrorMessage } from "../utils/permissionUtils";
import type {
  AddablePermission,
  AttachedPermission,
  ConfirmDialogState,
  DrawerState,
  ModuleMenuAnchor,
  RailMenuAnchor,
  SnackbarState,
  SubModuleMenuAnchor,
} from "../types/permissionTypes";

/**
 * Central state + handlers for the Global Settings permission dashboard.
 *
 * Known backend constraint: GET /role-permissions only returns permissions
 * that are currently GRANTED — a permission attached-but-not-yet-granted has
 * no server-side read model. To let a user attach a permission and see its
 * (unchecked) chip before enabling it, we track "attached this session" and
 * "hidden this session" locally, layered on top of the real API calls. This
 * mirrors the sub-module's true state as long as the tab stays open; a hard
 * reload before enabling a freshly-added permission will drop its chip until
 * it's added again — a backend read-model limitation, not something the
 * frontend can paper over further.
 */
export function useGlobalPermissionsController() {
  const [activeRoleId, setActiveRoleId] = useState<number | null>(null);
  const [activeModuleId, setActiveModuleId] = useState<number | null>(null);

  const [roleQuery, setRoleQuery] = useState("");
  const [modQuery, setModQuery] = useState("");

  const [sessionAttachedPerms, setSessionAttachedPerms] = useState<Record<number, Set<number>>>({});
  const [sessionHiddenPerms, setSessionHiddenPerms] = useState<Record<number, Set<number>>>({});

  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  const [drawerState, setDrawerState] = useState<DrawerState | null>(null);
  const [railMenuAnchor, setRailMenuAnchor] = useState<RailMenuAnchor | null>(null);
  const [moduleMenuAnchor, setModuleMenuAnchor] = useState<ModuleMenuAnchor | null>(null);
  const [subMenuAnchor, setSubMenuAnchor] = useState<SubModuleMenuAnchor | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    body: "",
    onConfirm: () => {},
  });

  // ── Queries ──────────────────────────────────────────────────
  const { data: roles = [], isLoading: rolesLoading } = useGetRolesQuery();
  const { data: modules = [], isLoading: modulesLoading } = useGetModulesForRoleQuery(
    activeRoleId ?? 0,
    { skip: !activeRoleId },
  );
  const { data: permissionCatalog = [], isLoading: catalogLoading } = useGetPermissionTypesQuery();

  const [triggerUnassignedModules, { data: unassignedModules = [], isFetching: unassignedModulesLoading }] =
    useLazyGetUnassignedModulesForRoleQuery();

  const [triggerModuleByRoleAndCode] = useLazyGetModuleByRoleAndCodeQuery();

  const {
    data: rolePermData = [],
    isLoading: rolePermsLoading,
    isFetching: rolePermsFetching,
    isError: rolePermsIsError,
    error: rolePermsError,
    refetch: refetchRolePerms,
  } = useGetAllRolePermissionsQuery(
    { roleId: activeRoleId ?? 0, moduleId: activeModuleId ?? 0 },
    { skip: !activeRoleId || !activeModuleId },
  );

  // ── Mutations ────────────────────────────────────────────────
  const [enablePermission] = useEnablePermissionMutation();
  const [disablePermission] = useDisablePermissionMutation();
  const [bulkUpdatePermissions] = useBulkUpdatePermissionsMutation();
  const [resetPermissionsMutation] = useResetPermissionsMutation();
  const [addNewRolePermission] = useAddNewRolePermissionMutation();
  const [disableRoleMutation] = useDisableRoleMutation();
  const [createNewRoleMutation] = useCreateNewRoleMutation();
  const [renameRoleMutation] = useRenameRoleMutation();
  const [assignModuleToRoleMutation] = useAssignModuleToRoleMutation();
  const [deleteModuleForRoleMutation] = useDeleteModuleForRoleMutation();
  const [createNewModuleMutation] = useCreateNewModuleMutation();
  const [renameModuleMutation] = useRenameModuleMutation();
  const [createNewSubModuleMutation] = useCreateNewSubModuleMutation();
  const [createNewPermissionMutation] = useCreateNewPermissionMutation();
  const [renameSubModuleMutation] = useRenameSubModuleMutation();
  const [deleteSubModuleMutation] = useDeleteSubModuleMutation();

  // permissionId → { permissionName, permissionCode }. permissionCode is
  // derived client-side since the catalog endpoint only returns id + name.
  const permCatalogById = useMemo(() => {
    const map = new Map<number, { permissionName: string; permissionCode: string }>();
    permissionCatalog.forEach((p) =>
      map.set(p.permissionId, { permissionName: p.permissionName, permissionCode: slug(p.permissionName) }),
    );
    return map;
  }, [permissionCatalog]);

  // ── Auto-select first role / module ─────────────────────────
  useEffect(() => {
    if (roles.length && !activeRoleId) setActiveRoleId(roles[0].roleId);
  }, [roles, activeRoleId]);

  // Modules are role-scoped, so a module id picked under one role is
  // meaningless under another — drop it and let the effect below re-pick.
  useEffect(() => {
    setActiveModuleId(null);
  }, [activeRoleId]);

  useEffect(() => {
    if (modules.length && !activeModuleId) setActiveModuleId(modules[0].moduleId);
  }, [modules, activeModuleId]);

  useEffect(() => {
    setOptimistic({});
  }, [activeRoleId, activeModuleId]);

  const filteredRoles = useMemo(
    () =>
      roles.filter(
        (r) => !roleQuery || r.roleCode.toLowerCase().includes(roleQuery.toLowerCase()),
      ),
    [roles, roleQuery],
  );

  const filteredModules = useMemo(
    () =>
      modules.filter((m) => !modQuery || m.moduleName.toLowerCase().includes(modQuery.toLowerCase())),
    [modules, modQuery],
  );

  // ── Build attached / addable permissions for a sub-module row ─
  const buildAttachedPermissions = useCallback(
    (row: RolePermissionViewModel): AttachedPermission[] => {
      const hidden = sessionHiddenPerms[row.subModuleId] ?? new Set<number>();
      const added = sessionAttachedPerms[row.subModuleId] ?? new Set<number>();

      const apiPerms: GrantedPermissionItem[] = Array.isArray(row.permissions) ? row.permissions : [];

      const fromApi = apiPerms
        .filter((p) => !hidden.has(p.permission_id))
        .map((p) => ({
          permissionId: p.permission_id,
          permissionCode: p.permission_code,
          permissionName: permCatalogById.get(p.permission_id)?.permissionName ?? humanizeCode(p.permission_code),
          granted: true,
        }));

      const apiIds = new Set(apiPerms.map((p) => p.permission_id));
      const fromSession = Array.from(added)
        .filter((id) => !apiIds.has(id) && !hidden.has(id))
        .map((id) => {
          const cat = permCatalogById.get(id);
          return {
            permissionId: id,
            permissionCode: cat?.permissionCode ?? `PERM_${id}`,
            permissionName: cat?.permissionName ?? `Permission ${id}`,
            granted: false,
          };
        });

      return [...fromApi, ...fromSession].map((p) => {
        const key = `${row.subModuleId}_${p.permissionId}`;
        return key in optimistic ? { ...p, granted: optimistic[key] } : p;
      });
    },
    [sessionHiddenPerms, sessionAttachedPerms, optimistic, permCatalogById],
  );

  const buildAddablePermissions = useCallback(
    (row: RolePermissionViewModel): AddablePermission[] => {
      const attachedIds = new Set(buildAttachedPermissions(row).map((p) => p.permissionId));
      return permissionCatalog
        .filter((p) => !attachedIds.has(p.permissionId))
        .map((p) => ({
          permissionId: p.permissionId,
          permissionName: p.permissionName,
          permissionCode: slug(p.permissionName),
        }));
    },
    [buildAttachedPermissions, permissionCatalog],
  );

  // ── Toggle single permission ─────────────────────────────────
  const handleToggle = useCallback(
    async (subModuleId: number, permissionId: number, currentGranted: boolean, skipRefetch = false) => {
      if (!activeRoleId) return;
      const key = `${subModuleId}_${permissionId}`;
      const newVal = !currentGranted;
      setOptimistic((prev) => ({ ...prev, [key]: newVal }));
      setSavingKey(key);
      const payload = { roleId: activeRoleId, subModuleId, permissionId };
      try {
        if (newVal) await enablePermission(payload).unwrap();
        else await disablePermission(payload).unwrap();
        if (!skipRefetch) {
          setSnackbar({ open: true, message: newVal ? "Permission enabled." : "Permission disabled.", severity: "success" });
        }
      } catch (err: unknown) {
        setOptimistic((prev) => ({ ...prev, [key]: currentGranted }));
        if (!skipRefetch) {
          setSnackbar({
            open: true,
            message: extractApiErrorMessage(err, newVal ? "Failed to enable permission." : "Failed to disable permission."),
            severity: "error",
          });
        }
      } finally {
        setSavingKey(null);
      }
    },
    [activeRoleId, enablePermission, disablePermission],
  );

  // ── Attach a catalog permission to a sub-module ──────────────
  const handleAddPermissionToSubModule = useCallback(
    async (subModuleId: number, perm: AddablePermission) => {
      if (!activeRoleId) return;
      try {
        await addNewRolePermission({ roleId: activeRoleId, subModuleId, permissionId: perm.permissionId }).unwrap();
        setSessionAttachedPerms((prev) => {
          const next = { ...prev };
          next[subModuleId] = new Set(next[subModuleId] ?? []).add(perm.permissionId);
          return next;
        });
        setSessionHiddenPerms((prev) => {
          const set = prev[subModuleId];
          if (!set?.has(perm.permissionId)) return prev;
          const next = { ...prev };
          const newSet = new Set(set);
          newSet.delete(perm.permissionId);
          next[subModuleId] = newSet;
          return next;
        });
        setSnackbar({
          open: true,
          message: `Added "${perm.permissionName}" to this sub-module. Click the chip to enable it.`,
          severity: "info",
        });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to add permission."), severity: "error" });
      }
    },
    [activeRoleId, addNewRolePermission],
  );

  // ── Disable + hide a permission chip (no delete-mapping endpoint exists) ─
  const handleRemovePermissionFromSubModule = useCallback(
    async (subModuleId: number, permissionId: number, granted: boolean) => {
      if (!activeRoleId) return;
      if (granted) {
        try {
          await disablePermission({ roleId: activeRoleId, subModuleId, permissionId }).unwrap();
        } catch (err: unknown) {
          setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to disable permission."), severity: "error" });
          return;
        }
      }
      setSessionHiddenPerms((prev) => {
        const next = { ...prev };
        next[subModuleId] = new Set(next[subModuleId] ?? []).add(permissionId);
        return next;
      });
      setSessionAttachedPerms((prev) => {
        const set = prev[subModuleId];
        if (!set?.has(permissionId)) return prev;
        const next = { ...prev };
        const newSet = new Set(set);
        newSet.delete(permissionId);
        next[subModuleId] = newSet;
        return next;
      });
      setOptimistic((prev) => {
        const key = `${subModuleId}_${permissionId}`;
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      setSnackbar({ open: true, message: "Permission disabled and hidden from this view.", severity: "info" });
    },
    [activeRoleId, disablePermission],
  );

  // ── Grant / Revoke all (single bulk call) ────────────────────
  const handleGrantAll = useCallback(
    async (row: RolePermissionViewModel) => {
      if (!activeRoleId) return;
      const toGrant = buildAttachedPermissions(row).filter((p) => !p.granted).map((p) => p.permissionId);
      if (toGrant.length === 0) return;
      try {
        await bulkUpdatePermissions({ roleId: activeRoleId, subModuleId: row.subModuleId, permissionIds: toGrant, isGranted: true }).unwrap();
        setSnackbar({ open: true, message: `Granted ${toGrant.length} permission${toGrant.length > 1 ? "s" : ""}.`, severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to grant permissions."), severity: "error" });
      }
    },
    [activeRoleId, buildAttachedPermissions, bulkUpdatePermissions],
  );

  const handleRevokeAll = useCallback(
    async (row: RolePermissionViewModel) => {
      if (!activeRoleId) return;
      const toRevoke = buildAttachedPermissions(row).filter((p) => p.granted).map((p) => p.permissionId);
      if (toRevoke.length === 0) return;
      try {
        await bulkUpdatePermissions({ roleId: activeRoleId, subModuleId: row.subModuleId, permissionIds: toRevoke, isGranted: false }).unwrap();
        setSnackbar({ open: true, message: `Revoked ${toRevoke.length} permission${toRevoke.length > 1 ? "s" : ""}.`, severity: "info" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to revoke permissions."), severity: "error" });
      }
    },
    [activeRoleId, buildAttachedPermissions, bulkUpdatePermissions],
  );

  // ── Reset a sub-module's permissions back to defaults ────────
  const handleResetSubModule = useCallback(
    async (row: RolePermissionViewModel) => {
      if (!activeRoleId) return;
      try {
        await resetPermissionsMutation({ roleId: activeRoleId, subModuleId: row.subModuleId }).unwrap();
        setSessionAttachedPerms((prev) => {
          const next = { ...prev };
          delete next[row.subModuleId];
          return next;
        });
        setSessionHiddenPerms((prev) => {
          const next = { ...prev };
          delete next[row.subModuleId];
          return next;
        });
        setSnackbar({ open: true, message: `Permissions reset for "${row.subModuleName}".`, severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to reset permissions."), severity: "error" });
      }
    },
    [activeRoleId, resetPermissionsMutation],
  );

  // ── Create Role / Duplicate Role ──────────────────────────────
  const handleCreateRole = useCallback(
    async (roleCode: string, copiedRoleId?: number) => {
      const code = slug(roleCode);
      try {
        await createNewRoleMutation({ roleCode: code, copiedRoleId }).unwrap();
        setSnackbar({ open: true, message: `Role "${code}" created.`, severity: "success" });
        const created = roles.find((r) => r.roleCode === code);
        if (created) setActiveRoleId(created.roleId);
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to create role."), severity: "error" });
      }
    },
    [createNewRoleMutation, roles],
  );

  const handleDuplicateRole = useCallback(
    (roleId: number) => {
      // Opens the Create Role drawer with "copy permissions from" pre-set to
      // this role — the actual clone happens via createNewRole(copiedRoleId).
      setDrawerState({ kind: "role", presetCopyFromRoleId: roleId });
    },
    [],
  );

  // ── Disable Role ──────────────────────────────────────────────
  const handleDisableRole = useCallback(
    async (roleId: number) => {
      try {
        await disableRoleMutation({ roleId }).unwrap();
        setSnackbar({ open: true, message: "Role disabled.", severity: "success" });
        // Roles list is invalidated/refetched; if the disabled role was active,
        // clear the selection so the auto-select effect picks the next one.
        setActiveRoleId((prev) => (prev === roleId ? null : prev));
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to disable role."), severity: "error" });
      }
    },
    [disableRoleMutation],
  );

  // ── Rename Role ─────────────────────────────────────────────
  const handleRenameRole = useCallback(
    async (roleId: number, newLabel: string) => {
      const code = slug(newLabel);
      try {
        await renameRoleMutation({ roleId, newRoleCode: code }).unwrap();
        setSnackbar({ open: true, message: `Role renamed to "${code}".`, severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to rename role."), severity: "error" });
      }
    },
    [renameRoleMutation],
  );

  // ── Create Module (brand new catalog entry; not yet assigned to any role
  //     until it has at least one sub-module — prompt straight into that) ──
  const handleCreateModule = useCallback(
    async (moduleCode: string) => {
      if (!activeRoleId) return;
      try {
        await createNewModuleMutation({ moduleCode, roleId: activeRoleId }).unwrap();
        // The new module is owned by this role alone, so it won't show up via
        // getModulesForRole (no grants yet) or the unassigned/"fetch" list
        // (role-owned modules are excluded from that on purpose) — resolve
        // its id directly instead.
        const matches = await triggerModuleByRoleAndCode({ roleId: activeRoleId, moduleCode }).unwrap();
        const created = matches[0];
        if (created) {
          setActiveModuleId(created.moduleId);
          setDrawerState({ kind: "sub-module", contextModuleId: created.moduleId });
          setSnackbar({
            open: true,
            message: `Module "${moduleCode}" created. Add a sub-module to assign it to this role.`,
            severity: "info",
          });
        } else {
          setSnackbar({ open: true, message: `Module "${moduleCode}" created.`, severity: "success" });
        }
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to create module."), severity: "error" });
      }
    },
    [activeRoleId, createNewModuleMutation, triggerModuleByRoleAndCode],
  );

  // ── Delete Module (role-scoped; permanently purged once no role uses it) ─
  const handleDeleteModule = useCallback(
    async (moduleId: number) => {
      if (!activeRoleId) return;
      try {
        const response = await deleteModuleForRoleMutation({ roleId: activeRoleId, moduleId }).unwrap();
        setSnackbar({ open: true, message: response.message ?? "Module deleted.", severity: "success" });
        setActiveModuleId((prev) => (prev === moduleId ? null : prev));
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to delete module."), severity: "error" });
      }
    },
    [activeRoleId, deleteModuleForRoleMutation],
  );

  // ── Assign an existing catalog module to the active role ("Fetch from DB") ─
  const handleAssignModuleFromCatalog = useCallback(
    async (moduleId: number, moduleName: string) => {
      if (!activeRoleId) return;
      try {
        await assignModuleToRoleMutation({ roleId: activeRoleId, moduleId }).unwrap();
        setSnackbar({ open: true, message: `"${moduleName}" assigned to this role.`, severity: "success" });
        setActiveModuleId(moduleId);
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to assign module."), severity: "error" });
      }
    },
    [activeRoleId, assignModuleToRoleMutation],
  );

  // ── Load the "Fetch from Database" module picker on demand ──────────────
  const loadUnassignedModules = useCallback(() => {
    if (!activeRoleId) return;
    triggerUnassignedModules(activeRoleId);
  }, [activeRoleId, triggerUnassignedModules]);

  // ── Create a brand-new permission in the flat catalog ────────────────────
  const handleCreateNewPermission = useCallback(
    async (permissionName: string) => {
      try {
        await createNewPermissionMutation({ permissionCode: slug(permissionName), permissionName }).unwrap();
        setSnackbar({ open: true, message: `Permission "${permissionName}" created.`, severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to create permission."), severity: "error" });
      }
    },
    [createNewPermissionMutation],
  );

  // ── Rename Module ───────────────────────────────────────────
  const handleRenameModule = useCallback(
    async (moduleId: number, newLabel: string) => {
      try {
        await renameModuleMutation({ moduleId, newModuleName: newLabel }).unwrap();
        setSnackbar({ open: true, message: `Module renamed to "${newLabel}".`, severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to rename module."), severity: "error" });
      }
    },
    [renameModuleMutation],
  );

  // ── Create Sub-module (default permissions go to the active role) ───────
  const handleCreateSubModule = useCallback(
    async (subModuleCode: string, moduleId: number) => {
      if (!activeRoleId) return;
      try {
        await createNewSubModuleMutation({ moduleId, subModuleCode, roleId: activeRoleId }).unwrap();
        setSnackbar({ open: true, message: `Sub-module "${subModuleCode}" added.`, severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to create sub-module."), severity: "error" });
      }
    },
    [activeRoleId, createNewSubModuleMutation],
  );

  // ── Rename Sub-module ────────────────────────────────────────
  const handleRenameSubModule = useCallback(
    async (subModuleId: number, newLabel: string) => {
      try {
        await renameSubModuleMutation({ subModuleId, newSubModuleName: newLabel }).unwrap();
        setSnackbar({ open: true, message: `Sub-module renamed to "${newLabel}".`, severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to rename sub-module."), severity: "error" });
      }
    },
    [renameSubModuleMutation],
  );

  // ── Delete Sub-module ────────────────────────────────────────
  const handleDeleteSubModule = useCallback(
    async (subModuleId: number) => {
      try {
        await deleteSubModuleMutation({ subModuleId }).unwrap();
        setSnackbar({ open: true, message: "Sub-module deleted.", severity: "success" });
      } catch (err: unknown) {
        setSnackbar({ open: true, message: extractApiErrorMessage(err, "Failed to delete sub-module."), severity: "error" });
      }
    },
    [deleteSubModuleMutation],
  );

  // ── Derived ────────────────────────────────────────────────
  const activeRole = roles.find((r) => r.roleId === activeRoleId);
  // Falls back to the "not yet assigned" list right after a brand-new module
  // is created (it has no grants yet, so it isn't in the role-scoped list).
  const activeModule =
    modules.find((m) => m.moduleId === activeModuleId) ??
    unassignedModules.find((m) => m.moduleId === activeModuleId);
  const isPageLoading = rolesLoading || modulesLoading;
  const isPermsLoading = rolePermsLoading || rolePermsFetching;

  const totalGranted = useMemo(
    () => rolePermData.reduce((sum, row) => sum + buildAttachedPermissions(row).filter((p) => p.granted).length, 0),
    [rolePermData, buildAttachedPermissions],
  );
  const totalAttached = useMemo(
    () => rolePermData.reduce((sum, row) => sum + buildAttachedPermissions(row).length, 0),
    [rolePermData, buildAttachedPermissions],
  );
  const totalRevoked = totalAttached - totalGranted;

  const getLoadingPermId = useCallback((subModuleId: number): number | null => {
    if (!savingKey) return null;
    const prefix = `${subModuleId}_`;
    if (!savingKey.startsWith(prefix)) return null;
    const id = Number(savingKey.slice(prefix.length));
    return Number.isNaN(id) ? null : id;
  }, [savingKey]);

  return {
    // selection
    activeRoleId, setActiveRoleId, activeModuleId, setActiveModuleId, activeRole, activeModule,
    // lists
    roles, modules, filteredRoles, filteredModules, rolePermData,
    unassignedModules, unassignedModulesLoading, loadUnassignedModules,
    // query state
    rolesLoading, modulesLoading, catalogLoading, isPageLoading, isPermsLoading,
    rolePermsIsError, rolePermsError, refetchRolePerms,
    // search
    roleQuery, setRoleQuery, modQuery, setModQuery,
    // permissions
    buildAttachedPermissions, buildAddablePermissions, getLoadingPermId,
    handleToggle, handleAddPermissionToSubModule, handleRemovePermissionFromSubModule,
    handleGrantAll, handleRevokeAll, handleResetSubModule,
    // entity creation
    handleCreateRole, handleDuplicateRole, handleCreateModule, handleCreateSubModule,
    handleAssignModuleFromCatalog, handleCreateNewPermission,
    // entity renaming
    handleRenameRole, handleRenameModule, handleRenameSubModule,
    // entity disabling / deleting
    handleDisableRole, handleDeleteModule, handleDeleteSubModule,
    // summaries
    totalGranted, totalRevoked,
    // ui state
    drawerState, setDrawerState, railMenuAnchor, setRailMenuAnchor,
    moduleMenuAnchor, setModuleMenuAnchor,
    subMenuAnchor, setSubMenuAnchor, confirmDialog, setConfirmDialog,
    snackbar, setSnackbar,
  };
}
