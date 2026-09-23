import { Box, Tabs, Tab, useTheme } from "@mui/material";
import React, { type JSX, useEffect, useMemo, useState, Suspense } from "react";
import { useLocation, useNavigate } from "react-router";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
// import { alpha } from "@mui/material/styles";
import { useAppSelector } from "../../../app/hooks";
import { useTabColorTokens } from "../../../style/theme";
import { RouteFallback } from "../../../components/loading/PageLoader";
import AnimatedOutlet from "../../../components/loading/AnimatedOutlet";
import { SHELL_MIN_HEIGHT } from "../../../components/layout/layoutConstants";

interface TeamManagementViewTabProps {
  setDynamicHeaderText: (text: string) => void;
  setDynamicHeaderIcon: (icon: JSX.Element) => void;
}

/* ===================== CONSTANTS ===================== */

const BASE_PATH = "/team";

const TAB_PATHS = {
  OVERVIEW: `${BASE_PATH}/teammanagement`,
  TASK_CONFIG: `${BASE_PATH}/taskconfiguration`,
} as const;

const PATH_TO_TAB: Record<string, number> = {
  [TAB_PATHS.OVERVIEW]: 0,
  [TAB_PATHS.TASK_CONFIG]: 1,
};

const TAB_TO_PATH: Record<number, string> = {
  0: TAB_PATHS.OVERVIEW,
  1: TAB_PATHS.TASK_CONFIG,
};

/* ===================== COMPONENT ===================== */

