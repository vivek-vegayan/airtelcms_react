import React from "react";
import {
  Box,
  Collapse,
  Typography,
  useMediaQuery,
  useTheme,
  alpha,
} from "@mui/material";
import EngineeringRoundedIcon from "@mui/icons-material/EngineeringRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import type { CrqStageAssignment } from "../types/crqJourney.types";
import { formatDateTime, formatStageName } from "../utils/crqJourney.utils";

// ─────────────────────────────────────────────────────────────────────────────
//  "Who worked each stage, and when" — result set 5 of
//  sp_get_crq_journey_page: one row per canonical workflow stage with the
//  assigned engineer, their OLM ID and the stage's start / end time.
//
//  Sits below the Service Approvals & SPOC panel. Unlike that panel it is not
//  part of the canvas's height budget — it is reference material the reader
//  scrolls to, so the diagram keeps its full fit-to-view height.
// ─────────────────────────────────────────────────────────────────────────────

interface StageAssignmentPanelProps {
  rows: CrqStageAssignment[];
  /** The CRQ's live stage, highlighted in the list. */
  currentStage?: string | null;
  open: boolean;
  onToggle: () => void;
}

const normalize = (s: string | null | undefined) => (s ?? "").trim().toUpperCase().replace(/[_\s]+/g, " ");

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const COLUMNS = "36px minmax(150px, 1.1fr) minmax(190px, 1.4fr) minmax(150px, 1fr) minmax(150px, 1fr)";

