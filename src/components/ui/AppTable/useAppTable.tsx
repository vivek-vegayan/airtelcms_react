
import { useMediaQuery, useTheme, type Theme } from "@mui/material";
import {
  useMaterialReactTable,
  type MRT_RowData,
  type MRT_TableInstance,
  type MRT_TableOptions,
} from "material-react-table";

import { useTabColorTokens } from "../../../style/theme";
import { AppTableEmptyState } from "./AppTableEmptyState";
import {
  buildRowsPerPageOptions,
  DEFAULT_ALL_OPTION_MAX_ROWS,
  DEFAULT_PAGE_SIZES,
} from "./tablePagination.utils";

/* ================================================================
   One table look for the whole application.

   Every screen used to hand Material React Table its own paper
   border, header casing, cell padding and pagination props, so the
   same grid read differently on each page. This module owns those
   decisions once: a feature passes only the options that are
   genuinely about its data (columns, rows, row actions, paging
   mode) and inherits the rest.

   Feature options always win — the preset is a floor, not a cage.
   `sx` is merged rather than replaced, so a screen can nudge one
   colour without restating the whole style block.
================================================================ */

export interface AppTableConfig {
  /**
   * Cap on the scrolling body. A table taller than its viewport is the
   * usual cause of a page with two scrollbars. Pass `false` to let the
   * table grow to its natural height (right for short embedded tables
   * and for tables inside a dialog that scrolls as a whole).
   */
  maxHeight?:
    | number
    | string
    | false
    | Partial<Record<"xs" | "sm" | "md" | "lg" | "xl", number | string>>;
  /** Base rows-per-page ladder before it is trimmed to the row count. */
  pageSizes?: number[];
  /** Set false to suppress the trailing "N (All)" entry. */
  showAllOption?: boolean;
  /** Row count past which "All" is withheld to protect render time. */
  allOptionMaxRows?: number;
  /** Alternating row tint. Off by default; useful for wide, dense grids. */
  zebra?: boolean;
  /**
   * Draws the table's own card — border, radius, paper background. Set false
   * when the screen already wraps the table in a bordered surface, so the two
   * frames do not sit inside one another.
   */
  frame?: boolean;
  /** Heading for the shared empty panel. */
  emptyTitle?: string;
  /** Supporting line for the shared empty panel. */
  emptyDescription?: string;
  /** Renders the empty panel in its error treatment instead of its neutral one. */
  isError?: boolean;
  /**
   * Total rows the user can page through. Only needed when the table
   * cannot work it out itself — i.e. server-side paging that does not
   * already set `rowCount`.
   */
  totalRowCount?: number;
}

export type AppTableOptions<TData extends MRT_RowData> = MRT_TableOptions<TData> & {
  appTable?: AppTableConfig;
};

/* ---------------------------------------------------------------- */
/* Merging                                                           */
/* ---------------------------------------------------------------- */

type AnyProps = Record<string, unknown>;
type PropOrFn<TArgs> = AnyProps | ((args: TArgs) => AnyProps) | undefined;

const isPlainObject = (v: unknown): v is AnyProps =>
  typeof v === "object" && v !== null && !Array.isArray(v);

function deepMerge(base: AnyProps, override: AnyProps): AnyProps {
  const out: AnyProps = { ...base };
  for (const [key, value] of Object.entries(override)) {
    out[key] =
      isPlainObject(value) && isPlainObject(out[key])
        ? deepMerge(out[key] as AnyProps, value)
        : value;
  }
  return out;
}

/** Flattens any `sx` shape — object, array, or theme callback — to one object. */
function resolveSx(sx: unknown, theme: Theme): AnyProps {
  if (!sx) return {};
  if (typeof sx === "function") return resolveSx((sx as (t: Theme) => unknown)(theme), theme);
  if (Array.isArray(sx)) {
    return sx.reduce<AnyProps>((acc, one) => deepMerge(acc, resolveSx(one, theme)), {});
  }
  return isPlainObject(sx) ? sx : {};
}

/**
 * Combines a preset `mui*Props` with a feature's own. Both sides may be an
 * object or a function of the table, so the result is always a function.
 * Plain keys are overridden by the feature; `sx` is deep-merged, with the
 * feature's rules winning on any key they actually set.
 *
 * `sx` must come out as a single object (behind a theme callback), never an
 * array: Material React Table merges these with `Object.assign(defaults, sx)`,
 * and an array there lands as numeric keys — which silently drops every rule
 * and leaves MRT's own defaults in place.
 */
