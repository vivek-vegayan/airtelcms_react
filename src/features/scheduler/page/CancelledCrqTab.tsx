import { Box, Tab, Tabs, useTheme } from "@mui/material";
import React, { Suspense, useMemo } from "react";
import { Link, useLocation } from "react-router";
import { useAppSelector } from "../../../app/hooks";
import { useTabColorTokens } from "../../../style/theme";
import { RouteFallback } from "../../../components/loading/PageLoader";
import AnimatedOutlet from "../../../components/loading/AnimatedOutlet";
import { SHELL_MIN_HEIGHT } from "../../../components/layout/layoutConstants";
import { useSchedulerAccess } from "../hook/useSchedulerAccess";

/**
 * Shell for the Scheduler's "Cancelled CRQs" tab.
 *
 * A shell of its own rather than a fourth tab on PlanViewAndSetupTab: that
 * strip groups the plan-authoring screens (Plan View & Setup, Task Config,
 * CRQ Journey), and the cancelled register is neither authoring nor part of
 * that flow. It mirrors SchedulerMainTab, which likewise hosts a single tab.
 *
 * The tab is built from the user's grants (useSchedulerAccess -> the same nav
 * registry PrivateRoute enforces), so it is never offered for a page the
 * route guard would then answer with AccessDenied.
 */
const CancelledCrqTab: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const user = useAppSelector((s) => s.auth.user);
  const bg = useTabColorTokens(theme);
  const { canViewCancelledCrq } = useSchedulerAccess();

  const tabs = useMemo(
    () =>
      [
        {
          value: "cancelledcrq",
          label: "Cancelled CRQs",
          allowed: canViewCancelledCrq,
        },
      ].filter((t) => t.allowed),
    [canViewCancelledCrq],
  );

  const activeTab = useMemo(() => {
    const match = tabs.find((t) => location.pathname.includes(t.value));
    // `false` rather than a hard-coded default: PrivateRoute renders
    // AccessDenied for an ungranted page, and this bar must not draw an
    // indicator for a tab it is not offering.
    return match?.value ?? false;
  }, [location.pathname, tabs]);

  if (!user) return null;

  return (
    <Box
      sx={{
        backgroundColor: bg.isDark ? bg.accentDim : theme.palette.background.paper,
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
        "&::-webkit-scrollbar-thumb": { borderRadius: 4 },
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

export default CancelledCrqTab;
