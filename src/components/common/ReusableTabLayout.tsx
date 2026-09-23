import {
  Box,
  Tabs,
  Tab,
} from "@mui/material";
import React, { Suspense, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { RouteFallback } from "../loading/PageLoader";
import AnimatedOutlet from "../loading/AnimatedOutlet";
import { SHELL_MIN_HEIGHT } from "../layout/layoutConstants";

export interface TabConfig {
  label: string;
  path: string; // relative path (NO leading slash)
}

interface ReusableTabLayoutProps {
  basePath: string; // e.g. "/team"
  tabs: TabConfig[];
}

const ReusableTabLayout: React.FC<ReusableTabLayoutProps> = ({
  basePath,
  tabs,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  /* ---------- Build Full Paths ---------- */
  const fullTabPaths = useMemo(
    () =>
      tabs.map((tab) => ({
        ...tab,
        fullPath: `${basePath}/${tab.path}`,
      })),
    [tabs, basePath]
  );

  /* ---------- Derive Active Tab From URL ---------- */
  const activeTab = useMemo(() => {
    const foundIndex = fullTabPaths.findIndex((tab) =>
      location.pathname.startsWith(tab.fullPath)
    );

    return foundIndex === -1 ? 0 : foundIndex;
  }, [location.pathname, fullTabPaths]);

  /* ---------- Handle Tab Click ---------- */
  const handleTabChange = (
    _: React.SyntheticEvent,
    newValue: number
  ) => {
    navigate(fullTabPaths[newValue].fullPath);
  };

  return (
    <Box
      sx={{
        backgroundColor: "transparent",
        maxWidth: "100%",
        minHeight: SHELL_MIN_HEIGHT,
        display: "flex",
        flexDirection: "column",
        pl: 8,
        overflow: "auto",
        "&::-webkit-scrollbar": {
          height: "8px",
        },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "#888",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          backgroundColor: "grey",
        },
      }}
    >
      {/* ---------- Tabs ---------- */}
      <Box sx={{ marginTop: "45px" }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: "transparent",
              "&::after": {
                content: '""',
                width: 0,
                height: 0,
                borderRight: "8px solid transparent",
                borderLeft: "8px solid transparent",
                borderBottom: "10px solid grey",
                position: "absolute",
                bottom: 0,
              },
            },
            boxShadow: 2,
            mt: 1,
          }}
        >
          {fullTabPaths.map((tab, index) => (
            <Tab key={index} label={tab.label} />
          ))}
        </Tabs>
      </Box>

      {/* ---------- Content ---------- */}
      <Box sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Suspense fallback={<RouteFallback />}>
          <AnimatedOutlet />
        </Suspense>
      </Box>
    </Box>
  );
};

export default ReusableTabLayout;