function mergeMuiProps<TArgs>(
  preset: PropOrFn<TArgs>,
  feature: PropOrFn<TArgs>,
): (args: TArgs) => AnyProps {
  return (args: TArgs) => {
    const base = (typeof preset === "function" ? preset(args) : preset) ?? {};
    const override = (typeof feature === "function" ? feature(args) : feature) ?? {};

    const merged: AnyProps = { ...base, ...override };
    if (base.sx || override.sx) {
      merged.sx = (theme: Theme) =>
        deepMerge(resolveSx(base.sx, theme), resolveSx(override.sx, theme));
    }
    return merged;
  };
}

/* ---------------------------------------------------------------- */
/* Row count                                                         */
/* ---------------------------------------------------------------- */

/**
 * How many rows the pagination control is paging through *right now*.
 *
 * For a server-paged table that is whatever the backend reported. For a
 * client-side table it is the filtered count, not the raw data length, so
 * searching a 400-row table down to 12 offers "12 (All)" and not "400 (All)".
 */
function resolveTotalRowCount<TData extends MRT_RowData>(
  table: MRT_TableInstance<TData>,
  options: AppTableOptions<TData>,
): number {
  if (options.appTable?.totalRowCount !== undefined) {
    return options.appTable.totalRowCount;
  }
  if (options.manualPagination) {
    return options.rowCount ?? options.data.length;
  }
  try {
    return table.getFilteredRowModel().rows.length;
  } catch {
    return options.data.length;
  }
}

/* ---------------------------------------------------------------- */
/* Fitting the page to the screen                                    */
/* ---------------------------------------------------------------- */

/**
 * Row and header heights used only to pick a default page size. At the compact
 * spacing above a row is ~32px with one line of text and ~47px where a cell
 * stacks a caption under its value, so the estimate sits above the middle:
 * overshooting the row count pushes a table's footer off the screen, while
 * undershooting only leaves a little slack.
 */
const ROW_H = 44;
const HEADER_H = 40;

/**
 * Everything on screen that is not the table body: the app bar and tab strip,
 * the page title, a filter row, and the table's own pagination footer.
 * Measured from the CRQ screens, which carry the most chrome of any table
 * page, so the pagination bar stays reachable rather than being pushed under
 * the fold — it is the control that holds the rows-per-page ladder.
 */
const PAGE_CHROME = 356;

/** The page sizes a default may snap to — all of them rungs on the ladder. */
const FIT_STEPS = [5, 10, 15, 20, 25];

/**
 * How many rows a page should hold, chosen from the height of the *viewport*.
 *
 * Deliberately not measured from the table or its container. This shell nests
 * several `overflow: auto` boxes and only `html` has a stable scrollbar
 * gutter, so any component that sets its own height from its own measured box
 * can oscillate: content grows, a scrollbar appears, the box narrows, the
 * content shrinks, the scrollbar leaves. The viewport is strictly upstream of
 * anything this table does, so reading it cannot feed back.
 *
 * It also only seeds `initialState`, which Material React Table reads once —
 * resizing the window never yanks the page size out from under the user, and
 * an explicit choice from the rows-per-page control always wins.
 */
function useViewportPageSize(): number {
  // One query per rung, at the height where that many rows plus the page's
  // chrome first fit. Snapping to ladder values keeps the rows-per-page
  // control tidy — the default is always a size already on the list.
  const fits = [
    useMediaQuery(`(min-height: ${PAGE_CHROME + FIT_STEPS[0] * ROW_H + HEADER_H}px)`),
    useMediaQuery(`(min-height: ${PAGE_CHROME + FIT_STEPS[1] * ROW_H + HEADER_H}px)`),
    useMediaQuery(`(min-height: ${PAGE_CHROME + FIT_STEPS[2] * ROW_H + HEADER_H}px)`),
    useMediaQuery(`(min-height: ${PAGE_CHROME + FIT_STEPS[3] * ROW_H + HEADER_H}px)`),
    useMediaQuery(`(min-height: ${PAGE_CHROME + FIT_STEPS[4] * ROW_H + HEADER_H}px)`),
  ];

  let size = FIT_STEPS[0];
  fits.forEach((fitsHere, i) => {
    if (fitsHere) size = FIT_STEPS[i];
  });
  return size;
}

/* ---------------------------------------------------------------- */
/* The preset                                                        */
/* ---------------------------------------------------------------- */