export const StageAssignmentPanel: React.FC<StageAssignmentPanelProps> = ({
  rows,
  currentStage,
  open,
  onToggle,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const isCompact = useMediaQuery(theme.breakpoints.down("md"), { noSsr: true });

  // An older proc / backend that doesn't emit this set: stay out of the layout.
  if (!rows.length) return null;

  const accent = theme.palette.primary.main;
  const assigned = rows.filter((r) => r.assignedEngineer || r.assignOlmId).length;
  const current = normalize(currentStage);

  const engineerCell = (row: CrqStageAssignment) =>
    row.assignedEngineer || row.assignOlmId ? (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        <Box
          sx={{
            width: 26,
            height: 26,
            flexShrink: 0,
            borderRadius: "50%",
            background: alpha(accent, isDark ? 0.22 : 0.12),
            color: accent,
            fontSize: 10.5,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {initials(row.assignedEngineer ?? row.assignOlmId ?? "?")}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 600, color: "text.primary", lineHeight: 1.3 }}>
            {row.assignedEngineer ?? "—"}
          </Typography>
          {row.assignOlmId && (
            <Typography
              noWrap
              sx={{ fontSize: 11, color: "text.secondary", fontFamily: "'Roboto Mono', monospace", lineHeight: 1.3 }}
            >
              {row.assignOlmId}
            </Typography>
          )}
        </Box>
      </Box>
    ) : (
      <Typography sx={{ fontSize: 12, color: "text.disabled", fontStyle: "italic" }}>Not assigned</Typography>
    );

  return (
    <Box
      sx={{
        borderRadius: "14px",
        border: `1px solid ${theme.palette.divider}`,
        background: theme.palette.background.paper,
        boxShadow: isDark ? "0 1px 3px rgba(0,0,0,0.35)" : "0 1px 3px rgba(16,40,70,0.05)",
        overflow: "hidden",
      }}
    >
      {/* ── header ── */}
      <Box
        onClick={onToggle}
        sx={{
          px: { xs: 1.5, md: 2 },
          py: 0.85,
          display: "flex",
          alignItems: "center",
          gap: { xs: 1, md: 1.25 },
          flexWrap: "wrap",
          cursor: "pointer",
          userSelect: "none",
          background: alpha(accent, isDark ? 0.1 : 0.05),
          borderBottom: open ? `1px solid ${theme.palette.divider}` : "none",
          transition: "background 0.2s ease",
          "&:hover": { background: alpha(accent, isDark ? 0.15 : 0.08) },
        }}
      >
        <Box
          sx={{
            width: 24,
            height: 24,
            flexShrink: 0,
            borderRadius: "8px",
            background: alpha(accent, isDark ? 0.22 : 0.13),
            color: accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <EngineeringRoundedIcon sx={{ fontSize: 14 }} />
        </Box>

        <Typography sx={{ fontSize: { xs: 12.5, md: 13.5 }, fontWeight: 700, color: "text.primary", lineHeight: 1.3 }}>
          Stage Assignment &amp; Timeline
        </Typography>

        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            height: 21,
            px: "8px",
            borderRadius: "999px",
            fontSize: 11,
            fontWeight: 700,
            color: accent,
            background: theme.palette.background.paper,
            border: `1px solid ${alpha(accent, 0.3)}`,
            whiteSpace: "nowrap",
          }}
        >
          {assigned} of {rows.length} stages assigned
        </Box>


        <ExpandMoreRoundedIcon
          sx={{
            ml: "auto",
            fontSize: 19,
            color: "text.secondary",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.2s ease",
          }}
        />
      </Box>

      <Collapse in={open} timeout="auto" unmountOnExit>
        {isCompact ? (
          // ── stacked cards below md ──
          <Box sx={{ p: 1.25, display: "flex", flexDirection: "column", gap: 1 }}>
            {rows.map((row, i) => {
              const isCurrent = !!current && normalize(row.stage) === current;
              return (
                <Box
                  key={`${row.stage}-${i}`}
                  sx={{
                    p: 1.25,
                    borderRadius: "10px",
                    border: `1px solid ${isCurrent ? alpha(accent, 0.5) : theme.palette.divider}`,
                    background: isCurrent ? alpha(accent, isDark ? 0.08 : 0.04) : "transparent",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.75,
                  }}
                >
                  <Typography sx={{ fontSize: 12.5, fontWeight: 700 }}>
                      {i + 1}. {formatStageName(row.stage)}
                    </Typography>
                  {engineerCell(row)}
                  <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
                    {formatDateTime(row.startTime)} → {formatDateTime(row.endTime)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        ) : (
          // ── table on md+ ──
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 660 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: COLUMNS,
                  gap: 1.5,
                  px: 2,
                  py: 0.6,
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  background: isDark ? alpha("#fff", 0.02) : "#FAFBFC",
                }}
              >
                {["#", "Stage", "Assigned Engineer", "Start Time", "End Time"].map((h) => (
                  <Typography
                    key={h}
                    sx={{ fontSize: 10.5, fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: 0.4 }}
                  >
                    {h}
                  </Typography>
                ))}
              </Box>

              {rows.map((row, i) => {
                const isCurrent = !!current && normalize(row.stage) === current;
                return (
                  <Box
                    key={`${row.stage}-${i}`}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: COLUMNS,
                      gap: 1.5,
                      alignItems: "center",
                      px: 2,
                      py: 0.85,
                      borderBottom: i < rows.length - 1 ? `1px solid ${theme.palette.divider}` : "none",
                      background: isCurrent ? alpha(accent, isDark ? 0.08 : 0.04) : "transparent",
                      boxShadow: isCurrent ? `inset 3px 0 0 ${accent}` : "none",
                    }}
                  >
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "text.secondary" }}>{i + 1}</Typography>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography noWrap title={row.stage} sx={{ fontSize: 12.5, fontWeight: 600, color: "text.primary" }}>
                        {formatStageName(row.stage)}
                      </Typography>
                      {isCurrent && (
                        <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: accent }}>Current stage</Typography>
                      )}
                    </Box>
                    {engineerCell(row)}
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{formatDateTime(row.startTime)}</Typography>
                    <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{formatDateTime(row.endTime)}</Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Collapse>
    </Box>
  );
};
