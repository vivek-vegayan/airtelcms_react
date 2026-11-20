import type { ReactNode } from "react";
import { Box } from "@mui/material";
import type { SystemStyleObject } from "@mui/system";
import { alpha, type Theme } from "@mui/material/styles";
import { useP1 } from "../hooks/useP1Context";

export interface P1Column<R> {
  key: string;
  header: ReactNode;
  /** Column name in the Excel export; defaults to `header` when that is plain text. */
  exportHeader?: string;
  align?: "left" | "right";
  cell: (row: R, index: number) => ReactNode;
  /** Raw value for the Excel export. A column without it is left out of the file. */
  exportValue?: (row: R) => string | number | null | undefined;
  /** Totals-row cell. */
  foot?: ReactNode;
  /** Per-cell style (heat shading, highlighted column). */
  cellSx?: (row: R) => SystemStyleObject<Theme> | undefined;
  headSx?: SystemStyleObject<Theme>;
  /** Let a long header wrap instead of widening the column. */
  wrapHeader?: boolean;
}

interface Props<R> {
  columns: readonly P1Column<R>[];
  rows: readonly R[];
  rowKey: (row: R, index: number) => string | number;
  /** Keep the first column in view while the table scrolls sideways. */
  stickyFirst?: boolean;
  /** Scroll the body beyond this height (px) with the header pinned. */
  maxHeight?: number;
}

/** Dense, theme-aware table used by every Phase 1 card. Numbers are tabular and right-aligned. */
export function P1Table<R>({ columns, rows, rowKey, stickyFirst, maxHeight }: Props<R>) {
  const { colors } = useP1();
  const t = colors.tokens;
  const hoverTint = alpha(t.textPrimary, t.isDark ? 0.07 : 0.05);
  const hasFoot = columns.some((c) => c.foot != null);

  const sticky = (i: number, bg: string): SystemStyleObject<Theme> =>
    stickyFirst && i === 0 ? { position: "sticky", left: 0, zIndex: 1, background: bg } : {};

  return (
    <Box sx={{ overflow: "auto", maxHeight, border: `1px solid ${t.border}`, borderRadius: t.radius }}>
      <Box
        component="table"
        sx={{
          borderCollapse: "separate",
          borderSpacing: 0,
          width: "100%",
          fontSize: 12.5,
          "& th, & td": { padding: "8px 12px", whiteSpace: "nowrap", verticalAlign: "middle", borderBottom: `1px solid ${t.border}` },
          "& td": { fontVariantNumeric: "tabular-nums", color: t.textPrimary },
          // Row hover is a light tint laid over each cell's own colour (background-image), so cells
          // that carry a colour (heat-map shades) keep it and their text stays readable.
          "& tbody tr:hover td": { backgroundImage: `linear-gradient(${hoverTint}, ${hoverTint})` },
          "& tbody tr:last-of-type td": { borderBottom: hasFoot ? undefined : "none" },
          "& tfoot td": { fontWeight: 700, background: t.surface2, borderBottom: "none" },
        }}
      >
        <thead>
          <tr>
            {columns.map((c, i) => (
              <Box
                component="th"
                key={c.key}
                scope="col"
                sx={{
                  textAlign: c.align ?? "left",
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: ".05em",
                  textTransform: "uppercase",
                  color: t.textSecondary,
                  background: t.surface2,
                  position: maxHeight ? "sticky" : undefined,
                  top: maxHeight ? 0 : undefined,
                  zIndex: maxHeight ? 2 : undefined,
                  ...(c.wrapHeader ? { whiteSpace: "normal !important", lineHeight: 1.3, verticalAlign: "bottom !important" } : {}),
                  ...sticky(i, t.surface2),
                  ...(stickyFirst && i === 0 && maxHeight ? { zIndex: 3 } : {}),
                  ...c.headSx,
                }}
              >
                {c.header}
              </Box>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            // The position makes every key unique even when the data repeats a value (several
            // rows with OLM id "REMEDY"); duplicate keys leave stale rows on screen after a filter.
            <tr key={`${rowKey(r, ri)}#${ri}`}>
              {columns.map((c, i) => (
                <Box component="td" key={c.key} sx={{ textAlign: c.align ?? "left", ...sticky(i, t.surface), ...c.cellSx?.(r) }}>
                  {c.cell(r, ri)}
                </Box>
              ))}
            </tr>
          ))}
        </tbody>
        {hasFoot && rows.length > 0 && (
          <tfoot>
            <tr>
              {columns.map((c, i) => (
                <Box component="td" key={c.key} sx={{ textAlign: c.align ?? "left", ...sticky(i, t.surface2) }}>
                  {c.foot}
                </Box>
              ))}
            </tr>
          </tfoot>
        )}
      </Box>
    </Box>
  );
}
