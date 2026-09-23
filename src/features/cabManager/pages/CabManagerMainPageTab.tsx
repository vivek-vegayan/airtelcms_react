import { Box, Tabs, Tab, useTheme } from "@mui/material";
import React, { type JSX, Suspense, useEffect, useMemo } from "react";
import { useLocation, Link } from "react-router";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";
import Groups2Icon from "@mui/icons-material/Groups2";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import AltRouteIcon from "@mui/icons-material/AltRoute";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import { useNotifTokens } from "../../userMe/notification-manager/style/notificationTokens";
import { useCabRole } from "../hooks/useCabRole";
import { resolveCabScreens } from "../rbac/cabScreens";
import { usePermission } from "../../../rbac/usePermission";
import CommonContainer from "../../../components/common/CommonContainer";
import { RouteFallback } from "../../../components/loading/PageLoader";
import AnimatedOutlet from "../../../components/loading/AnimatedOutlet";
import { SHELL_MIN_HEIGHT } from "../../../components/layout/layoutConstants";

interface CabManagerMainPageTabProps {
  setDynamicHeaderText: (text: string) => void;
  setDynamicHeaderIcon: (icon: JSX.Element) => void;
}

interface CabTabMeta {
  label: string;
  path: string;
  headerText: string;
  icon: JSX.Element;
}

const CAB_MANAGER_TAB_MAP: Record<string, CabTabMeta> = {
  dashboard: {
    label: "Dashboard",
    path: "dashboard",
    headerText: "Dashboard",
    icon: <DashboardIcon sx={{ color: "white" }} />,
  },
  cabPlanning: {
    label: "Cab Planning",
    path: "planning",
    headerText: "Cab Planning",
    icon: <EventNoteOutlinedIcon sx={{ color: "white" }} />,
  },
  cabSessions: {
    label: "Cab Sessions",
    path: "sessions",
    headerText: "Cab Sessions",
    icon: <Groups2Icon sx={{ color: "white" }} />,
  },
  mycrqs: {
    label: "My CRQs",
    path: "mycrqs",
    headerText: "My CRQs",
    icon: <CheckCircleOutlineIcon sx={{ color: "white" }} />,
  },
  allcrqs: {
    label: "All CRQs",
    path: "allcrqs",
    headerText: "All CRQs",
    icon: <ListAltOutlinedIcon sx={{ color: "white" }} />,
  },
  journey: {
    label: "CRQ Journey",
    path: "journey",
    headerText: "CRQ Journey",
    icon: <AltRouteIcon sx={{ color: "white" }} />,
  },
  implementation: {
    label: "Implementation",
    path: "implementation",
    headerText: "Implementation",
    icon: <PlayArrowOutlinedIcon sx={{ color: "white" }} />,
  },
  admin: {
    label: "Admin",
    path: "admin",
    headerText: "Admin Config",
    icon: <SettingsIcon sx={{ color: "white" }} />,
  },
};

const CabManagerMainPageTab: React.FC<CabManagerMainPageTabProps> = ({
  setDynamicHeaderText,
  setDynamicHeaderIcon,
}) => {
  const location = useLocation();
  const theme = useTheme();
  const tk = useNotifTokens(theme);
  const { role } = useCabRole();
  const { hasSubModule } = usePermission();

  /* ================= ALLOWED TABS ================= */

  const tabs = useMemo(() => {
    // Same resolver the sidebar uses, so the tab strip and the sidebar can
    // never disagree (assigned sub-modules first, persona table as fallback).
    return resolveCabScreens(role, hasSubModule)
      .map((screen) => CAB_MANAGER_TAB_MAP[screen])
      .filter((tab): tab is CabTabMeta => Boolean(tab));
  }, [role, hasSubModule]);

  /* ================= ACTIVE TAB ================= */

  const activeTab = useMemo(() => {
    const found = tabs.find((tab) =>
      location.pathname.includes(`/cabmanager/${tab.path}`)
    );
    return found?.path ?? tabs[0]?.path ?? "sessions";
  }, [location.pathname, tabs]);

  /* ================= HEADER CONTROL ================= */

  useEffect(() => {
    const activeMeta = tabs.find((tab) => tab.path === activeTab);
    setDynamicHeaderText(activeMeta?.headerText ?? "Cab Manager");
    setDynamicHeaderIcon(activeMeta?.icon ?? <DashboardIcon sx={{ color: "white" }} />);
  }, [activeTab, tabs, setDynamicHeaderText, setDynamicHeaderIcon]);

  /* ================= UI ================= */

  return (
    <Box
      sx={{
        backgroundColor: tk.accentDim,
        maxWidth: "100%",
        minHeight: SHELL_MIN_HEIGHT,
        display: "flex",
        flexDirection: "column",
        pl: 8,
        overflow: "auto",
        "&::-webkit-scrollbar": {
          height: 8,
        },
        "&::-webkit-scrollbar-track": {
          backgroundColor:
            theme.palette.mode === "dark"
              ? theme.palette.background.paper
              : "#f1f1f1",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: theme.palette.primary.main,
          borderRadius: 4,
        },
      }}
    >
      {/* ================= TABS ================= */}

      <Box
        sx={{
          mt: "45px",
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
              : "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: `1px solid ${
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.08)"
              : "rgba(255,255,255,0.6)"
          }`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 8px 32px rgba(0,0,0,0.45)"
              : "0 8px 32px rgba(0,0,0,0.08)",
          transition: "all 0.3s ease",
        }}
      >
        <Tabs
          value={activeTab}
          variant="scrollable"
          scrollButtons="auto"
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
              key={tab.path}
              label={tab.label}
              value={tab.path}
              to={tab.path}
              component={Link}
            />
          ))}
        </Tabs>
      </Box>

      {/* ================= CONTENT ================= */}

      <Box sx={{ p: 0, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <CommonContainer>
        <Suspense fallback={<RouteFallback />}>
          <AnimatedOutlet />
        </Suspense>
        </CommonContainer>
      </Box>
      
    </Box>
  );
};

export default CabManagerMainPageTab;
