import { Box, Tabs, Tab, useTheme } from "@mui/material";
import React, { Suspense, useMemo } from "react";
import { useLocation, Link, Navigate } from "react-router";
import { useAppSelector } from "../../../app/hooks";
import { useTabColorTokens } from "../../../style/theme";
import { RouteFallback } from "../../../components/loading/PageLoader";
import AnimatedOutlet from "../../../components/loading/AnimatedOutlet";
import { SHELL_MIN_HEIGHT } from "../../../components/layout/layoutConstants";
import { usePermission } from "../../../rbac/usePermission";
import { isPathAllowed } from "../../../rbac/routeAccess";
import AccessDenied from "../../../rbac/AccessDenied";

/**
 * The three Global Settings tabs, in display order. Each one is a real route
 * registered in navRegistry, so visibility is decided by `isPathAllowed` —
 * the same check PrivateRoute runs on a direct URL and the sidebar runs on
 * its children. Without this, a role holding only one sub-module (Sub-Domain
 * Head has Network Settings but not Admin/Organization Settings) still saw
 * all three tabs and got an "Access denied" page on click.
 */
const TAB_DEFS = [
  { value: "networkfreezsetting", label: "Network Freeze Setting" },
  { value: "adminsetting", label: "Admin Setting" },
  { value: "orgconfig", label: "Organization Configuration" },
] as const;

const tabPath = (value: string) => `/global-settings/${value}`;

const useAllowedTabs = () => {
  const { hasModule, hasSubModule } = usePermission();

  return useMemo(
    () =>
      TAB_DEFS.filter((t) =>
        isPathAllowed(tabPath(t.value), hasModule, hasSubModule),
      ),
    [hasModule, hasSubModule],
  );
};

/**
 * Landing element for `/global-settings` itself. Sends the user to the first
 * tab their role can actually open rather than a hardcoded one, and falls
 * back to the standard denial screen when no tab is permitted.
 */
export const GlobalSettingsIndexRedirect: React.FC = () => {
  const allowedTabs = useAllowedTabs();

  if (allowedTabs.length === 0) return <AccessDenied reason="forbidden" />;

  return <Navigate to={allowedTabs[0].value} replace />;
};

const NetworkManagementTabView: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const user = useAppSelector((s) => s.auth.user);
  const bg = useTabColorTokens(theme);
  const allowedTabs = useAllowedTabs();

  /* ================= ACTIVE TAB DETECTION ================= */

  const activeTab = useMemo(() => {
    const path = location.pathname;
    const match = TAB_DEFS.find((t) => path.includes(t.value));
    return match?.value ?? null;
  }, [location.pathname]);

  if (!user) return null;

  // MUI warns when `value` names a tab that isn't rendered — which happens on
  // the brief pass through /global-settings before the index redirect lands.
  const tabsValue = allowedTabs.some((t) => t.value === activeTab)
    ? activeTab
    : false;

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
          value={tabsValue}
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
          {allowedTabs.map((tab) => (
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

      {/* ================= CONTENT ================= */}

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

export default NetworkManagementTabView;