function buildPreset<TData extends MRT_RowData>(
  theme: Theme,
  tk: ReturnType<typeof useTabColorTokens>,
  options: AppTableOptions<TData>,
  viewportPageSize: number,
): Partial<MRT_TableOptions<TData>> {
  const cfg = options.appTable ?? {};
  const down = theme.breakpoints.down("sm");

  // Hairlines, written out rather than derived from `tk.border` with `alpha()`:
  // that token is already translucent, and MUI's `alpha()` *replaces* the alpha
  // channel instead of scaling it, so alpha(border, 0.7) turned a 0.08 tint
  // into a near-solid 0.7 rule — the heavy grid lines this replaces.
  const rowLine = tk.isDark ? "rgba(255,255,255,0.05)" : "rgba(13,27,42,0.055)";
  const headLine = tk.isDark ? "rgba(255,255,255,0.09)" : "rgba(13,27,42,0.10)";

  // A page of rows plus the header is exactly what the body is allowed to
  // be, so a full page fills the frame and no row is left half-visible.
  // `vh` caps it on short screens; the px floor keeps a usable body when the
  // window is very small.
  // The body is bounded by the space the viewport actually has left, not by a
  // predicted pixel height for N rows: row height varies with cell content, so
  // a predicted box is either too short (an inner scrollbar over a half-empty
  // page) or too tall. Pairing this with a page size chosen for the same
  // viewport means a full page normally lands inside it with no inner scroll,
  // and a denser-than-average table simply scrolls under its sticky header.
  const maxHeight =
    cfg.maxHeight === undefined
      ? `max(240px, calc(100vh - ${PAGE_CHROME}px))`
      : cfg.maxHeight;

  return {
    // ── Behaviour ────────────────────────────────────────────────────
    // A header that stays put is what makes a long table readable, and
    // compact density is the only one that fits the app's 12px type
    // scale without the rows looking padded apart.
    // Density is fixed rather than user-toggled — it is one of the things
    // that was drifting per screen — but full screen stays available,
    // since a wide grid is genuinely easier to read expanded.
    enableStickyHeader: true,
    enableDensityToggle: false,
    enableFullScreenToggle: true,
    enableColumnActions: false,
    positionGlobalFilter: "left",
    paginationDisplayMode: "pages",

    initialState: {
      density: "compact",
      showGlobalFilter: true,
      ...(options.initialState ?? {}),
      pagination: {
        pageIndex: 0,
        // Never the whole table: the default is a page sized to the screen,
        // and showing every row stays an explicit choice in the control.
        pageSize: viewportPageSize,
        ...(options.initialState?.pagination ?? {}),
      },
    },

    // ── Frame ────────────────────────────────────────────────────────
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        ...(cfg.frame === false
          ? { border: "none", borderRadius: 0, boxShadow: "none", backgroundColor: "transparent" }
          : {
              border: `1px solid ${tk.border}`,
              borderRadius: tk.radiusL,
              backgroundColor: tk.surface,
            }),
        overflow: "hidden",
        // Lets the frame sit in a flex column page without forcing its
        // parent wider than the viewport.
        width: "100%",
        maxWidth: "100%",
      },
    },

    // The one element allowed to scroll sideways. Keeping the overflow
    // here — rather than on the page — is what stops a wide grid from
    // dragging the whole layout horizontally on a phone.
    muiTableContainerProps: {
      sx: {
        ...(maxHeight === false ? {} : { maxHeight }),
        overflowX: "auto",
        overscrollBehaviorX: "contain",
      },
    },

    muiTableProps: {
      sx: {
        tableLayout: "auto",
        borderCollapse: "separate",
        borderSpacing: 0,
      },
    },

    // ── Header ───────────────────────────────────────────────────────
    // One quiet band across the top: a single anchoring rule underneath it and
    // no vertical grid, so the column labels read as a caption for the data
    // rather than as another row of boxes.
    muiTableHeadCellProps: {
      sx: {
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: tk.textSecondary,
        backgroundColor: tk.surface2,
        borderBottom: `1px solid ${headLine}`,
        py: 0.75,
        px: 1.25,
        whiteSpace: "nowrap",
        "& .Mui-TableHeadCell-Content-Labels": { gap: "4px" },
        // Sort/expand affordances sit quietly until the header is hovered.
        "& .MuiTableSortLabel-icon": { opacity: 0.35 },
        "&:hover .MuiTableSortLabel-icon": { opacity: 0.75 },
        [down]: { fontSize: 10, py: 0.6, px: 1 },
      },
    },

    // ── Body ─────────────────────────────────────────────────────────
    // Compact by default: the separator is a hairline that groups rows rather
    // than drawing a grid, and the padding is tuned so a row of plain text
    // lands near 32px instead of the ~53px the old spacing produced.
    muiTableBodyCellProps: {
      sx: {
        fontSize: 12.5,
        lineHeight: 1.45,
        py: 0.55,
        px: 1.25,
        borderBottom: `1px solid ${rowLine}`,
        verticalAlign: "middle",
        [down]: { fontSize: 12, py: 0.5, px: 1 },
      },
    },

    muiTableBodyRowProps: {
      hover: true,
      sx: {
        transition: "background-color 120ms ease",
        ...(cfg.zebra
          ? {
              "&:nth-of-type(even) > td": {
                backgroundColor: tk.isDark
                  ? "rgba(255,255,255,0.015)"
                  : "rgba(13,27,42,0.012)",
              },
            }
          : {}),
        "&:hover > td": { backgroundColor: tk.accentDim },
        "&:last-of-type > td": { borderBottom: "none" },
      },
    },

    // ── Toolbars ─────────────────────────────────────────────────────
    // Both toolbars wrap instead of overflowing: on a narrow screen the
    // search field, the actions and the pagination stack rather than
    // clipping whichever one happens to be last.
    // Note: neither toolbar may have its `minHeight` unset. Material React
    // Table nests an `overflow: hidden` box inside each one, and without the
    // Toolbar's minimum that box collapses to a few pixels and clips the
    // controls it holds — including the rows-per-page ladder in the footer.
    muiTopToolbarProps: {
      sx: {
        backgroundColor: "transparent",
        borderBottom: `1px solid ${tk.border}`,
        flexWrap: "wrap",
        gap: 1,
        rowGap: 1,
      },
    },

    muiBottomToolbarProps: {
      sx: {
        backgroundColor: tk.surface2,
        borderTop: `1px solid ${tk.border}`,
        [down]: { "& > .MuiBox-root": { justifyContent: "center" } },
      },
    },

    // ── Empty state ──────────────────────────────────────────────────
    renderEmptyRowsFallback: () => (
      <AppTableEmptyState
        title={cfg.emptyTitle}
        description={cfg.emptyDescription}
        isError={cfg.isError}
      />
    ),

    muiSearchTextFieldProps: {
      size: "small",
      variant: "outlined",
      placeholder: "Search",
      sx: {
        minWidth: 200,
        maxWidth: 320,
        "& .MuiOutlinedInput-root": { borderRadius: tk.radiusPill, fontSize: 12.5 },
      },
    },

    // ── Pagination ───────────────────────────────────────────────────
    // The function form is deliberate: the option ladder is rebuilt from
    // the live filtered row count and the live page size, so "All" always
    // names a number that is currently true.
    muiPaginationProps: ({ table }) => ({
      shape: "rounded",
      variant: "outlined",
      size: "small",
      showFirstButton: true,
      showLastButton: true,
      rowsPerPageOptions: buildRowsPerPageOptions(resolveTotalRowCount(table, options), {
        pageSizes: cfg.pageSizes ?? DEFAULT_PAGE_SIZES,
        showAllOption: cfg.showAllOption ?? true,
        allOptionMaxRows: cfg.allOptionMaxRows ?? DEFAULT_ALL_OPTION_MAX_ROWS,
        currentPageSize: table.getState().pagination.pageSize,
      }),
      sx: {
        "& .MuiPaginationItem-root": { fontSize: 12, minWidth: 28, height: 28 },
        "& .MuiInputBase-root": { fontSize: 12.5 },
      },
    }),
  };
}

