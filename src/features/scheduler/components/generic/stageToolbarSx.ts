/**
 * Responsive layout for the stage listing toolbar (Change Impact, search,
 * action buttons, counts), shared by GenericStagePage and PlanAndInventoryPage.
 *
 * Uses CSS container queries against the table's top toolbar, so the layout
 * follows the space the table actually has (sidebar open/closed, fullscreen)
 * rather than the browser window. Action buttons collapse progressively:
 * full label -> short label -> icon only (label kept in tooltip/aria-label).
 */

const TOOLBAR_CONTAINER = "stage-toolbar";

/** Toolbar widths (px) at which the action buttons step down. */
const SHORT_LABEL_BELOW = 1320;
const ICON_ONLY_BELOW = 1040;
const WRAP_BELOW = 760;

const at = (maxWidth: number) => `@container ${TOOLBAR_CONTAINER} (max-width: ${maxWidth}px)`;

/** Merge into the table's `muiTopToolbarProps.sx` to make it the query container. */
export const stageToolbarContainerSx = {
  containerType: "inline-size",
  containerName: TOOLBAR_CONTAINER,
} as const;

/*
 * Free space in the row is shared by flex-grow: Change Impact 1 + search 2
 * vs. the trailing spacer 3, so the fields absorb about half of whatever is
 * left and the rest stays as breathing room before the table's own icons.
 * Bases are fluid relative to the toolbar (cqi = 1% of its width).
 */
export const changeImpactSx = {
  flex: "1 0 clamp(120px, 11cqi, 200px)",
  maxWidth: 260,
} as const;

export const searchFieldSx = {
  flex: "2 1 clamp(130px, 16cqi, 300px)",
  minWidth: 120,
  maxWidth: 440,
} as const;

/** Trailing spacer: keeps the other half of the free space empty. */
export const stageToolbarSpacerSx = { flex: "3 1 0", minWidth: 0 } as const;

/** sx for the Stack returned by `renderTopToolbarCustomActions`. */
export const stageToolbarRowSx = {
  flex: "1 1 auto",
  flexWrap: "nowrap",
  minWidth: 0,
  "& .cab-label-short": { display: "none" },
  [at(SHORT_LABEL_BELOW)]: {
    "& .cab-label-full": { display: "none" },
    "& .cab-label-short": { display: "inline" },
  },
  [at(ICON_ONLY_BELOW)]: {
    "& .cab-label-full, & .cab-label-short": { display: "none" },
    "& .cab-responsive": { minWidth: 34, px: 0 },
    "& .cab-responsive .MuiButton-startIcon": { m: 0 },
  },
  [at(WRAP_BELOW)]: { flexWrap: "wrap" },
} as const;
