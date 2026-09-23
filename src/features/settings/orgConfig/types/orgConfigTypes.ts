export type OrgLevel = "vertical" | "function" | "domain" | "sub-domain";

export const LEVEL_LABEL: Record<OrgLevel, string> = {
  vertical: "Vertical",
  function: "Team Function",
  domain: "Domain",
  "sub-domain": "Sub Domain",
};

export type StatusFilter = "all" | "active" | "inactive";

/** Maps a UI status filter to the -1/0/1 convention the backend/procs use. */
export const STATUS_FILTER_PARAM: Record<StatusFilter, number> = {
  all: -1,
  active: 1,
  inactive: 0,
};

export interface OrgDrawerState {
  level: OrgLevel;
  mode: "create" | "edit";
  /** id of the entity being edited (only relevant when mode is "edit") */
  entityId?: number;
  initialCode?: string;
  initialName?: string;
  /** parent id the new entity will belong to (only relevant for mode "create" at non-root levels) */
  parentId?: number;
  parentLabel?: string;
}

export interface OrgMenuAnchor {
  el: HTMLElement;
  level: OrgLevel;
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  /** number of directly-selectable rows currently shown one level down, for cascade-impact copy */
  childCount?: number;
}

export interface OrgConfirmDialogState {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

export interface OrgSnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
}

export interface RailListState {
  search: string;
  statusFilter: StatusFilter;
  page: number;
}

export const DEFAULT_RAIL_LIST_STATE: RailListState = {
  search: "",
  statusFilter: "all",
  page: 0,
};

export const PAGE_SIZE = 20;
