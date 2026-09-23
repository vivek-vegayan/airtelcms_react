import { Box, Tabs, Tab, useTheme } from "@mui/material";
import React, { type JSX, Suspense, useEffect, useMemo } from "react";
import { useLocation, Link } from "react-router";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import { useAppSelector } from "../../../app/hooks";
import { RouteFallback } from "../../../components/loading/PageLoader";
import AnimatedOutlet from "../../../components/loading/AnimatedOutlet";
import { SHELL_MIN_HEIGHT } from "../../../components/layout/layoutConstants";

interface MonthlyRosterPageTabProps {
  setDynamicHeaderText: (text: string) => void;
  setDynamicHeaderIcon: (icon: JSX.Element) => void;
}

const HEADER_ICON = <PeopleAltIcon sx={{ color: "white" }} />;

const MonthlyRosterPageTab: React.FC<MonthlyRosterPageTabProps> = ({
  setDynamicHeaderText,
  setDynamicHeaderIcon,
}) => {
  const location = useLocation();
  const theme = useTheme();
  const user = useAppSelector((s) => s.auth.user);

  if (!user) return null;

  /* =====================================================
     URL IS THE SINGLE SOURCE OF TRUTH
     Route structure:
     /roster/generation
     /roster/view
  ===================================================== */

  const activeTab = useMemo(() => {
    const segments = location.pathname.split("/");
    const lastSegment = segments[segments.length - 1];

    if (["generation", "view"].includes(lastSegment)) {
      return lastSegment;
    }

    return "view"; // default fallback
  }, [location.pathname]);

  /* ================= HEADER CONTROL ================= */

  useEffect(() => {
    switch (activeTab) {
      case "generation":
        setDynamicHeaderText("Roster Generation");
        break;
      case "view":
      default:
        setDynamicHeaderText("Roster View");
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
          // mt: "45px",
          // // px: 2,
          // // py: 1,
          // borderRadius: 2,
          // backgroundColor:
          //   theme.palette.mode === "dark"
          //     ? alpha(theme.palette.background.paper, 0.6)
          //     : alpha(theme.palette.background.paper, 0.9),
          // border: `1px solid ${theme.palette.divider}`,
          // backdropFilter: "blur(6px)",
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
                // borderBottom: "10px solid pink",
                borderBottom: `10px solid ${theme.palette.primary.main}`,
                position: "absolute",
                bottom: 0,
              },
            },
          }}
        >
          <Tab label="Roster View" value="view" to="view" component={Link} />
          <Tab
            label="Roster Generation"
            value="generation"
            to="generation"
            component={Link}
          />
        </Tabs>
      </Box>

      {/* ================= CONTENT ================= */}

      <Box sx={{ p: 2, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Suspense fallback={<RouteFallback />}>
          <AnimatedOutlet />
        </Suspense>
      </Box>
    </Box>
  );
};

export default MonthlyRosterPageTab;




// import { Box, Tabs, Tab, CircularProgress, useTheme } from "@mui/material";
// import React, { type JSX, useEffect, useState, Suspense } from "react";
// import { useLocation, useNavigate, Outlet } from "react-router";
// import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
// import { useAppSelector } from "../../../app/hooks";

// interface MonthlyRosterPageTabProps {
//   setDynamicHeaderText: (text: string) => void;
//   setDynamicHeaderIcon: (icon: JSX.Element) => void;
// }

// const TAB_PATHS = {
//   OVERVIEW: `weeklyroster`,
//   TASK_CONFIG: `monthlyroster`,
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

// const MonthlyRosterPageTab: React.FC<MonthlyRosterPageTabProps> = ({
//   setDynamicHeaderText,
//   setDynamicHeaderIcon,
// }) => {
//   const navigate = useNavigate();
//   const location = useLocation();

//   const user = useAppSelector((s) => s.auth.user);

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
//       setDynamicHeaderText("Weekly Roster");
//     } else {
//       setDynamicHeaderText("Monthly Roster");
//     }

