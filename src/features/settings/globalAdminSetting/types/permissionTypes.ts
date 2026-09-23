import type { RolePermissionViewModel } from "../api/globalSettingsPermissionApi";

/**
 * Permission entry surfaced in the "+ Add" popover and used to attach a new
 * permission to a sub-module. permissionCode is DERIVED locally from
 * permissionName because the catalog endpoint only returns id + name.
 */
export interface AddablePermission {
  permissionId: number;
  permissionName: string;
  permissionCode: string;
}

/** A permission chip actually rendered on a sub-module card. */
export interface AttachedPermission {
  permissionId: number;
  permissionName: string;
  permissionCode: string;
  granted: boolean;
}

export type DrawerKind = "role" | "module" | "sub-module";

export interface DrawerState {
  kind: DrawerKind;
  /** "create" (default) or "rename" an existing entity. */
  mode?: "create" | "rename";
  /** Module the new sub-module will belong to (only relevant for kind "sub-module") */
  contextModuleId?: number;
  /** Pre-selected "copy permissions from" role (only relevant for kind "role", set via Duplicate) */
  presetCopyFromRoleId?: number;
  /** id of the entity being renamed (only relevant when mode is "rename") */
  entityId?: number;
  /** current name to pre-fill the label field with (only relevant when mode is "rename") */
  initialLabel?: string;
}

export interface RailMenuAnchor {
  el: HTMLElement;
  roleId: number;
}

export interface ModuleMenuAnchor {
  el: HTMLElement;
  moduleId: number;
}

export interface SubModuleMenuAnchor {
  el: HTMLElement;
  row: RolePermissionViewModel;
}

export interface ConfirmDialogState {
  open: boolean;
  title: string;
  body: string;
  onConfirm: () => void;
}

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}
