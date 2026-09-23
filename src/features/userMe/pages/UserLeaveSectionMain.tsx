import { Box, CircularProgress, Grid, Paper, Typography, alpha, useTheme } from "@mui/material";
import { useState } from "react";

import CommonContainer from "../../../components/common/CommonContainer";
import { useGetLeaveHistoryQuery } from "../userLeaveSection/api/leave.api";
import ApplyLeaveDrawer from "../userLeaveSection/components/ApplyLeaveDrawer";
import LeaveActionPanel from "../userLeaveSection/components/LeaveActionPanel";
import { LeaveTabs } from "../userLeaveSection/components/LeaveTabs";
import UniversalLeaveTable from "../userLeaveSection/components/UniversalLeaveTable";
import { useFilteredLeaves } from "../userLeaveSection/hooks/useFilteredLeaves";
import { useLeaveStats } from "../userLeaveSection/hooks/useLeaveStats";
import type { LeaveTabValue } from "../userLeaveSection/types/leave.types";

export const UserLeaveSectionMain = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<LeaveTabValue>("ALL");

  // Single API call — all filtering is done client-side
  const { data: allLeaves = [], isLoading } = useGetLeaveHistoryQuery();

  const stats = useLeaveStats(allLeaves);
  const displayedLeaves = useFilteredLeaves(allLeaves, currentTab);

  return (
    <CommonContainer>
      <Box p={{ xs: 1, sm: 2 }}>
        <Grid container spacing={2.5}>

          {/* ── Main Content ─────────────────────────────────────── */}
          <Grid size={{ xs: 12, md: 8, lg: 9 }}>
            <Paper
              elevation={0}
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                minHeight: 500,
                border: "1px solid",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E8EDF2",
                boxShadow: isDark
                  ? "0 4px 24px rgba(0,0,0,0.3)"
                  : "0 2px 16px rgba(0,0,0,0.06)",
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  borderBottom: "1px solid",
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "#EEF1F5",
                  px: 3,
                  pt: 2.5,
                  pb: 0,
                  background: isDark
                    ? "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)"
                    : "linear-gradient(180deg, #F8FAFD 0%, #FFFFFF 100%)",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontSize: "1rem",
                        letterSpacing: "-0.02em",
                        color: isDark ? "#F1F5F9" : "#0F172A",
                      }}
                    >
                      My Leave Requests
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "0.76rem",
                        color: isDark ? "rgba(255,255,255,0.4)" : "#64748B",
                        mt: 0.25,
                      }}
                    >
                      Track and manage all your leave applications
                    </Typography>
                  </Box>

                  {/* Live count badge */}
                  <Box
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: "20px",
                      background: isDark
                        ? alpha("#3B82F6", 0.15)
                        : alpha("#3B82F6", 0.08),
                      border: "1px solid",
                      borderColor: isDark
                        ? alpha("#3B82F6", 0.3)
                        : alpha("#3B82F6", 0.2),
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: "#3B82F6",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {allLeaves.length} total
                    </Typography>
                  </Box>
                </Box>

                <LeaveTabs
                  value={currentTab}
                  onChange={setCurrentTab}
                  stats={stats}
                />
              </Box>

              {/* Table */}
              <Box sx={{ p: { xs: 2, sm: 0 } }}>
                {isLoading ? (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    py={12}
                    gap={2}
                  >
                    <CircularProgress size={32} thickness={3} />
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        color: isDark ? "rgba(255,255,255,0.4)" : "#94A3B8",
                      }}
                    >
                      Loading your leave history…
                    </Typography>
                  </Box>
                ) : (
                  <UniversalLeaveTable data={displayedLeaves} />
                )}
              </Box>
            </Paper>
          </Grid>

          {/* ── Sidebar ──────────────────────────────────────────── */}
          <Grid size={{ xs: 12, md: 4, lg: 3 }}>
            <LeaveActionPanel
              onRequestLeave={() => setDrawerOpen(true)}
              {...stats}
            />
          </Grid>

        </Grid>

        <ApplyLeaveDrawer
          open={isDrawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      </Box>
    </CommonContainer>
  );
};

// import { Box, CircularProgress, Grid, Paper, Typography } from "@mui/material";
// import { useState } from "react";

// import CommonContainer from "../../../components/common/CommonContainer";
// import { useGetLeaveHistoryQuery } from "../userLeaveSection/api/leave.api";
// import ApplyLeaveDrawer from "../userLeaveSection/components/ApplyLeaveDrawer";
// import LeaveActionPanel from "../userLeaveSection/components/LeaveActionPanel";
// import { LeaveTabs } from "../userLeaveSection/components/LeaveTabs";
// import UniversalLeaveTable from "../userLeaveSection/components/UniversalLeaveTable";
// import { useFilteredLeaves } from "../userLeaveSection/hooks/useFilteredLeaves";
// import { useLeaveStats } from "../userLeaveSection/hooks/useLeaveStats";
// import type { LeaveTabValue } from "../userLeaveSection/types/leave.types";

// export const UserLeaveSectionMain = () => {
//   const [isDrawerOpen, setDrawerOpen] = useState(false);
//   const [currentTab, setCurrentTab] = useState<LeaveTabValue>("ALL");

//   // Single API call — all filtering is done client-side
//   const { data: allLeaves = [], isLoading } = useGetLeaveHistoryQuery();

//   const stats = useLeaveStats(allLeaves);
//   const displayedLeaves = useFilteredLeaves(allLeaves, currentTab);

//   return (
//     <CommonContainer>
//       <Box p={{ xs: 1, sm: 2 }}>
//         <Grid container spacing={3}>

//           {/* ── Main Content ─────────────────────────────────────── */}
//           <Grid size={{ xs: 12, md: 8, lg: 9 }}>
//             <Paper
//               elevation={0}
//               variant="outlined"
//               sx={{ borderRadius: 2, overflow: "hidden", minHeight: 500 }}
//             >
//               {/* Header */}
//               <Box
//                 sx={{
//                   borderBottom: 1,
//                   borderColor: "divider",
//                   px: 3,
//                   pt: 2.5,
//                   bgcolor: "grey.50",
//                 }}
//               >
//                 <Typography variant="h6" fontWeight={700} gutterBottom>
//                   My Leave Requests
//                 </Typography>
//                 <LeaveTabs value={currentTab} onChange={setCurrentTab} />
//               </Box>

//               {/* Table */}
//               <Box sx={{ p: { xs: 2, sm: 3 } }}>
//                 {isLoading ? (
//                   <Box display="flex" justifyContent="center" py={10}>
//                     <CircularProgress />
//                   </Box>
//                 ) : (
//                   <UniversalLeaveTable data={displayedLeaves} />
//                 )}
//               </Box>
//             </Paper>
//           </Grid>

//           {/* ── Sidebar ──────────────────────────────────────────── */}
//           <Grid size={{ xs: 12, md: 4, lg: 3 }}>
//             <LeaveActionPanel
//               onRequestLeave={() => setDrawerOpen(true)}
//               {...stats}
//             />
//           </Grid>

//         </Grid>

//         <ApplyLeaveDrawer
//           open={isDrawerOpen}
//           onClose={() => setDrawerOpen(false)}
//         />
//       </Box>
//     </CommonContainer>
//   );
// };