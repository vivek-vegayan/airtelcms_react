import React from "react";
import { Box, Typography, Avatar, useTheme } from "@mui/material";

/* ================= TYPES ================= */

interface OverviewType {
  l1Count: number;
  l2Count: number;
  l3Count: number;
  l4Count: number;
  teamLead: string | null;
  totalCount: number;
}

interface TeamTopInfoCardProps {
  overview?: OverviewType;
  teamName?: string;
}

/* ================= ICONS ================= */

const GroupIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 16 16"
    fill="none"
    style={{ display: "block", flexShrink: 0 }}
  >
    <circle cx="5" cy="6" r="2" stroke={color} strokeWidth="1.4" />
    <circle cx="11" cy="6" r="2" stroke={color} strokeWidth="1.4" />
    <path
      d="M1 14c0-2 1.5-3.2 4-3.2M15 14c0-2-1.5-3.2-4-3.2M8 10.8c-2.5 0-4 1.2-4 3.2M8 10.8c2.5 0 4 1.2 4 3.2"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

const LeadIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg
    width="9"
    height="9"
    viewBox="0 0 16 16"
    fill="none"
    style={{ display: "block", flexShrink: 0 }}
  >
    <circle cx="8" cy="5.5" r="2.8" stroke={color} strokeWidth="1.6" />
    <path
      d="M2.5 14c0-3 2.5-4.5 5.5-4.5s5.5 1.5 5.5 4.5"
      stroke={color}
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

/* ================= COMPONENT ================= */

export const TeamTopInfoCard: React.FC<TeamTopInfoCardProps> = ({
  overview,
  teamName = "",
}) => {
  const theme = useTheme();

  if (!overview) return null;

  const levels = [
    { key: "L1", count: overview.l1Count, bg: "#EBF5FF", color: "#1565C0" },
    { key: "L2", count: overview.l2Count, bg: "#EDFBF0", color: "#1B5E20" },
    { key: "L3", count: overview.l3Count, bg: "#FFF8EE", color: "#BF360C" },
    { key: "L4", count: overview.l4Count, bg: "#FFF0EE", color: "#B71C1C" },
  ];

  const totalStyle = {
    bg: "#F0EEFF",
    color: "#311B92",
    subColor: "#7E57C2",
  };

  const borderColor =
    theme.palette.mode === "dark"
      ? "rgba(255,255,255,0.1)"
      : "rgba(0,0,0,0.08)";

  const segBorder = `1px solid ${borderColor}`;

  const segHover = {
    cursor: "default",
    transition: "filter 0.2s ease",
    "&:hover": { filter: "brightness(0.93)" },
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "stretch",
        border: segBorder,
        borderRadius: "10px",
        overflow: "hidden",
        width: "100%",
        height: "44px",
      }}
    >
      {/* ──────────── Identity panel ──────────── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          px: "14px",
          borderRight: segBorder,
          flexShrink: 0,
          minWidth: "190px",
          bgcolor: "background.paper",
        }}
      >
        <Avatar
          sx={{
            background: "linear-gradient(135deg, #5C6BC0, #7986CB)",
            width: 26,
            height: 26,
            fontSize: "9px",
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          {teamName.slice(0, 2).toUpperCase()}
        </Avatar>

        <Box sx={{ overflow: "hidden" }}>
          <Typography
            noWrap
            sx={{
              fontSize: "12.5px",
              fontWeight: 600,
              color: "text.primary",
              lineHeight: 1.25,
            }}
          >
            {teamName}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <LeadIcon color={theme.palette.text.secondary} />
            <Typography
              noWrap
              sx={{
                // fontSize: "10px",
                color: "text.enabled",
                lineHeight: 1,
              }}
            >
              {overview.teamLead ?? "Not assigned"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ──────────── Level segments ──────────── */}
      {levels.map((lvl) => (
        <Box
          key={lvl.key}
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: "10px",
            bgcolor: lvl.bg,
            borderRight: segBorder,
            ...segHover,
          }}
        >
          {/*
           * Label + Count sit at baseline alignment.
           * Label: small (10px) + semi-transparent → reads as a "key"
           * Count: large (17px) + bold             → reads as the "value"
           * The size gap is the readability fix.
           */}
          <Box sx={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
            <Typography
              sx={{
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.04em",
                color: lvl.color,
                opacity: 0.65,
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              {lvl.key} :
            </Typography>
            <Typography
              sx={{
                fontSize: "17px",
                fontWeight: 700,
                color: lvl.color,
                lineHeight: 1,
              }}
            >
              {lvl.count}
            </Typography>
          </Box>
        </Box>
      ))}

      {/* ──────────── Total segment ──────────── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "7px",
          px: "16px",
          flexShrink: 0,
          bgcolor: totalStyle.bg,
          borderLeft: segBorder,
          ...segHover,
        }}
      >
        <GroupIcon color={totalStyle.color} />

        <Box sx={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <Typography
            sx={{
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: totalStyle.color,
              opacity: 0.65,
              lineHeight: 1,
              whiteSpace: "nowrap",
            }}
          >
            TOTAL
          </Typography>
          <Typography
            sx={{
              fontSize: "17px",
              fontWeight: 700,
              color: totalStyle.color,
              lineHeight: 1,
            }}
          >
            {overview.totalCount}
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: "10px",
            color: totalStyle.subColor,
            lineHeight: 1,
            alignSelf: "center",
          }}
        >
          (active)
        </Typography>
      </Box>
    </Box>
  );
};
