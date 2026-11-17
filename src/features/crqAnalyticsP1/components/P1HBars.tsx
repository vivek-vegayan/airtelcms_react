import { Box, Tooltip } from "@mui/material";
import { useP1 } from "../hooks/useP1Context";
import { fmtN } from "../utils/p1Format";

export interface P1HBarSeg {
  value: number;
  color: string;
  onClick?: () => void;
}

export interface P1HBarRow {
  key: string;
  label: string;
  value: number;
  color?: string;
  /** Stacked parts; when given they replace the single bar. */
  segs?: P1HBarSeg[];
  /** Text at the right end (defaults to the value). */
  text?: string;
  onClick?: () => void;
  /** Tooltip lines: [label, value]. */
  tip?: [string, string][];
}

/** Ranked horizontal bars as plain rows: long labels stay readable and each row can be clicked. */
export function P1HBars({ rows, max }: { rows: readonly P1HBarRow[]; max?: number }) {
  const { colors } = useP1();
  const t = colors.tokens;
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: "2px" }}>
      {rows.map((r) => {
        const segs = (r.segs ?? [{ value: r.value, color: r.color ?? colors.received, onClick: undefined }]).filter((s) => s.value > 0);
        const row = (
          <Box
            role={r.onClick ? "button" : undefined}
            tabIndex={r.onClick ? 0 : undefined}
            onClick={r.onClick}
            onKeyDown={r.onClick ? (e) => (e.key === "Enter" || e.key === " ") && r.onClick?.() : undefined}
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "110px minmax(0,1fr) auto", sm: "190px minmax(0,1fr) auto" },
              alignItems: "center",
              gap: "10px",
              minHeight: 28,
              px: "4px",
              borderRadius: "6px",
              cursor: r.onClick ? "pointer" : "default",
              "&:hover": { background: t.surface2 },
              "&:focus-visible": { outline: `2px solid ${t.accent}`, outlineOffset: 1 },
            }}
          >
            <Box sx={{ fontSize: 12.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: t.textPrimary }} title={r.label}>
              {r.label}
            </Box>
            <Box sx={{ display: "flex", gap: "2px", height: 12, background: t.trackOff, borderRadius: "6px", overflow: "hidden" }}>
              {segs.map((s, i) => (
                <Box
                  key={i}
                  onClick={
                    s.onClick
                      ? (e) => {
                          e.stopPropagation();
                          s.onClick?.();
                        }
                      : undefined
                  }
                  sx={{ width: `${(s.value / top) * 100}%`, minWidth: 3, background: s.color, cursor: s.onClick || r.onClick ? "pointer" : "default", "&:hover": s.onClick ? { opacity: 0.8 } : undefined }}
                />
              ))}
            </Box>
            <Box sx={{ minWidth: 64, textAlign: "right", fontSize: 12.5, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: t.textPrimary }}>
              {r.text ?? fmtN(r.value)}
            </Box>
          </Box>
        );
        if (!r.tip?.length) return <Box key={r.key}>{row}</Box>;
        return (
          <Tooltip
            key={r.key}
            arrow
            placement="top"
            title={
              <Box sx={{ fontSize: 12 }}>
                <Box sx={{ fontWeight: 700, mb: "2px" }}>{r.label}</Box>
                {r.tip.map(([k, v]) => (
                  <Box key={k} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
                    <span>{k}</span>
                    <b>{v}</b>
                  </Box>
                ))}
              </Box>
            }
          >
            {row}
          </Tooltip>
        );
      })}
    </Box>
  );
}
