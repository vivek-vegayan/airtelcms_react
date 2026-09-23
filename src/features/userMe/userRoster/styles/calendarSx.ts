import { alpha, type Theme } from "@mui/material/styles";
import type { SxProps } from "@mui/material";
import type { CalendarTokens } from "../constants/calendarTokens";

/**
 * Day-state classes stamped onto rbc's own day nodes by `dayPropGetter`.
 *
 * `dayPropGetter` reaches all three places a day is drawn — the Month
 * background cell, the Week/Day column, and the time-view column heading —
 * so one getter keeps every view's weekend/holiday/today/selected language
 * identical. (The first pass used `dateCellWrapper`, which only exists in
 * the Month view, which is why Week and Day came out unstyled.)
 */
export const DAY_CLASS = {
  weekend: "roster-day--weekend",
  holiday: "roster-day--holiday",
  today: "roster-day--today",
  selected: "roster-day--selected",
} as const;

/**
 * Exact heights of the two Week/Day header bands. The gutter corner spans
 * both and has to align its "All day" label with the second one, so these
 * are shared rather than duplicated as magic numbers on either side.
 */
// 64 = 6 pad + 10 weekday + 2 + 26 date pill + 2 + 11 indicator strip + 6 pad.
export const TIME_HEADER_ROW_H = 64;
export const ALL_DAY_ROW_H = 32;

/**
 * Full visual override for react-big-calendar's stock stylesheet.
 *
 * Everything here is scoped under the wrapper's generated class, so every
 * rule is one class more specific than the vendor CSS it replaces, and
 * nothing leaks to the rest of the app. The single `!important` is aimed at
 * an inline style rbc writes from JS, which specificity alone cannot reach.
 */

