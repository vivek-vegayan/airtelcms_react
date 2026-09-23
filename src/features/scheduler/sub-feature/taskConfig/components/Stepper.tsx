import React, { useState } from "react";
import {
  Box,
  Typography,
  Chip,
  Collapse,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  styled,
} from "@mui/material";
import { CheckCircle, PlayCircleFilled, Schedule, ChevronRight, ArrowDropDown } from "@mui/icons-material";
// Locally bundled via @fontsource (already installed app-wide) instead of the
// Google Fonts CDN - this app runs on a server with no internet access.
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/600.css";

// ─── Types ───────────────────────────────────────────────────────────────────

type SubTaskStatus = "Completed" | "In progress" | "Pending";

interface SubTask {
  id: string;
  label: string;
  date?: string;
  status: SubTaskStatus;
}

interface Task {
  id: string;
  label: string;
  status: SubTaskStatus;
  subtasks: SubTask[];
}

// ─── Data ────────────────────────────────────────────────────────────────────

const tasks: Task[] = [
  {
    id: "1",
    label: "Network Planning",
    status: "In progress",
    subtasks: [
      { id: "1.1", label: "Customer kick-off", date: "2026-01-10", status: "Completed" },
      { id: "1.2", label: "Technical review", date: "2026-01-15", status: "In progress" },
      { id: "1.3", label: "HLD", status: "Pending" },
    ],
  },
  {
    id: "2",
    label: "Network Implementation",
    status: "Pending",
    subtasks: [
      { id: "2.1", label: "FopsAPAC", status: "Pending" },
    ],
  },
  {
    id: "3",
    label: "Network Validation",
    status: "Pending",
    subtasks: [
      { id: "3.1", label: "BERT-RFC testing", status: "Pending" },
      { id: "3.2", label: "XC patching", status: "Pending" },
      { id: "3.3", label: "Validation", status: "Pending" },
      { id: "3.4", label: "Acceptance", status: "Pending" },
    ],
  },
];

// ─── Status config ───────────────────────────────────────────────────────────

const statusConfig: Record<
  SubTaskStatus,
  { color: string; bg: string; border: string; icon: React.ReactNode; label: string }
> = {
  Completed: {
    color: "#4ade80",
    bg: "rgba(74,222,128,0.10)",
    border: "rgba(74,222,128,0.25)",
    icon: <CheckCircle sx={{ fontSize: 15, color: "#4ade80" }} />,
    label: "Completed",
  },
  "In progress": {
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.30)",
    icon: <PlayCircleFilled sx={{ fontSize: 15, color: "#f59e0b" }} />,
    label: "In progress",
  },
  Pending: {
    color: "#94a3b8",
    bg: "rgba(148,163,184,0.08)",
    border: "rgba(148,163,184,0.20)",
    icon: <Schedule sx={{ fontSize: 15, color: "#64748b" }} />,
    label: "Pending",
  },
};

// ─── Styled connector ────────────────────────────────────────────────────────

const DarkConnector = styled(StepConnector)(() => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: { top: 18 },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: { borderColor: "#334155" },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: { borderColor: "#334155" },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: "#1e293b",
    borderLeftWidth: 2,
    minHeight: 0,
  },
}));

// ─── Step icon ───────────────────────────────────────────────────────────────

const TaskStepIcon: React.FC<{ status: SubTaskStatus }> = ({ status }) => {
  const cfg = statusConfig[status];
  return (
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          status === "Completed"
            ? "linear-gradient(135deg,#1d4338 0%,#14532d 100%)"
            : status === "In progress"
            ? "linear-gradient(135deg,#78350f 0%,#451a03 100%)"
            : "#1e293b",
        border: `2px solid ${cfg.border}`,
        flexShrink: 0,
      }}
    >
      {React.cloneElement(cfg.icon as React.ReactElement, { sx: { fontSize: 18, color: cfg.color } })}
    </Box>
  );
};

// ─── Status Chip ─────────────────────────────────────────────────────────────

const StatusChip: React.FC<{ status: SubTaskStatus; size?: "small" | "medium" }> = ({
  status,
  size = "small",
}) => {
  const cfg = statusConfig[status];
  return (
    <Chip
      icon={cfg.icon as React.ReactElement}
      label={cfg.label}
      size={size}
      sx={{
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
        height: size === "small" ? 26 : 30,
        "& .MuiChip-icon": { marginLeft: "6px" },
      }}
    />
  );
};

// ─── Sub-task row ─────────────────────────────────────────────────────────────

const SubTaskRow: React.FC<{ subtask: SubTask; highlighted: boolean }> = ({
  subtask,
  highlighted,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.5,
      px: 2,
      py: 1.25,
      borderRadius: "10px",
      background: highlighted
        ? "linear-gradient(135deg, rgba(120,83,15,0.25) 0%, rgba(69,26,3,0.20) 100%)"
        : "rgba(255,255,255,0.025)",
      border: highlighted
        ? "1px solid rgba(245,158,11,0.20)"
        : "1px solid rgba(255,255,255,0.05)",
      mb: 1,
      transition: "all 0.2s ease",
      "&:hover": {
        background: highlighted
          ? "linear-gradient(135deg, rgba(120,83,15,0.35) 0%, rgba(69,26,3,0.30) 100%)"
          : "rgba(255,255,255,0.045)",
      },
    }}
  >
    <TaskStepIcon status={subtask.status} />

    <Box sx={{ flex: 1, minWidth: 0 }}>
      <Typography
        sx={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          color: "#475569",
          mb: 0.2,
          lineHeight: 1,
        }}
      >
        {subtask.id}
      </Typography>
      <Typography
        sx={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13.5,
          fontWeight: 600,
          color: highlighted ? "#fbbf24" : "#cbd5e1",
          letterSpacing: "-0.01em",
        }}
      >
        {subtask.label}
      </Typography>
    </Box>

    {subtask.date && (
      <Typography
        sx={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          color: "#475569",
          whiteSpace: "nowrap",
          mr: 1,
        }}
      >
        {subtask.date}
      </Typography>
    )}

    {!subtask.date && (
      <Typography sx={{ color: "#334155", fontSize: 18, mr: 1, userSelect: "none" }}>—</Typography>
    )}

    <StatusChip status={subtask.status} />
  </Box>
);