//     setDynamicHeaderIcon(<PeopleAltIcon sx={{ color: "white" }} />);
//   }, [activeTab, setDynamicHeaderText, setDynamicHeaderIcon]);
//   if (!user) return null;

//   /* -------- TAB → ROUTE (ONLY place we navigate) -------- */
//   const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
//     if (newValue !== activeTab) {
//       setActiveTab(newValue);
//       navigate(TAB_TO_PATH[newValue]);
//     }
//   };
//   // Theme
//   const theme = useTheme();

//   /* ===================== RENDER ===================== */

//   return (
//     <Box
//       sx={{
//         backgroundColor: theme.palette.background.paper,
//         maxWidth: "100%",
//         height: "auto",
//         pl: 8,
//         overflow: "auto",

//         /* THEME-AWARE SCROLLBAR */
//         "&::-webkit-scrollbar": {
//           height: 8,
//         },
//         "&::-webkit-scrollbar-track": {
//           backgroundColor:
//             theme.palette.mode === "dark"
//               ? theme.palette.background.paper
//               : "#f1f1f1",
//         },
//         "&::-webkit-scrollbar-thumb": {
//           backgroundColor: theme.palette.primary.main,
//           borderRadius: 4,
//         },
//       }}
//     >
//       {/* -------- Tabs Header -------- */}
//       <Box
//         sx={{
//           mt: "45px",
//           // px: 2,
//           // py: 1.5,
//           // borderRadius: 3,

//           /* ===== GLASS BACKGROUND ===== */
//           background:
//             theme.palette.mode === "dark"
//               ? "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
//               : "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))",

//           backdropFilter: "blur(18px)",
//           WebkitBackdropFilter: "blur(18px)",

//           border: `1px solid ${
//             theme.palette.mode === "dark"
//               ? "rgba(255,255,255,0.08)"
//               : "rgba(255,255,255,0.6)"
//           }`,

//           boxShadow:
//             theme.palette.mode === "dark"
//               ? "0 8px 32px rgba(0,0,0,0.45)"
//               : "0 8px 32px rgba(0,0,0,0.08)",

//           transition: "all 0.3s ease",
//           // backgroundColor: "auto",
//           // display: "flex",
//           // height: "20px",
//           // alignItems: "center",
//           // alignContent: "center",
//           // justifyContent: "center",
//         }}
//       >
//         <Tabs
//           value={activeTab}
//           onChange={handleTabChange}
//           textColor="inherit"
//           sx={{
//             "& .MuiTab-root": {
//               textTransform: "none",
//               fontWeight: 500,
//               fontSize: 14,
//               color: theme.palette.text.secondary,
//               transition: "all 0.25s ease",
//             },

//             "& .Mui-selected": {
//               color: theme.palette.primary.main,
//               fontWeight: 600,
//             },

//             "& .MuiTabs-indicator": {
//               height: 3,
//               borderRadius: 3,
//               backgroundColor: theme.palette.primary.main,
//             },
//           }}
//           variant="scrollable"
//           scrollButtons="auto"
//           allowScrollButtonsMobile
//         >
//           <Tab label="Weekly" />
//           <Tab label="Monthly" />
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

// export default MonthlyRosterPageTab;

// import { Box, Tabs, Tab, CircularProgress, useTheme } from "@mui/material";
// import React, { type JSX, useEffect, useState, Suspense } from "react";
// import { useLocation, useNavigate, Outlet } from "react-router";
// import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
// // import { alpha } from "@mui/material/styles";
// import { useAppSelector } from "../../../app/hooks";

// interface TeamManagementViewTabProps {
//   setDynamicHeaderText: (text: string) => void;
//   setDynamicHeaderIcon: (icon: JSX.Element) => void;
// }

// /* ===================== CONSTANTS ===================== */

// const BASE_PATH = "/roster";

// const TAB_PATHS = {
//   OVERVIEW: `${BASE_PATH}/monthlyroster`,
//   TASK_CONFIG: `${BASE_PATH}/weeklyroster`,
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

