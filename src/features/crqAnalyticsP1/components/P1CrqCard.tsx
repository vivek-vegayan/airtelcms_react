import { Fragment, type ReactNode } from "react";
import { Box, Skeleton, Tooltip } from "@mui/material";
import { alpha } from "@mui/material/styles";
import "@fontsource/ibm-plex-mono/600.css";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import { useP1 } from "../hooks/useP1Context";
import type { P1CrqRowDto } from "../types/crqAnalyticsP1.types";
import { STAGES, fdt, h1, num } from "../utils/p1Format";
import { resultMeta, toneColors } from "../utils/p1Status";
import { ResultPill } from "./P1Bits";

const MONO = "'IBM Plex Mono', ui-monospace, 'Cascadia Mono', Consolas, monospace";
const STOPPED = ["CANCELLED", "REJECTED", "UNKNOWN"];

/**
 * One CRQ in the drill-down list, in two compact rows:
 *   1. CRQ number · status · team · circle · region · shift ........ age
 *   2. 7-step progress · stage · slot · person · reschedules   (or the finished task, for task lists)
 * plus the cancel / reject reason when the CRQ was stopped. Only fields of CRQ_AN_SP_LIST are used.
 */
export function P1CrqCard({ row: r, onOpen }: { row: P1CrqRowDto; onOpen: (crqNo: string) => void }) {
  const { colors } = useP1();
  const t = colors.tokens;
  const status = toneColors(t, resultMeta(r.result, r.currentStatus).tone);
  const isOpen = r.result === "OPEN";
  const isDone = r.result === "DONE";
  const isStopped = STOPPED.includes(r.result);
  // CCB / SE as in the approved design: the brand accent and the success green of the theme.
  const sideColor = (side: string | null | undefined) => (side === "SE" ? t.success : t.accent);

  const dot = (
    <Box component="span" aria-hidden sx={{ color: t.textDim, mx: "6px" }}>
      ·
    </Box>
  );
  /** Items joined by " · " with even spacing. */
  const joined = (items: ReactNode[]) => items.map((it, i) => (
    <Fragment key={i}>
      {i > 0 && dot}
      {it}
    </Fragment>
  ));

  const where: ReactNode[] = [r.team, r.circle, r.region].filter(Boolean) as string[];
  if (r.shift) {
    where.push(
      <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
        {r.shift === "Night" ? (
          <DarkModeRoundedIcon sx={{ fontSize: 13, color: colors.night }} />
        ) : (
          <LightModeRoundedIcon sx={{ fontSize: 13, color: colors.day }} />
        )}
        {r.shift}
      </Box>,
    );
  }

  const metaItem = (icon: ReactNode, value: string, title: string, warn = false) => (
    <Tooltip title={title} arrow>
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          color: warn ? t.warning : t.textPrimary,
          fontWeight: 600,
          "& svg": { fontSize: 14, color: warn ? t.warning : t.textDim },
        }}
      >
        {icon}
        {value}
      </Box>
    </Tooltip>
  );
  const meta: ReactNode[] = [];
  if (!r.task) {
    if (r.night) meta.push(metaItem(<CalendarMonthOutlinedIcon />, fdt(r.night), "Booked slot"));
    if (isOpen && r.person) meta.push(metaItem(<PersonOutlineRoundedIcon />, r.person, "With (current stage)"));
    if (r.engineerName && r.engineerName !== r.person && (isDone || r.stageNo >= 5))
      meta.push(metaItem(<PersonOutlineRoundedIcon />, r.engineerName, "Engineer for the slot"));
    if (num(r.rescheduleCount) > 0) {
      const n = num(r.rescheduleCount);
      meta.push(metaItem(<ReplayRoundedIcon />, `${n} reschedule${n === 1 ? "" : "s"}`, "Times moved to another slot", true));
    }
  }

  const sideTag = (side: string | null | undefined) =>
    side ? (
      <Box
        component="span"
        sx={{
          ml: 0.75,
          px: "5px",
          py: "1px",
          borderRadius: "5px",
          fontSize: 10,
          fontWeight: 700,
          verticalAlign: "1px",
          color: sideColor(side),
          background: alpha(sideColor(side), t.isDark ? 0.18 : 0.1),
        }}
      >
        {side}
      </Box>
    ) : null;

  const stageText = isDone ? (
    <>
      Closed
      {r.endAt && (
        <Box component="span" sx={{ fontWeight: 500, color: t.textSecondary }}>
          {" "}
          {fdt(r.endAt)}
        </Box>
      )}
    </>
  ) : isStopped ? (
    <>
      Stopped at {r.stageLabel}
      {sideTag(r.side)}
    </>
  ) : (
    <>
      {r.stageLabel}
      {sideTag(r.side)}
      <Box component="span" sx={{ fontWeight: 500, color: t.textDim }}>
        {" "}
        {r.stageNo}/7
      </Box>
    </>
  );

  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={() => onOpen(r.crqNo)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(r.crqNo);
        }
      }}
      aria-label={`Open the CRQ Journey of ${r.crqNo}`}
      sx={{
        position: "relative",
        cursor: "pointer",
        background: t.surface,
        border: `1px solid ${t.border}`,
        borderRadius: "10px",
        p: "10px 34px 10px 16px",
        transition: "box-shadow .18s, border-color .18s, transform .18s",
        // status edge on the left
        "&::before": {
          content: '""',
          position: "absolute",
          left: 0,
          top: 8,
          bottom: 8,
          width: 3,
          borderRadius: "0 3px 3px 0",
          background: status.edge,
        },
        "&:hover, &:focus-visible": {
          borderColor: t.borderHover,
          boxShadow: t.shadowCard,
          transform: "translateY(-1px)",
          outline: "none",
          "& .crq-chev": { color: t.accent, transform: "translateX(2px)" },
        },
        "&:focus-visible": { boxShadow: `0 0 0 2px ${t.accentBorder}` },
      }}
    >
      {/* row 1: number · status · where ........ age */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        <Box component="span" sx={{ fontFamily: MONO, fontWeight: 600, fontSize: 13.5, color: t.textPrimary, flexShrink: 0 }}>
          {r.crqNo}
        </Box>
        <Box sx={{ flexShrink: 0 }}>
          <ResultPill result={r.result} currentStatus={r.currentStatus} />
        </Box>
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            fontSize: 12,
            color: t.textSecondary,
            display: "flex",
            alignItems: "center",
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          }}
        >
          {joined(where)}
        </Box>
        {r.ageDays != null && (
          <Tooltip title={isOpen ? "Days since it was raised" : "Days from raised to ended"} arrow>
            <Box component="span" sx={{ flexShrink: 0, fontSize: 13, fontWeight: 700, color: t.textPrimary }}>
              {num(r.ageDays)}
              <Box component="span" sx={{ fontSize: 11, fontWeight: 600, color: t.textDim, ml: "2px" }}>
                d
              </Box>
            </Box>
          </Tooltip>
        )}
      </Box>

      {/* row 2: progress · stage · slot · person · reschedules  (task lists: the finished task) */}
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 0", mt: "7px", fontSize: 12, color: t.textSecondary }}>
        {r.task ? (
          <Box component="span" sx={{ display: "inline-flex", flexWrap: "wrap", alignItems: "center" }}>
            <ScheduleRoundedIcon sx={{ fontSize: 14, color: t.textDim, mr: "4px" }} />
            {joined([
              <Box component="b" sx={{ color: t.textPrimary, fontWeight: 600 }}>
                {r.task}
              </Box>,
              `${h1(r.taskHours)} h work`,
              ...(num(r.taskHoldHours) > 0 ? [`${h1(r.taskHoldHours)} h on hold`] : []),
              ...(r.taskDoneAt ? [`done ${fdt(r.taskDoneAt)}`] : []),
              ...(r.person
                ? [
                    <span>
                      by{" "}
                      <Box component="b" sx={{ color: t.textPrimary, fontWeight: 600 }}>
                        {r.person}
                      </Box>
                    </span>,
                  ]
                : []),
            ])}
          </Box>
        ) : (
          <>
            <Box
              aria-label={`Stage ${r.stageNo} of 7`}
              sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr) 4px repeat(3, 1fr)", gap: "2px", width: 104, flex: "0 0 104px", mr: 1.25 }}
            >
              {STAGES.map((s) => {
                const color = sideColor(s.side);
                const done = isDone || s.no < r.stageNo;
                const current = s.no === r.stageNo && !isDone;
                const ring = current ? (isStopped ? t.danger : color) : null;
                return (
                  <Fragment key={s.no}>
                    {s.no === 5 && <Box />}
                    <Box
                      title={s.label}
                      sx={{
                        height: 5,
                        borderRadius: "3px",
                        background: done ? color : ring ? "transparent" : t.trackOff,
                        boxShadow: ring ? `inset 0 0 0 1.5px ${ring}` : "none",
                      }}
                    />
                  </Fragment>
                );
              })}
            </Box>
            <Box component="span" sx={{ fontWeight: 600, color: t.textPrimary }}>
              {stageText}
            </Box>
            {meta.length > 0 && (
              <>
                {dot}
                {joined(meta)}
              </>
            )}
          </>
        )}
      </Box>

      {/* cancel / reject reason */}
      {isStopped && r.cancelReason && (
        <Box sx={{ display: "flex", alignItems: "center", gap: "6px", mt: "7px", fontSize: 12, fontWeight: 500, color: t.danger }}>
          <WarningAmberRoundedIcon sx={{ fontSize: 14 }} />
          {r.cancelReason}
          {r.endAt && (
            <Box component="span" sx={{ color: t.textDim, fontWeight: 400 }}>
              · ended {fdt(r.endAt)}
            </Box>
          )}
        </Box>
      )}

      <ChevronRightRoundedIcon
        className="crq-chev"
        sx={{ position: "absolute", right: 10, top: "50%", mt: "-10px", fontSize: 20, color: t.textDim, transition: "transform .18s, color .18s" }}
      />
    </Box>
  );
}

/** Placeholder card while the list (or its next page) loads. */
export function P1CrqCardSkeleton() {
  const { colors } = useP1();
  const t = colors.tokens;
  return (
    <Box sx={{ background: t.surface, border: `1px solid ${t.border}`, borderRadius: "10px", p: "12px 16px" }}>
      <Skeleton variant="text" width="55%" height={18} />
      <Skeleton variant="text" width="75%" height={16} />
    </Box>
  );
}
