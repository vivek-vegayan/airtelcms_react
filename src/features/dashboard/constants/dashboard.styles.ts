import type { CSSProperties } from "react";
import type { Colors } from "../types/colorTypes";
import type { ToneKey } from "../types/dashboard.types";

/** Standard card shell shared by every dashboard widget, theme (light/dark) aware. */
export const getCardSx = (c: Colors) => ({
  borderRadius: "16px",
  border: `1.5px solid ${c.border}`,
  boxShadow: c.isDark ? "0 2px 12px rgba(0,0,0,.4)" : "0 2px 12px rgba(60,60,140,.06)",
  background: c.surface,
  transition: "box-shadow .22s ease, border-color .22s ease, transform .22s ease",
  "&:hover": {
    borderColor: c.borderHover,
    boxShadow: getHoverShadow(c),
    transform: "translateY(-2px)",
  },
});

export const getHoverShadow = (c: Colors) =>
  c.isDark ? "0 8px 26px rgba(0,0,0,.5)" : "0 8px 28px rgba(60,60,140,.11)";

/** Resolve a semantic tone key to its theme colour + soft background. */
export const getToneStyles = (c: Colors): Record<ToneKey, { color: string; light: string; border: string }> => ({
  accent: { color: c.accent, light: c.accentDim, border: c.accentBorder },
  success: { color: c.success, light: c.successDim, border: c.successBorder },
  warning: { color: c.warning, light: c.warningDim, border: c.warningBorder },
  danger: { color: c.danger, light: c.dangerDim, border: c.dangerBorder },
  info: { color: c.info, light: c.infoDim, border: c.infoBorder },
});

/** Staggered mount-in fade/slide, shared across widgets. */
export const fadeIn = (mounted: boolean, delay: number): CSSProperties => ({
  opacity: mounted ? 1 : 0,
  transform: mounted ? "none" : "translateY(12px)",
  transition: `opacity 0.45s ease ${delay}s, transform 0.45s ease ${delay}s`,
});

/** Expanding ring pulse — used for "live"/"now" markers (attendance timeline, active session dot). */
export const pulseRingSx = (color: string) => ({
  "@keyframes dashboardPulseRing": {
    "0%": { boxShadow: `0 0 0 0 ${color}` },
    "70%": { boxShadow: "0 0 0 8px transparent" },
    "100%": { boxShadow: "0 0 0 0 transparent" },
  },
  animation: "dashboardPulseRing 1.8s ease-out infinite",
});

/** Soft breathing glow, used behind the hero live timer while clocked in. */
export const pulseGlowSx = (color: string) => ({
  "@keyframes dashboardPulseGlow": {
    "0%, 100%": { opacity: 0.35, transform: "scale(0.96)" },
    "50%": { opacity: 0.7, transform: "scale(1.04)" },
  },
  animation: "dashboardPulseGlow 2.6s ease-in-out infinite",
  background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
});

/* ══════════════ Shared layout metrics ══════════════
 * One source of truth for the Overview tab's outer box and grid tracks, used
 * by both <ModernHomeDashboard> and <DashboardSkeleton> so the placeholder
 * occupies the exact slots the real widgets land in — nothing shifts when the
 * data arrives, at any width.
 */

/** Page gutters. The 32px sides are not arbitrary: the shared module tab strip
 *  pads its <Tabs> by 16px and MUI pads each <Tab> by another 16px, so every
 *  tab label starts 32px in. Matching it puts the cards on the same vertical
 *  line as "Overview" above them. Phones trade that alignment for the width. */
export const DASHBOARD_PAGE_PADDING = {
  xs: "12px 14px 24px",
  sm: "16px 32px 32px",
} as const;

/** Gap between every dashboard card, tightened on small screens. */
export const DASHBOARD_GRID_GAP = { xs: "12px", sm: "14px", md: "16px" } as const;

/** Outer grid: single column on phones, fluid rail + content from "md" up.
 *  The rail only becomes a hard 300px at "lg" — between 900px and 1200px it
 *  shrinks with the viewport instead of squeezing the content column. */
export const DASHBOARD_MAIN_COLUMNS = {
  xs: "1fr",
  md: "clamp(220px, 24vw, 280px) minmax(0, 1fr)",
  lg: "300px minmax(0, 1fr)",
  xl: "320px minmax(0, 1fr)",
} as const;

/** Assignments + KPI tiles sit side by side only from "lg": at "md" the outer
 *  rail has already taken its share, so splitting again would leave two
 *  ~250px columns with nowhere to put their content. */
export const DASHBOARD_CONTENT_TOP_COLUMNS = {
  xs: "1fr",
  lg: "minmax(0, 1fr) minmax(0, 1fr)",
} as const;

/** Thin, theme-aware scrollbar for the widgets that scroll inside themselves
 *  (assignment list, week strip on narrow screens). */
export const getInnerScrollSx = (c: Colors) => ({
  scrollbarWidth: "thin" as const,
  scrollbarColor: `${c.border} transparent`,
  "&::-webkit-scrollbar": { width: 6, height: 6 },
  "&::-webkit-scrollbar-track": { background: "transparent" },
  "&::-webkit-scrollbar-thumb": {
    background: c.border,
    borderRadius: "99px",
    "&:hover": { background: c.borderHover },
  },
});