// const MonthlyRosterPageTab: React.FC<TeamManagementViewTabProps> = ({
//   setDynamicHeaderText,
//   setDynamicHeaderIcon,
// }) => {
//   const theme = useTheme();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const user = useAppSelector((s) => s.auth.user);

//   if (!user) return null;

//   const [activeTab, setActiveTab] = useState<number>(() => {
//     return PATH_TO_TAB[location.pathname] ?? 0;
//   });

//   /* -------- URL → TAB SYNC -------- */
//   useEffect(() => {
//     const tabFromUrl = PATH_TO_TAB[location.pathname];
//     if (tabFromUrl !== undefined && tabFromUrl !== activeTab) {
//       setActiveTab(tabFromUrl);
//     }
//   }, [location.pathname, activeTab]);

//   /* -------- HEADER SYNC -------- */
//   useEffect(() => {
//     setDynamicHeaderText(
//       activeTab === 0 ? "Monthly Roster" : "Weekly Roster",
//     );

//     setDynamicHeaderIcon(
//       <PeopleAltIcon sx={{ color: theme.palette.text.primary }} />,
//     );
//   }, [activeTab]);

//   /* -------- TAB NAVIGATION -------- */
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
//         backgroundColor: theme.palette.background.paper,
//         maxWidth: "100%",
//         height: "auto",
//         pl: 8,
//         overflow: "auto",

//         /* THEME-AWARE SCROLLBAR */
//         "&::-webkit-scrollbar": {
//           height: 8,
//         },
//         "&::-webkit-scrollbar-track": {
//           backgroundColor:
//             theme.palette.mode === "dark"
//               ? theme.palette.background.paper
//               : "#f1f1f1",
//         },
//         "&::-webkit-scrollbar-thumb": {
//           backgroundColor: theme.palette.primary.main,
//           borderRadius: 4,
//         },
//       }}
//     >
//       {/* -------- Tabs Header -------- */}
//       <Box
//         sx={{
//           mt: "45px",
//           /* ===== GLASS BACKGROUND ===== */
//           background:
//             theme.palette.mode === "dark"
//               ? "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))"
//               : "linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.4))",

//           backdropFilter: "blur(18px)",
//           WebkitBackdropFilter: "blur(18px)",

//           border: `1px solid ${
//             theme.palette.mode === "dark"
//               ? "rgba(255,255,255,0.08)"
//               : "rgba(255,255,255,0.6)"
//           }`,

//           boxShadow:
//             theme.palette.mode === "dark"
//               ? "0 8px 32px rgba(0,0,0,0.45)"
//               : "0 8px 32px rgba(0,0,0,0.08)",

//           transition: "all 0.3s ease",

//         }}
//       >
//         <Tabs
//           value={activeTab}
//           onChange={handleTabChange}
//           textColor="inherit"
//           indicatorColor="primary"
//           variant="scrollable"
//           scrollButtons="auto"
//           allowScrollButtonsMobile
//           sx={{
//             "& .MuiTab-root": {
//               textTransform: "none",
//               fontWeight: 500,
//               fontSize: 14,
//               color: theme.palette.text.secondary,
//               transition: "all 0.25s ease",
//             },

//             "& .Mui-selected": {
//               color: theme.palette.primary.main,
//               fontWeight: 600,
//             },

//             "& .MuiTabs-indicator": {
//               height: 3,
//               borderRadius: 3,
//               backgroundColor: theme.palette.primary.main,
//             },
//           }}
//         >
//           <Tab label="Roster View" />
//           <Tab label="Demo" />
//         </Tabs>
//       </Box>

//       {/* -------- Content Area -------- */}
//       <Box
//         sx={{
//           p: 3,
//           minHeight: "60vh",
//           backgroundColor: theme.palette.background.default,
//         }}
//       >
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
//               <CircularProgress color="primary" />
//             </Box>
//           }
//         >
//           <Outlet />
//         </Suspense>
//       </Box>
//     </Box>
//   );
// };

// export default MonthlyRosterPageTab
