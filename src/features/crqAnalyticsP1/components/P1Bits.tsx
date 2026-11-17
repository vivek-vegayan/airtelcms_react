import type { ReactNode } from "react";
import { Box, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from "@mui/material";
import { useP1 } from "../hooks/useP1Context";
import type { P1Drill } from "../types/crqAnalyticsP1.types";
import { STAGES, fmtN, num } from "../utils/p1Format";

/** A count that opens the CRQs behind it. 0 (or no drill) renders as plain muted text. */
export function Num({
  v,
  d,
  bold,
  color,
  text,
}: {
  v: number | null | undefined;
  d?: P1Drill;
  bold?: boolean;
  color?: string;
  /** Shown instead of the formatted count (hours, "360/480" ...). */
  text?: string;
}) {
  const { openDrill, colors } = useP1();
  const n = num(v);
  if (!n || !d) {
    return (
      <Box component="span" sx={{ color: n ? "inherit" : colors.tokens.textDim, fontWeight: bold && n ? 700 : undefined }}>
        {text ?? fmtN(n)}
      </Box>
    );
  }
  return (
    <Box
      component="button"
      type="button"
      onClick={() => openDrill(d)}
      title="Show the CRQs"
      sx={{
        all: "unset",
        cursor: "pointer",
        color: color ?? colors.tokens.accent,
        fontWeight: bold ? 700 : 500,
        fontVariantNumeric: "tabular-nums",
        "&:hover": { textDecoration: "underline" },
        "&:focus-visible": { outline: `2px solid ${colors.tokens.accent}`, outlineOffset: 2, borderRadius: "2px" },
      }}
    >
      {text ?? fmtN(n)}
    </Box>
  );
}

/** "Range · last 7 days" / "Now" chip beside a card title: says which window the card counts. */
export function Tag({ kind, text }: { kind: "range" | "now" | "own"; text?: string }) {
  const { colors } = useP1();
  const t = colors.tokens;
  const tone = kind === "range" ? { bg: t.infoDim, fg: t.info } : { bg: t.surface2, fg: t.textSecondary };
  const label = kind === "range" ? "Range" : kind === "now" ? "Now" : "";
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        fontSize: 10.5,
        fontWeight: 700,
        px: "8px",
        py: "2px",
        borderRadius: t.radiusPill,
        background: tone.bg,
        color: tone.fg,
        whiteSpace: "nowrap",
        verticalAlign: "middle",
      }}
    >
      {[label, text].filter(Boolean).join(" · ")}
    </Box>
  );
}

export function Legend({ items }: { items: readonly { label: string; color: string }[] }) {
  const { colors } = useP1();
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", alignItems: "center" }}>
      {items.map((i) => (
        <Box key={i.label} sx={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: 12, color: colors.tokens.textSecondary }}>
          <Box sx={{ width: 10, height: 10, borderRadius: "2px", background: i.color, flexShrink: 0 }} />
          {i.label}
        </Box>
      ))}
    </Box>
  );
}

export function SideTag({ side }: { side: string | null | undefined }) {
  const { colors } = useP1();
  const color = side === "CCB" ? colors.ccb : side === "SE" ? colors.se : colors.cancelled;
  return (
    <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap" }}>
      <Box sx={{ width: 8, height: 8, borderRadius: "2px", background: color }} />
      {side ?? "—"}
    </Box>
  );
}

/** Small exclusive toggle (Circle / Region, 6 / 12 months, Chart / Table, night ranges). */
export function Seg<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <ToggleButtonGroup
      size="small"
      color="primary"
      exclusive
      value={value}
      aria-label={ariaLabel}
      onChange={(_e, v: T | null) => v != null && onChange(v)}
    >
      {options.map((o) => (
        <ToggleButton key={String(o.value)} value={o.value} sx={{ textTransform: "none", px: 1.25, py: "3px", fontSize: 12, fontWeight: 600 }}>
          {o.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

type Tone = "info" | "success" | "warning" | "danger" | "none";

const RESULT_META: Record<string, { label: string; tone: Tone }> = {
  OPEN: { label: "Open", tone: "info" },
  FAILED: { label: "Failed", tone: "danger" },
  RESCHEDULED: { label: "Rescheduled", tone: "warning" },
  DONE: { label: "Done", tone: "success" },
  CANCELLED: { label: "Cancelled", tone: "none" },
  REJECTED: { label: "Rejected", tone: "danger" },
  UNKNOWN: { label: "Type not mapped yet", tone: "none" },
};

/** Where a CRQ stands: its result, or for an open CRQ a FAILED / RESCHEDULED current status. */
export function ResultPill({ result, currentStatus }: { result: string | null | undefined; currentStatus?: string | null }) {
  const { colors } = useP1();
  const t = colors.tokens;
  const meta = (result === "OPEN" ? RESULT_META[currentStatus ?? ""] : undefined) ?? RESULT_META[result ?? ""] ?? RESULT_META.UNKNOWN;
  const tone = {
    info: { bg: t.infoDim, fg: t.info },
    success: { bg: t.successDim, fg: t.success },
    warning: { bg: t.warningDim, fg: t.warning },
    danger: { bg: t.dangerDim, fg: t.danger },
    none: { bg: t.surface2, fg: t.textSecondary },
  }[meta.tone];
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontSize: 11.5,
        fontWeight: 700,
        borderRadius: t.radiusPill,
        px: "9px",
        py: "3px",
        background: tone.bg,
        color: tone.fg,
        whiteSpace: "nowrap",
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
      {meta.label}
    </Box>
  );
}

/** Seven dots: stages done are filled, the current one is ringed; CCB and SE have their own colour. */
export function StageTracker({ stageNo, result }: { stageNo: number; result: string }) {
  const { colors } = useP1();
  return (
    <Box component="span" aria-label={`Stage ${stageNo} of 7`} sx={{ display: "inline-flex", alignItems: "center", gap: "3px", verticalAlign: "middle" }}>
      {STAGES.map((s) => {
        const color = s.side === "CCB" ? colors.ccb : colors.se;
        const done = result === "DONE" || s.no < stageNo;
        const current = s.no === stageNo && result === "OPEN";
        return (
          <Tooltip key={s.no} title={s.label} arrow>
            <Box
              sx={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                boxSizing: "border-box",
                border: `2px solid ${done || current ? color : colors.tokens.border}`,
                background: done ? color : "transparent",
                ml: s.no === 5 ? "5px" : 0,
              }}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
}

/** Section heading inside a view ("Overview", "Circle & region" ...); id is the jump-bar target. */
export function Section({ id, title, right }: { id?: string; title: string; right?: ReactNode }) {
  const { colors } = useP1();
  return (
    <Box
      id={id}
      sx={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 1.5,
        mt: 1,
        pt: 1.5,
        borderTop: `1px solid ${colors.tokens.border}`,
        scrollMarginTop: "12px",
      }}
    >
      <Typography sx={{ fontSize: 12.5, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: colors.tokens.textPrimary }}>
        {title}
      </Typography>
      <Box sx={{ flex: 1 }} />
      {right}
    </Box>
  );
}