// ─── Task Card ───────────────────────────────────────────────────────────────

const TaskCard: React.FC<{ task: Task; isLast: boolean }> = ({ task, isLast }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <Box sx={{ position: "relative" }}>
      {/* Vertical timeline line */}
      {!isLast && (
        <Box
          sx={{
            position: "absolute",
            left: -29,
            top: 36,
            bottom: -16,
            width: 2,
            background: "linear-gradient(to bottom, #334155 0%, #1e293b 100%)",
            zIndex: 0,
          }}
        />
      )}

      <Box
        sx={{
          background: "linear-gradient(160deg, #1a2233 0%, #131c2e 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
          mb: 2,
        }}
      >
        {/* Card header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2.5,
            pt: 2,
            pb: 1.5,
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={() => setExpanded((p) => !p)}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10.5,
                color: "#475569",
                letterSpacing: "0.08em",
                mb: 0.3,
              }}
            >
              Task {task.id}
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: 15,
                fontWeight: 700,
                color: "#e2e8f0",
                letterSpacing: "-0.02em",
              }}
            >
              {task.label}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <StatusChip status={task.status} />
            <IconButton size="small" sx={{ color: "#475569", p: 0.5 }}>
              {expanded ? (
                <ArrowDropDown sx={{ fontSize: 18 }} />
              ) : (
                <ChevronRight sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Box>
        </Box>

        {/* Progress bar */}
        <Box sx={{ px: 2.5, pb: 1.5 }}>
          <Box
            sx={{
              height: 3,
              borderRadius: 2,
              background: "#1e293b",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                height: "100%",
                borderRadius: 2,
                width:
                  task.status === "Completed"
                    ? "100%"
                    : task.status === "In progress"
                    ? `${
                        (task.subtasks.filter((s) => s.status === "Completed").length /
                          task.subtasks.length) *
                          100 +
                        10
                      }%`
                    : "0%",
                background:
                  task.status === "In progress"
                    ? "linear-gradient(90deg, #f59e0b, #d97706)"
                    : task.status === "Completed"
                    ? "linear-gradient(90deg, #4ade80, #16a34a)"
                    : "transparent",
                transition: "width 0.6s ease",
              }}
            />
          </Box>
        </Box>

        {/* Subtasks */}
        <Collapse in={expanded} timeout={250}>
          <Box sx={{ px: 2, pb: 2 }}>
            {task.subtasks.map((st) => (
              <SubTaskRow
                key={st.id}
                subtask={st}
                highlighted={st.status === "In progress"}
              />
            ))}
          </Box>
        </Collapse>
      </Box>
    </Box>
  );
};

// ─── Timeline dot ─────────────────────────────────────────────────────────────

const TimelineDot: React.FC<{ status: SubTaskStatus }> = ({ status }) => {
  const colors: Record<SubTaskStatus, { bg: string; ring: string; inner: string }> = {
    Completed: { bg: "#312e81", ring: "#4f46e5", inner: "#818cf8" },
    "In progress": { bg: "#1e3a5f", ring: "#3b82f6", inner: "#60a5fa" },
    Pending: { bg: "#134e4a", ring: "#14b8a6", inner: "#2dd4bf" },
  };
  const c = colors[status];
  return (
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: c.bg,
        border: `2.5px solid ${c.ring}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: `0 0 0 4px rgba(0,0,0,0.4), 0 0 16px ${c.ring}55`,
      }}
    >
      <Box
        sx={{
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${c.inner} 0%, ${c.ring} 100%)`,
        }}
      />
    </Box>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const StepperCard: React.FC = () => {
  const taskStatuses: SubTaskStatus[] = ["In progress", "Pending", "Pending"];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "#0d1117",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        p: 4,
        fontFamily: "'Space Grotesk', sans-serif",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 680 }}>
        <Typography
          sx={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 22,
            fontWeight: 700,
            color: "#e2e8f0",
            letterSpacing: "-0.03em",
            mb: 4,
          }}
        >
          Project Tasks
        </Typography>

        {/* Timeline layout */}
        <Box sx={{ display: "flex", gap: 3 }}>
          {/* Left: dots + line */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              pt: "10px",
              flexShrink: 0,
            }}
          >
            {tasks.map((task, i) => (
              <React.Fragment key={task.id}>
                <TimelineDot status={taskStatuses[i]} />
                {i < tasks.length - 1 && (
                  <Box
                    sx={{
                      width: 2,
                      flex: 1,
                      minHeight: 80,
                      background:
                        "linear-gradient(to bottom, rgba(51,65,85,0.8) 0%, rgba(30,41,59,0.4) 100%)",
                      my: 0.5,
                    }}
                  />
                )}
              </React.Fragment>
            ))}
          </Box>

          {/* Right: cards */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {tasks.map((task, i) => (
              <TaskCard key={task.id} task={task} isLast={i === tasks.length - 1} />
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default StepperCard;