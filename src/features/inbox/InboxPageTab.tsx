import { Box, Tabs, Tab, useTheme } from "@mui/material";
import React, { type JSX, Suspense, useEffect, useMemo } from "react";
import { useLocation, Link } from "react-router";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import { useAppSelector } from "../../app/hooks";
import { RouteFallback } from "../../components/loading/PageLoader";
import AnimatedOutlet from "../../components/loading/AnimatedOutlet";
import { SHELL_MIN_HEIGHT } from "../../components/layout/layoutConstants";

interface InboxPageTabProps {
  setDynamicHeaderText: (text: string) => void;
  setDynamicHeaderIcon: (icon: JSX.Element) => void;
}

const HEADER_ICON = <PeopleAltIcon sx={{ color: "white" }} />;

const InboxPageTab: React.FC<InboxPageTabProps> = ({
  setDynamicHeaderText,
  setDynamicHeaderIcon,
}) => {
  const location = useLocation();
  const theme = useTheme();
  const user = useAppSelector((s) => s.auth.user);

  if (!user) return null;

  /* ================= ACTIVE TAB ================= */

  const activeTab = useMemo(() => {
    const path = location.pathname;

    if (path.includes("/inbox/action")) return "action";
    return "notifications";
  }, [location.pathname]);

  /* ================= HEADER CONTROL ================= */

  useEffect(() => {
    if (activeTab === "action") {
      setDynamicHeaderText("Action Required");
    } else {
      setDynamicHeaderText("Notifications");
    }

    setDynamicHeaderIcon(HEADER_ICON);
  }, [activeTab, setDynamicHeaderText, setDynamicHeaderIcon]);

  /* ================= UI ================= */

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.paper,
        maxWidth: "100%",
        minHeight: SHELL_MIN_HEIGHT,
        display: "flex",
        flexDirection: "column",
        pl: 8,
        overflow: "auto",
        "&::-webkit-scrollbar": { height: 8 },
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
      {/* ================= Tabs ================= */}

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
          <Tab
            label="Notifications"
            value="notifications"
            component={Link}
            to="notifications"
          />

          <Tab
            label="Action"
            value="action"
            component={Link}
            to="action"
          />
        </Tabs>
      </Box>

      {/* ================= Content ================= */}

      <Box sx={{ p: 0, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Suspense fallback={<RouteFallback />}>
          <AnimatedOutlet />
        </Suspense>
      </Box>
    </Box>
  );
};

export default InboxPageTab;