/* ---------------------------------------------------------------- */
/* Public hooks                                                      */
/* ---------------------------------------------------------------- */

const STYLE_KEYS = [
  "muiTablePaperProps",
  "muiTableContainerProps",
  "muiTableProps",
  "muiTableHeadCellProps",
  "muiTableBodyCellProps",
  "muiTableBodyRowProps",
  "muiTopToolbarProps",
  "muiBottomToolbarProps",
  "muiSearchTextFieldProps",
  "muiPaginationProps",
] as const;

/**
 * The app's table options with a feature's own merged over the top.
 * Use this when a screen needs the raw options object; most callers
 * want {@link useAppTable}.
 */
export function useAppTableOptions<TData extends MRT_RowData>(
  options: AppTableOptions<TData>,
): MRT_TableOptions<TData> {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);
  const viewportPageSize = useViewportPageSize();

  const { appTable: _appTable, ...featureOptions } = options;
  const preset = buildPreset(theme, tk, options, viewportPageSize);

  const merged = {
    ...preset,
    ...featureOptions,
    // initialState was already merged key-by-key inside the preset; the
    // spread above would otherwise put the feature's partial object back.
    initialState: preset.initialState,
  } as Record<string, unknown>;

  for (const key of STYLE_KEYS) {
    merged[key] = mergeMuiProps(
      preset[key] as PropOrFn<unknown>,
      (featureOptions as Record<string, unknown>)[key] as PropOrFn<unknown>,
    );
  }

  return merged as unknown as MRT_TableOptions<TData>;
}

/**
 * Drop-in replacement for `useMaterialReactTable` that applies the shared
 * design and the row-count-aware pagination.
 */
export function useAppTable<TData extends MRT_RowData>(
  options: AppTableOptions<TData>,
): MRT_TableInstance<TData> {
  return useMaterialReactTable(useAppTableOptions(options));
}
