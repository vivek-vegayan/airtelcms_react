import { Box, Tabs, Tab, useTheme } from "@mui/material";
import React, { type JSX, Suspense, useEffect, useMemo } from "react";
import { useLocation, Link } from "react-router";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import SummarizeRoundedIcon from "@mui/icons-material/SummarizeRounded";
import { RouteFallback } from "../../components/loading/PageLoader";
import AnimatedOutlet from "../../components/loading/AnimatedOutlet";
import { SHELL_MIN_HEIGHT } from "../../components/layout/layoutConstants";
import "./utils/chartSetup";

interface AnalyticsMainPageTabProps {
  setDynamicHeaderText: (text: string) => void;
  setDynamicHeaderIcon: (icon: JSX.Element) => void;
}

const TAB_META: Record<string, { label: string; headerText: string; icon: JSX.Element }> = {
  dashboard: { label: "Dashboard", headerText: "Analytics Dashboard", icon: <DashboardRoundedIcon sx={{ color: "white" }} /> },
  "crq-analytics": { label: "CRQ Analytics", headerText: "CRQ Analytics", icon: <QueryStatsRoundedIcon sx={{ color: "white" }} /> },
  reports: { label: "Reports", headerText: "Analytics Reports", icon: <SummarizeRoundedIcon sx={{ color: "white" }} /> },
};

const AnalyticsMainPageTab: React.FC<AnalyticsMainPageTabProps> = ({ setDynamicHeaderText, setDynamicHeaderIcon }) => {
  const location = useLocation();
  const theme = useTheme();

  const activeTab = useMemo(() => {
    const found = Object.keys(TAB_META).find((path) => location.pathname.includes(`/analytics/${path}`));
    return found ?? "dashboard";
  }, [location.pathname]);

  useEffect(() => {
    const meta = TAB_META[activeTab];
    setDynamicHeaderText(meta?.headerText ?? "Analytics");
    setDynamicHeaderIcon(meta?.icon ?? <InsightsRoundedIcon sx={{ color: "white" }} />);
  }, [activeTab, setDynamicHeaderText, setDynamicHeaderIcon]);

  return (
    <Box
      sx={{
        maxWidth: "100%",
        minHeight: SHELL_MIN_HEIGHT,
        display: "flex",
        flexDirection: "column",
        pl: 8,
        overflow: "auto",
      }}
    >
      <Box
        sx={{
          mt: "45px",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
              : "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.6)"}`,
          boxShadow: theme.palette.mode === "dark" ? "0 8px 32px rgba(0,0,0,0.45)" : "0 8px 32px rgba(0,0,0,0.08)",
        }}
      >
        <Tabs
          value={activeTab}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            "& .MuiTab-root": { textTransform: "none", fontWeight: 500, fontSize: 14 },
            "& .Mui-selected": { fontWeight: 600, color: theme.palette.primary.main },
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
          {Object.entries(TAB_META).map(([path, meta]) => (
            <Tab key={path} label={meta.label} value={path} to={path} component={Link} />
          ))}
        </Tabs>
      </Box>

      <Box sx={{ p: 0, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Suspense fallback={<RouteFallback />}>
          <AnimatedOutlet />
        </Suspense>
      </Box>
    </Box>
  );
};

export default AnalyticsMainPageTab;
