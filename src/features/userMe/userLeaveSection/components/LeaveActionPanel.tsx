import {
  Paper,
  Stack,
  Button,
  Typography,
  Box,
  useTheme,
  alpha,
  Divider,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";

interface Props {
  onRequestLeave: () => void;
  pendingCount?: number;
  approvedCount?: number;
  rejectedCount?: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  color: string;
  bgColor: string;
  isDark: boolean;
}

const StatRow = ({ icon, label, count, color, bgColor, isDark }: StatCardProps) => (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      py: 1.25,
      px: 1.5,
      borderRadius: 2,
      transition: "background 0.15s ease",
      "&:hover": {
        background: isDark ? "rgba(255,255,255,0.04)" : alpha(color, 0.04),
      },
    }}
  >
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: "10px",
          background: bgColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Typography
        sx={{
          fontSize: "0.82rem",
          fontWeight: 500,
          color: isDark ? "rgba(255,255,255,0.65)" : "#475569",
        }}
      >
        {label}
      </Typography>
    </Box>

    <Box
      sx={{
        minWidth: 32,
        height: 32,
        px: 1,
        borderRadius: "10px",
        background: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography sx={{ fontSize: "1rem", fontWeight: 800, color, lineHeight: 1 }}>
        {count}
      </Typography>
    </Box>
  </Box>
);

export default function LeaveActionPanel({
  onRequestLeave,
  pendingCount = 0,
  approvedCount = 0,
  rejectedCount = 0,
}: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const total = pendingCount + approvedCount + rejectedCount;

  return (
    <Stack spacing={2}>
      {/* ── ACTION CARD ── */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E8EDF2",
          boxShadow: isDark
            ? "0 4px 24px rgba(0,0,0,0.3)"
            : "0 2px 16px rgba(0,0,0,0.06)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Decorative background circle */}
        <Box
          sx={{
            position: "absolute",
            top: -24,
            right: -24,
            width: 100,
            height: 100,
            borderRadius: "50%",
            background: isDark
              ? alpha("#3B82F6", 0.08)
              : alpha("#3B82F6", 0.07),
            pointerEvents: "none",
          }}
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: "10px",
              background: isDark ? alpha("#3B82F6", 0.2) : alpha("#3B82F6", 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3B82F6",
              flexShrink: 0,
            }}
          >
            <CalendarMonthRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography
              sx={{
                fontSize: "0.875rem",
                fontWeight: 700,
                color: isDark ? "#F1F5F9" : "#0F172A",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Quick Actions
            </Typography>
            <Typography
              sx={{
                fontSize: "0.7rem",
                color: isDark ? "rgba(255,255,255,0.4)" : "#94A3B8",
                mt: 0.2,
              }}
            >
              Manage your time off
            </Typography>
          </Box>
        </Box>

        <Button
          fullWidth
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onRequestLeave}
          sx={{
            py: 1.25,
            fontWeight: 700,
            fontSize: "0.82rem",
            borderRadius: 2,
            textTransform: "none",
            letterSpacing: "-0.01em",
            background: "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)",
            boxShadow: `0 4px 14px ${alpha("#3B82F6", 0.35)}`,
            transition: "all 0.2s ease",
            "&:hover": {
              background: "linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)",
              boxShadow: `0 6px 20px ${alpha("#3B82F6", 0.45)}`,
              transform: "translateY(-1px)",
            },
            "&:active": { transform: "translateY(0)" },
          }}
        >
          Request Leave
        </Button>
      </Paper>

      {/* ── STATS CARD ── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          border: "1px solid",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E8EDF2",
          boxShadow: isDark
            ? "0 4px 24px rgba(0,0,0,0.3)"
            : "0 2px 16px rgba(0,0,0,0.06)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1.5,
            px: 0.5,
          }}
        >
          <Typography
            sx={{
              fontSize: "0.875rem",
              fontWeight: 700,
              color: isDark ? "#F1F5F9" : "#0F172A",
              letterSpacing: "-0.02em",
            }}
          >
            Leave Summary
          </Typography>
          <Box
            sx={{
              px: 1.25,
              py: 0.4,
              borderRadius: "12px",
              background: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
              border: "1px solid",
              borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: isDark ? "rgba(255,255,255,0.5)" : "#64748B",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {total} {total === 1 ? "request" : "requests"}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 1, opacity: 0.5 }} />

        <Stack spacing={0.25}>
          <StatRow
            icon={<PendingActionsRoundedIcon sx={{ fontSize: 17 }} />}
            label="Pending Approvals"
            count={pendingCount}
            color="#D97706"
            bgColor={isDark ? alpha("#F59E0B", 0.12) : alpha("#F59E0B", 0.1)}
            isDark={isDark}
          />
          <StatRow
            icon={<CheckCircleRoundedIcon sx={{ fontSize: 17 }} />}
            label="Approved Leaves"
            count={approvedCount}
            color="#059669"
            bgColor={isDark ? alpha("#10B981", 0.12) : alpha("#10B981", 0.1)}
            isDark={isDark}
          />
          <StatRow
            icon={<CancelRoundedIcon sx={{ fontSize: 17 }} />}
            label="Rejected Leaves"
            count={rejectedCount}
            color="#DC2626"
            bgColor={isDark ? alpha("#EF4444", 0.12) : alpha("#EF4444", 0.1)}
            isDark={isDark}
          />
        </Stack>
      </Paper>
    </Stack>
  );
}

// import { Paper, Stack, Button, Typography, Divider, Box } from "@mui/material";
// import AddIcon from "@mui/icons-material/Add";
// import PendingActionsIcon from "@mui/icons-material/PendingActions";
// import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
// import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

// interface Props {
//   onRequestLeave: () => void;
//   // We added these to show useful stats to the user
//   pendingCount?: number;
//   approvedCount?: number;
//   rejectedCount?: number;
// }

// export default function LeaveActionPanel({
//   onRequestLeave,
//   pendingCount = 0,
//   approvedCount = 0,
//   rejectedCount = 0,
// }: Props) {
//   return (
//     <Stack spacing={3}>
//       {/* ACTION CARD */}
//       <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 1 }}>
//         <Typography variant="h6" fontWeight={600} mb={2}>
//           Quick Actions
//         </Typography>
//         <Divider sx={{ mb: 3 }} />

//         <Button
//           fullWidth
//           variant="contained"
//           color="primary"
//           size="large"
//           startIcon={<AddIcon />}
//           onClick={onRequestLeave}
//           sx={{ py: 1.5, fontWeight: "bold", borderRadius: 2 }}
//         >
//           Request Leave
//         </Button>
//       </Paper>

//       {/* STATS CARD (Great UX addition) */}
//       <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 1 }}>
//         <Typography variant="h6" fontWeight={600} mb={2}>
//           Leave Summary
//         </Typography>
//         <Divider sx={{ mb: 2 }} />

//         <Stack spacing={2}>
//           {/* Pending Stat */}
//           <Box
//             display="flex"
//             justifyContent="space-between"
//             alignItems="center"
//           >
//             <Box
//               display="flex"
//               alignItems="center"
//               gap={1}
//               color="warning.main"
//             >
//               <PendingActionsIcon fontSize="small" />
//               <Typography
//                 variant="body2"
//                 fontWeight={500}
//                 color="text.secondary"
//               >
//                 Pending Approvals
//               </Typography>
//             </Box>
//             <Typography variant="subtitle1" fontWeight={700}>
//               {pendingCount}
//             </Typography>
//           </Box>

//           {/* Approved Stat */}
//           <Box
//             display="flex"
//             justifyContent="space-between"
//             alignItems="center"
//           >
//             <Box
//               display="flex"
//               alignItems="center"
//               gap={1}
//               color="success.main"
//             >
//               <CheckCircleOutlineIcon fontSize="small" />
//               <Typography
//                 variant="body2"
//                 fontWeight={500}
//                 color="text.secondary"
//               >
//                 Approved Leaves
//               </Typography>
//             </Box>
//             <Typography variant="subtitle1" fontWeight={700}>
//               {approvedCount}
//             </Typography>
//           </Box>

//           {/* Rejected Stat */}
//           <Box
//             display="flex"
//             justifyContent="space-between"
//             alignItems="center"
//           >
//             <Box display="flex" alignItems="center" gap={1} color="error.main">
//               <CancelOutlinedIcon fontSize="small" />
//               <Typography
//                 variant="body2"
//                 fontWeight={500}
//                 color="text.secondary"
//               >
//                 Rejected Leaves
//               </Typography>
//             </Box>
//             <Typography variant="subtitle1" fontWeight={700}>
//               {rejectedCount}
//             </Typography>
//           </Box>
//         </Stack>
//       </Paper>
//     </Stack>
//   );
// }