import React, { Suspense, useEffect, useMemo, type JSX } from "react";
import { Box, useTheme } from "@mui/material";
import { useLocation } from "react-router";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import { useTabColorTokens } from "../../../style/theme";
import { RouteFallback } from "../../../components/loading/PageLoader";
import AnimatedOutlet from "../../../components/loading/AnimatedOutlet";
import { SHELL_MIN_HEIGHT } from "../../../components/layout/layoutConstants";
import DashboardTabs from "../components/DashboardTabs";
import { useMyDashboardTabs } from "../hooks/useMyDashboardTabs";
import { findTabByPath } from "../config/dashboardTabs";

interface MyDashboardPageProps {
  setDynamicHeaderText: (text: string) => void;
  setDynamicHeaderIcon: (icon: JSX.Element) => void;
}

const HEADER_ICON = <SpaceDashboardOutlinedIcon sx={{ color: "white" }} />;

/**
 * The shell for the merged workspace: the module tab strip plus the routed
 * tab body. It replaces the two shells this restructure retired — the Home
 * shell (`DashboardPage`) and the Me shell (`UserMeMainPageTab`) — and keeps
 * their layout contract (tinted surface, 45px header inset, rail clearance)
 * so the page sits exactly where those did.
 *
 * The tab bodies are untouched feature pages rendered through the router's
 * outlet, so only the tab in view is mounted: no inactive tab fetches
 * anything, and switching tabs never re-renders the shell around it.
 */
const MyDashboardPage: React.FC<MyDashboardPageProps> = ({
  setDynamicHeaderText,
  setDynamicHeaderIcon,
}) => {
  const theme = useTheme();
  const tk = useTabColorTokens(theme);
  const location = useLocation();

  const tabs = useMyDashboardTabs();
  const activeTab = useMemo(
    () => findTabByPath(location.pathname),
    [location.pathname],
  );

  /* ================= HEADER CONTROL ================= */
  // The app-shell header is the page title for this module — the tab strip
  // below carries no title of its own, so the two never say it twice.
  useEffect(() => {
    setDynamicHeaderText(activeTab?.headerText ?? "My Dashboard");
    setDynamicHeaderIcon(HEADER_ICON);
  }, [activeTab, setDynamicHeaderText, setDynamicHeaderIcon]);

  return (
    <Box
      sx={{
        backgroundColor: tk.accentDim,
        maxWidth: "100%",
        minHeight: SHELL_MIN_HEIGHT,
        display: "flex",
        flexDirection: "column",
        // Clears the collapsed sidebar rail on tablet and up. Below "sm" the
        // sidebar is an off-canvas overlay reserving no width, so the same
        // inset there would only steal space from an already narrow screen.
        pl: { xs: 0, sm: 8 },
        // Only the tab strip scrolls sideways (it manages its own), so the
        // page itself can never overflow horizontally.
        overflowX: "hidden",
      }}
    >
      <DashboardTabs tabs={tabs} activeSegment={activeTab?.segment ?? null} />

      {/* ================= ACTIVE TAB ================= */}
      <Box
        sx={{
          p: 0,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Suspense fallback={<RouteFallback />}>
          <AnimatedOutlet />
        </Suspense>
      </Box>
    </Box>
  );
};

export default MyDashboardPage;