export const buildCalendarSx = (
  t: CalendarTokens,
  theme: Theme,
): SxProps<Theme> => ({
  // No sizing at this level on purpose — the host Box owns the height, and
  // a `height: 100%` here would win the merge and flatten it.
  //
  // The host is a flex column, so the calendar takes the remainder via
  // `flex` rather than the vendor's `height: 100%`. A percentage height
  // against a flex-sized parent is exactly the ambiguity that produces a
  // zero-height or overflowing grid depending on the browser.
  "& .rbc-calendar": {
    flex: 1,
    minHeight: 0,
    minWidth: 0,
    fontFamily: "inherit",
    color: t.text,
  },

  /* ── Frame ─────────────────────────────────────────────────────────── */
  // `flex: 1 1 0` rather than rbc's own `1 0 0`: the stock rule lets the
  // view grow but never shrink, so once its rows added up to more than the
  // frame had, the surplus was silently swallowed by `overflow: hidden`
  // instead of being divided out. Shrinkable, it always matches its slot.
  "& .rbc-month-view, & .rbc-time-view": {
    border: `1px solid ${t.grid}`,
    borderRadius: `${t.radius}px`,
    background: t.surface,
    overflow: "hidden",
    flex: "1 1 0%",
    minHeight: 0,
  },

  /* ── Month weekday header row ──────────────────────────────────────── */
  "& .rbc-month-header": {
    background: t.surfaceHeader,
    borderBottom: `1px solid ${t.grid}`,
    // Holds its own height while the week rows below absorb the shrinking.
    flex: "0 0 auto",
  },
  "& .rbc-month-view .rbc-header": {
    padding: "10px 8px",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: t.textMuted,
    borderBottom: "none",
    minHeight: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  "& .rbc-header + .rbc-header": { borderLeft: `1px solid ${t.grid}` },
  "& .rbc-header .rbc-button-link": { cursor: "default", fontWeight: "inherit" },

  /* ── Month grid ────────────────────────────────────────────────────── */
  // Every week of the month has to be on screen — a month that ends on a
  // sixth row must still show that row.
  //
  // The weeks divide the frame instead of claiming a fixed height each: a
  // per-row `min-height` taller than frame ÷ rows is exactly what pushed
  // the last week (and with it the 30th/31st) out through the frame's
  // `overflow: hidden`. rbc measures the row it actually gets and turns any
  // surplus events into "+ n more", so shorter rows lose no information.
  "& .rbc-month-row": {
    borderTop: `1px solid ${t.grid}`,
    flex: "1 1 0%",
    minHeight: 0,
  },
  "& .rbc-month-row:first-of-type": { borderTop: "none" },
  "& .rbc-day-bg": {
    position: "relative",
    transition: "background-color .16s ease, box-shadow .16s ease",
  },
  "& .rbc-day-bg + .rbc-day-bg": { borderLeft: `1px solid ${t.grid}` },
  // Hover lives on a pseudo-element so it layers over the state fill below
  // rather than competing with it.
  "& .rbc-day-bg::after": {
    content: '""',
    position: "absolute",
    inset: 0,
    backgroundColor: "transparent",
    transition: "background-color .16s ease",
    pointerEvents: "none",
  },
  "& .rbc-day-bg:hover::after": { backgroundColor: t.hoverBg },

  /* ── Day states ────────────────────────────────────────────────────── */
  // Split deliberately into tints and decorations.
  //
  // `dayPropGetter` also stamps these classes on the day cells *inside* the
  // 32px all-day strip. A tint there is right; an inset bar is not — that is
  // what drew a stray accent rule immediately under the Week headings.
  // So fills apply everywhere, and bars/rings only to the full-size
  // surfaces: the Month cell and the Week/Day column.

  /* Fills — weakest first; later rules win ties. */
  [`& .rbc-day-bg.${DAY_CLASS.weekend}, & .rbc-day-slot.${DAY_CLASS.weekend}`]: {
    backgroundColor: t.weekendBg,
  },
  // Off-range must out-rank weekend, hence the two-class selector.
  "& .rbc-day-bg.rbc-off-range-bg": { backgroundColor: t.offRangeBg },
  "& .rbc-off-range-bg": { backgroundColor: t.offRangeBg },
  "& .rbc-off-range": { color: t.offRangeText },
  [`& .rbc-day-bg.${DAY_CLASS.holiday}, & .rbc-day-slot.${DAY_CLASS.holiday}`]: {
    backgroundColor: t.holidayBg,
  },
  [`& .rbc-day-bg.${DAY_CLASS.today}, & .rbc-day-slot.${DAY_CLASS.today}`]: {
    backgroundColor: t.todayBg,
  },
  [`& .rbc-day-bg.${DAY_CLASS.selected}, & .rbc-day-slot.${DAY_CLASS.selected}`]:
    { backgroundColor: t.selectedBg },

  /* Decorations — full-size day surfaces only. */
  [`& .rbc-month-view .rbc-day-bg.${DAY_CLASS.holiday}, & .rbc-day-slot.${DAY_CLASS.holiday}`]:
    { boxShadow: `inset 3px 0 0 ${alpha(t.holiday, 0.5)}` },
  [`& .rbc-month-view .rbc-day-bg.${DAY_CLASS.today}`]: {
    boxShadow: `inset 0 2px 0 ${t.accent}`,
  },
  [`& .rbc-month-view .rbc-day-bg.${DAY_CLASS.selected}, & .rbc-day-slot.${DAY_CLASS.selected}`]:
    { boxShadow: `inset 0 0 0 2px ${t.accent}` },

  // Only today gets a heading tint. Tinting weekend headings too left grey
  // blocks sitting above plainly white columns, which read as a misalignment
  // rather than as a weekend — the muted heading text carries that instead.
  [`& .rbc-header.${DAY_CLASS.today}`]: { backgroundColor: t.todayBg },
  "& .rbc-slot-selection, & .rbc-selected-cell": {
    backgroundColor: alpha(t.accent, 0.18),
    color: t.text,
  },

  /* ── Month row content ─────────────────────────────────────────────── */
  // The event/date layer normally covers the whole row and swallows the
  // hover intended for the day cell underneath, which is why cell hover
  // used to only work in the lower half of a cell. Making the layer
  // transparent to the pointer — and re-arming the pieces that are
  // genuinely interactive — gives every cell an even hover target.
  // Slot selection is coordinate-based in rbc, so it is unaffected.
  "& .rbc-month-view .rbc-row-content": { pointerEvents: "none" },
  "& .rbc-month-view .rbc-event, & .rbc-month-view .rbc-show-more": {
    pointerEvents: "auto",
  },
  "& .rbc-date-cell": {
    padding: 0,
    textAlign: "left",
    minWidth: 0,
  },
  "& .rbc-row-segment": { padding: "0 3px 3px" },

  /* ── Events ────────────────────────────────────────────────────────── */
  // Colours come from `eventPropGetter` (inline); only the things inline
  // styles cannot express live here.
  "& .rbc-event": {
    outline: "none",
    transition: "transform .14s ease, box-shadow .14s ease",
  },
  "& .rbc-event:hover": {
    transform: "translateY(-1px)",
    boxShadow: t.shadowCard,
    zIndex: 6,
  },
  "& .rbc-event:focus-visible": {
    outline: `2px solid ${t.accent}`,
    outlineOffset: 1,
  },
  "& .rbc-event.rbc-selected": { boxShadow: `0 0 0 2px ${t.accent}` },
  "& .rbc-event-label": { fontSize: 10, opacity: 0.85 },
  "& .rbc-show-more": {
    background: "transparent",
    color: t.accent,
    fontWeight: 700,
    fontSize: 10.5,
    padding: "1px 5px",
    letterSpacing: "0.01em",
  },
  "& .rbc-show-more:hover, & .rbc-show-more:focus": {
    color: t.accent,
    textDecoration: "underline",
    background: "transparent",
  },

  /* ── "+ n more" popup ──────────────────────────────────────────────── */
  "& .rbc-overlay": {
    background: t.surfaceRaised,
    border: `1px solid ${t.grid}`,
    borderRadius: `${t.radius}px`,
    boxShadow: t.shadowPop,
    padding: 10,
    minWidth: 200,
  },
  "& .rbc-overlay-header": {
    background: t.surfaceHeader,
    borderBottom: `1px solid ${t.grid}`,
    borderRadius: `${t.radius}px ${t.radius}px 0 0`,
    margin: "-10px -10px 8px",
    padding: "8px 12px",
    fontSize: 12,
    fontWeight: 700,
    color: t.text,
  },

  /* ── Week / Day (time) views ───────────────────────────────────────── */
  // ── Heading ↔ column alignment ──
  // The day headings sit in a different scroll box from the columns they
  // label, so the two only line up if both reserve the same gutter for the
  // grid's scrollbar. rbc does that in JS — but only after `isOverflowing`
  // flips on a *later* render (it never checks on mount), and it measures
  // the browser's default scrollbar rather than the slim one this grid
  // actually draws. So the heading band stayed a scrollbar wider than the
  // grid, and every boundary from Sun to Sat drifted right of its column.
  //
  // Both bands now reserve their own gutter from identical CSS: the header
  // scrolls invisibly, the content scrolls for real, and their usable
  // widths are equal by construction — no measuring, nothing to get out of
  // sync on the first paint. rbc's inline margin is zeroed so the two
  // mechanisms cannot stack into a double offset.
  "& .rbc-time-header": {
    background: t.surfaceHeader,
    borderBottom: `1px solid ${t.grid}`,
    overflowY: "scroll",
    overflowX: "hidden",
    scrollbarWidth: "thin",
    scrollbarColor: "transparent transparent",
    "&::-webkit-scrollbar": { width: 6 },
    "&::-webkit-scrollbar-track, &::-webkit-scrollbar-thumb": {
      background: "transparent",
    },
  },
  "& .rbc-time-header.rbc-overflowing": { marginRight: "0px !important" },
  "& .rbc-time-header-content": {
    borderLeft: `1px solid ${t.grid}`,
    minWidth: 0,
  },
  // ── Header block geometry ──
  // Both bands get an exact height rather than a min, because the gutter
  // corner beside them has to line up with the all-day row to the pixel and
  // a `min-height` leaves that dependent on content. CalendarHeaders.tsx
  // imports ALL_DAY_ROW_H so both sides agree by construction.
  //
  // Deliberately no blanket `.rbc-time-view .rbc-row` min-height: the
  // heading row carries that class too, and a small value there is exactly
  // what cropped the column headings.
  "& .rbc-time-header-cell": {
    height: TIME_HEADER_ROW_H,
    minHeight: TIME_HEADER_ROW_H,
    borderBottom: `1px solid ${t.grid}`,
  },
  "& .rbc-time-view .rbc-header": {
    height: "100%",
    minHeight: 0,
    padding: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderBottom: "none",
    overflow: "visible",
    fontWeight: 400,
    textTransform: "none",
    letterSpacing: 0,
    color: t.text,
  },
  "& .rbc-time-header-gutter": {
    background: t.surfaceHeader,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: 0,
  },
  // All-day strip, pinned to a single row.
  //
  // rbc hardcodes `minRows: 2` on this row, so it always reserves two rows'
  // worth of height even when nothing needs the second — that empty ~30px
  // band was pure gap. `transformRosterToEvents` now guarantees at most one
  // event per calendar day (every shift — including night shifts, which run
  // past midnight in real time — is built as a same-day `allDay` entry; see
  // rosterTransform.ts), so a genuine second-row stack can no longer occur.
  // One row is right for this data.
  "& .rbc-time-view .rbc-allday-cell": {
    boxSizing: "border-box",
    height: ALL_DAY_ROW_H,
    minHeight: ALL_DAY_ROW_H,
    maxHeight: ALL_DAY_ROW_H,
    overflow: "hidden",
  },
  "& .rbc-allday-cell .rbc-row-content > .rbc-row + .rbc-row": {
    display: "none",
  },
  "& .rbc-allday-cell .rbc-row-segment": { padding: "2px 3px" },
  "& .rbc-time-view .rbc-allday-cell + .rbc-allday-cell": {
    borderLeft: `1px solid ${t.grid}`,
  },
  "& .rbc-time-content": {
    borderTop: `1px solid ${t.grid}`,
    // Always `scroll`, never `auto`: the gutter has to be reserved even in
    // the moment before the grid has scrollable content, or the columns
    // would jump sideways against the headings. Firefox needs the same
    // slim scrollbar the webkit rules below ask for — left to `auto` it
    // reserves ~17px here and the two bands stop matching.
    overflowY: "scroll",
    scrollbarWidth: "thin",
    scrollbarColor: `${t.isDark ? "#1E2D40" : "#CBD5E1"} transparent`,
    "&::-webkit-scrollbar": { width: 6, height: 6 },
    "&::-webkit-scrollbar-track": { background: "transparent" },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: t.isDark ? "#1E2D40" : "#CBD5E1",
      borderRadius: 6,
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: t.isDark ? "#2A3E57" : "#94A3B8",
    },
  },
  "& .rbc-time-content > * + * > *": { borderLeft: `1px solid ${t.grid}` },
  // 40px an hour brings a full day close to one screen instead of the
  // ~1100px of scrolling the default produced.
  "& .rbc-timeslot-group": {
    borderBottom: `1px solid ${t.grid}`,
    minHeight: 40,
  },
  "& .rbc-day-slot .rbc-time-slot": {
    borderTop: `1px dotted ${
      t.isDark ? "rgba(255,255,255,0.05)" : "rgba(13,27,42,0.05)"
    }`,
  },
  // rbc measures this column's real width in a rAF and copies it to the
  // header corner, so a min-width here is what gives the corner's "All day"
  // label room. Sized off "12 PM" plus the label, not off the hour text
  // alone — which is why the label was being clipped.
  "& .rbc-time-gutter": { background: t.surfaceSubtle, minWidth: 68 },
  "& .rbc-time-gutter .rbc-timeslot-group": { borderBottom: "none" },
  "& .rbc-label": {
    fontSize: 10.5,
    fontWeight: 600,
    color: t.textMuted,
    padding: "0 8px",
  },
  "& .rbc-current-time-indicator": {
    backgroundColor: t.accent,
    height: 2,
  },
  "& .rbc-day-slot .rbc-event, & .rbc-day-slot .rbc-background-event": {
    border: "none",
  },

  /* ── Drag & drop addon ─────────────────────────────────────────────── */
  "& .rbc-addons-dnd-dragged-event": { opacity: 0.45 },
  "& .rbc-addons-dnd .rbc-addons-dnd-resize-ns-anchor, & .rbc-addons-dnd .rbc-addons-dnd-resize-ew-anchor":
    { display: "none" },

  /* ── Responsive ────────────────────────────────────────────────────── */
  // Deliberately no per-breakpoint `.rbc-month-row` min-height: the rows
  // divide the frame at every width, and a floor here would clip the last
  // week again on exactly the short screens these rules target. The month
  // frame itself is what gets a definite height (see UserMonthlyRosterView).
  [theme.breakpoints.down("md")]: {
    "& .rbc-month-view .rbc-header": {
      fontSize: 10,
      padding: "8px 4px",
      letterSpacing: "0.05em",
    },
    "& .rbc-timeslot-group": { minHeight: 36 },
  },
  [theme.breakpoints.down("sm")]: {
    "& .rbc-month-view .rbc-header": {
      fontSize: 9,
      padding: "7px 1px",
      letterSpacing: 0,
    },
    "& .rbc-row-segment": { padding: "0 1px 1px" },
    "& .rbc-label": { fontSize: 9, padding: "0 5px" },
    "& .rbc-timeslot-group": { minHeight: 34 },
  },
});