const TeamManagementPage: React.FC<TeamManagementViewTabProps> = ({
  setDynamicHeaderText,
  setDynamicHeaderIcon,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((s) => s.auth.user);
  const bg = useTabColorTokens(theme);

  if (!user) return null;

  const [activeTab, setActiveTab] = useState<number>(() => {
    return PATH_TO_TAB[location.pathname] ?? 0;
  });

  /* -------- URL → TAB SYNC -------- */
  useEffect(() => {
    const tabFromUrl = PATH_TO_TAB[location.pathname];
    if (tabFromUrl !== undefined && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [location.pathname, activeTab]);

  /* -------- HEADER SYNC -------- */
  const headerIcon = useMemo(
    () => <PeopleAltIcon sx={{ color: theme.palette.text.primary }} />,
    [theme.palette.text.primary],
  );

  useEffect(() => {
    setDynamicHeaderText(
      activeTab === 0 ? "Team Overview" : "Task Configuration",
    );

    setDynamicHeaderIcon(headerIcon);
  }, [activeTab, headerIcon, setDynamicHeaderText, setDynamicHeaderIcon]);

  /* -------- TAB NAVIGATION -------- */
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    if (newValue !== activeTab) {
      setActiveTab(newValue);
      navigate(TAB_TO_PATH[newValue]);
    }
  };

  /* ===================== RENDER ===================== */

  return (
    <Box
      sx={{
        // backgroundColor: theme.palette.background.paper,
        backgroundColor:bg.accentDim,
         maxWidth: "100%",
        minHeight: SHELL_MIN_HEIGHT,
        display: "flex",
        flexDirection: "column",
        pl: 8,
        overflow: "auto",

        /* THEME-AWARE SCROLLBAR */
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
          // backgroundColor: theme.palette.primary.main,
          borderRadius: 4,
        },
      }}
    >
      {/* -------- Tabs Header -------- */}
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
          onChange={handleTabChange}
          textColor="inherit"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
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
          <Tab label="Team Overview" />
          {/* <Tab label="Task Configuration" /> */}
        </Tabs>
      </Box>

      {/* -------- Content Area -------- */}
      <Box
        sx={{
          p: 3,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Suspense fallback={<RouteFallback />}>
          <AnimatedOutlet />
        </Suspense>
      </Box>
    </Box>
  );
};

export default TeamManagementPage;

// import { Box, Tabs, Tab, CircularProgress } from "@mui/material";
// import React, { type JSX, useEffect, useState, Suspense } from "react";
// import { useLocation, useNavigate, Outlet } from "react-router";
// import PeopleAltIcon from "@mui/icons-material/PeopleAlt";

// import { useAppSelector } from "../../../app/hooks";

// interface TeamManagementViewTabProps {
//   setDynamicHeaderText: (text: string) => void;
//   setDynamicHeaderIcon: (icon: JSX.Element) => void;
// }

// /* ===================== CONSTANTS ===================== */

// const BASE_PATH = "/team";

// const TAB_PATHS = {
//   OVERVIEW: `${BASE_PATH}/teammanagement`,
//   TASK_CONFIG: `${BASE_PATH}/taskconfiguration`,
// } as const;

// const PATH_TO_TAB: Record<string, number> = {
//   [TAB_PATHS.OVERVIEW]: 0,
//   [TAB_PATHS.TASK_CONFIG]: 1,
// };

// const TAB_TO_PATH: Record<number, string> = {
//   0: TAB_PATHS.OVERVIEW,
//   1: TAB_PATHS.TASK_CONFIG,
// };

// /* ===================== COMPONENT ===================== */

// const TeamManagementPage: React.FC<TeamManagementViewTabProps> = ({
//   setDynamicHeaderText,
//   setDynamicHeaderIcon,
// }) => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const user = useAppSelector((s) => s.auth.user);
//   if (!user) return null;

//   /* -------- Active Tab (derived from URL) -------- */
//   const [activeTab, setActiveTab] = useState<number>(() => {
//     return PATH_TO_TAB[location.pathname] ?? 0;
//   });

//   /* -------- URL → TAB SYNC (NO navigation here) -------- */
//   useEffect(() => {
//     const tabFromUrl = PATH_TO_TAB[location.pathname];
//     if (tabFromUrl !== undefined && tabFromUrl !== activeTab) {
//       setActiveTab(tabFromUrl);
//     }
//   }, [location.pathname, activeTab]);

//   /* -------- HEADER SYNC -------- */
//   useEffect(() => {
//     if (activeTab === 0) {
//       setDynamicHeaderText("Team Overview");
//     } else {
//       setDynamicHeaderText("Task Configuration");
//     }

//     setDynamicHeaderIcon(<PeopleAltIcon sx={{ color: "white" }} />);
//   }, [activeTab, setDynamicHeaderText, setDynamicHeaderIcon]);

//   /* -------- TAB → ROUTE (ONLY place we navigate) -------- */
//   const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
//     if (newValue !== activeTab) {
//       setActiveTab(newValue);
//       navigate(TAB_TO_PATH[newValue]);
//     }
//   };

//   /* ===================== RENDER ===================== */

//   return (
//     <Box
//       sx={{
//         backgroundColor: "transparent",
//         maxWidth: "100%",
//         // margin: "20px auto",
//         height:"auto",
//         pl: 8,
//         overflow: "auto",
//         "&::-webkit-scrollbar": {
//           height: "8px",
//         },
//         "&::-webkit-scrollbar-track": {
//           backgroundColor: "#f1f1f1",
//         },
//         "&::-webkit-scrollbar-thumb": {
//           backgroundColor: "#888",
//           borderRadius: "4px",
//         },
//         "&::-webkit-scrollbar-thumb:hover": {
//           backgroundColor: "grey",
//         },
//       }}
//     >
//       {/* -------- Tabs Header -------- */}
//       <Box
//         sx={{
//           backgroundColor: "transparent",
//         marginTop: "45px",
//         }}
//       >
//         <Tabs
//           value={activeTab}
//           onChange={handleTabChange}
//           textColor="inherit"
//           sx={{
//             "& .MuiTabs-indicator": {
//               display: "flex",
//               justifyContent: "center",
//               backgroundColor: "transparent",
//               "&::after": {
//                 content: '""',
//                 width: 0,
//                 height: 0,
//                 borderRight: "8px solid transparent",
//                 borderLeft: "8px solid transparent",
//                 borderBottom: "10px solid grey",
//                 position: "absolute",
//                 bottom: 0,
//               },
//             },
//             "&.Mui-focusVisible": {
//               backgroundColor: "auto",
//             },
//             width: "100%",
//             // backgroundColor: "#384252",
//             backgroundColor: "transparent",
//             boxShadow: 2,
//             mt: 1,
//           }}
//           variant="scrollable"
//           scrollButtons="auto"
//           allowScrollButtonsMobile
//         >
//           <Tab label="Team Overview" />
//           <Tab label="Task Configuration" />
//         </Tabs>
//       </Box>

//       {/* -------- Content Area -------- */}
//       <Box sx={{ p: 3, minHeight: "60vh" }}>
//         <Suspense
//           fallback={
//             <Box
//               sx={{
//                 display: "flex",
//                 justifyContent: "center",
//                 alignItems: "center",
//                 height: "50vh",
//               }}
//             >
//               <CircularProgress />
//             </Box>
//           }
//         >
//           <Outlet />
//         </Suspense>
//       </Box>
//     </Box>
//   );
// };

// export default TeamManagementPage;
