import React from "react";
import { Box, Tab, Tabs, useTheme } from "@mui/material";
import { Link } from "react-router";
import type { MyDashboardTab } from "../config/dashboardTabs";

interface DashboardTabsProps {
  /** Already permission-filtered — this component renders what it is given. */
  tabs: MyDashboardTab[];
  /** Segment of the tab in view, or null when the URL matches none of them. */
  activeSegment: string | null;
}

/**
 * My Dashboard's tab strip. Deliberately the same glass bar + triangle
 * indicator every other module shell uses (Scheduler, SFTP, Analytics, the
 * old Me shell), so the merged workspace reads as part of the app rather
 * than a one-off surface.
 *
 * Each tab is a real <Link>, so the URL stays the source of truth: refresh,
 * deep links and browser back/forward all keep working, and the tabs support
 * middle-click / open-in-new-tab like links should.
 */
const DashboardTabs: React.FC<DashboardTabsProps> = ({ tabs, activeSegment }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  // MUI warns when `value` matches no child, which happens for the brief tick
  // between landing on /my-dashboard and the index redirect resolving.
  const value =
    activeSegment && tabs.some((t) => t.segment === activeSegment)
      ? activeSegment
      : false;

  return (
    <Box
      sx={{
        mt: "45px",
        background: isDark
          ? "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
          : "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        border: `1px solid ${
          isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)"
        }`,
        boxShadow: isDark
          ? "0 8px 32px rgba(0,0,0,0.45)"
          : "0 8px 32px rgba(0,0,0,0.08)",
        transition: "all 0.3s ease",
        minWidth: 0,
      }}
    >
      <Tabs
        value={value}
        aria-label="My Dashboard sections"
        variant="scrollable"
        scrollButtons="auto"
        // Keeps the strip scrollable instead of overflowing on a phone,
        // where MUI hides the scroll buttons by default.
        allowScrollButtonsMobile
        sx={{
          px: 2,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 500,
            fontSize: 14,
          },
          "& .Mui-selected": {
            fontWeight: 600,
            color: theme.palette.primary.main,
          },
          "& .MuiTabs-indicator": {
            display: "flex",
            justifyContent: "center",
            backgroundColor: "transparent",
            "&::after": {
              content: '""',
              width: 0,
              height: 0,
              borderRight: "8px solid transparent",
              borderLeft: "8px solid transparent",
              borderBottom: `10px solid ${theme.palette.primary.main}`,
              position: "absolute",
              bottom: 0,
            },
          },
        }}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.segment}
            value={tab.segment}
            label={tab.label}
            component={Link}
            to={tab.to}
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default React.memo(DashboardTabs);
