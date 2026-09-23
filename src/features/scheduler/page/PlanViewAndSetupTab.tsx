import { Box, Tabs, Tab, useTheme } from "@mui/material";
import React, { Suspense, useMemo } from "react";
import { useLocation, Link } from "react-router";
// import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import { useAppSelector } from "../../../app/hooks";
import { useTabColorTokens } from "../../../style/theme";
import { RouteFallback } from "../../../components/loading/PageLoader";
import AnimatedOutlet from "../../../components/loading/AnimatedOutlet";
import { SHELL_MIN_HEIGHT } from "../../../components/layout/layoutConstants";
import { useSchedulerAccess } from "../hook/useSchedulerAccess";

// interface PlanViewAndSetupTabProps {
//   setDynamicHeaderText: (text: string) => void;
//   setDynamicHeaderIcon: (icon: JSX.Element) => void;
// }

const PlanViewAndSetupTab: React.FC = (
  {
    //   setDynamicHeaderText,
    //   setDynamicHeaderIcon,
  },
) => {
  const location = useLocation();
  const theme = useTheme();
  const user = useAppSelector((s) => s.auth.user);
  const bg = useTabColorTokens(theme);
  const access = useSchedulerAccess();

  /* ================= PERMITTED TABS ================= */

  // Built from the user's grants rather than hard-coded, so a tab is never
  // offered for a page PrivateRoute would answer with AccessDenied.
  const tabs = useMemo(
    () =>
      [
        { value: "planviewandsetup", label: "Plan View & Setup", allowed: access.canViewPlan },
        { value: "taskconfig", label: "Task Config", allowed: access.canViewTaskConfig },
        // taskplanning - hidden from tab + route (task planning page disabled)
        { value: "crqjourney", label: "CRQ Journey", allowed: access.canViewCrqJourney },
      ].filter((t) => t.allowed),
    [access.canViewPlan, access.canViewTaskConfig, access.canViewCrqJourney],
  );

  /* ================= ACTIVE TAB DETECTION ================= */

  const activeTab = useMemo(() => {
    const path = location.pathname;

    //  handle nested routes also
    const match = tabs.find((t) => path.includes(t.value));
    if (match) return match.value;

    // Fall back to the first tab the user actually holds. Defaulting to a
    // fixed "planviewandsetup" here would hand MUI a value with no matching
    // <Tab> for anyone lacking that grant, leaving the indicator unattached.
    return tabs[0]?.value ?? false;
  }, [location.pathname, tabs]);

  if (!user) return null;

  /* ================= HEADER CONTROL ================= */

  /* ================= UI ================= */

  return (
    <Box
      sx={{
        backgroundColor: bg.isDark
          ? bg.accentDim
          : theme.palette.background.paper,
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
          border: `1px ${
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
              key={tab.value}
              label={tab.label}
              value={tab.value}
              to={tab.value}
              component={Link}
            />
          ))}
        </Tabs>
      </Box>

      {/* ================= HEADER ================= */}

      {/* ================= CONTENT ================= */}

      {/* Takes whatever the shell has left after the 45px header offset and
          the tab bar — the old hand-computed `calc(100vh - 160px)` had to
          guess at those, and a flat 100vh overflowed the viewport by ~110px
          before a single row of content was drawn. */}
      <Box
        sx={{
          p: 2,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          bgcolor: "transparent",
        }}
      >
        <Suspense fallback={<RouteFallback />}>
          <AnimatedOutlet />
        </Suspense>
      </Box>
    </Box>
  );
};

export default PlanViewAndSetupTab;
