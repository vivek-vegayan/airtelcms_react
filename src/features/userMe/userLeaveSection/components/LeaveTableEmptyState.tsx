import { Box, Typography, Button, useTheme, alpha } from "@mui/material";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";

interface LeaveTableEmptyStateProps {
  message?: string;
  onRequestLeave?: () => void;
}

export const LeaveTableEmptyState = ({
  message = "No leave records found",
  onRequestLeave,
}: LeaveTableEmptyStateProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      py={10}
      px={3}
      gap={2}
      textAlign="center"
    >
      {/* Icon container */}
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "18px",
          background: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 0.5,
        }}
      >
        <EventNoteRoundedIcon
          sx={{
            fontSize: 32,
            color: isDark ? "rgba(255,255,255,0.2)" : "#CBD5E1",
          }}
        />
      </Box>

      <Box>
        <Typography
          sx={{
            fontSize: "0.9rem",
            fontWeight: 600,
            color: isDark ? "rgba(255,255,255,0.5)" : "#475569",
            letterSpacing: "-0.01em",
          }}
        >
          {message}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.78rem",
            color: isDark ? "rgba(255,255,255,0.25)" : "#94A3B8",
            mt: 0.5,
          }}
        >
          Requests you apply for will appear here.
        </Typography>
      </Box>

      {onRequestLeave && (
        <Button
          variant="outlined"
          size="small"
          onClick={onRequestLeave}
          sx={{
            mt: 0.5,
            borderRadius: "10px",
            fontSize: "0.78rem",
            fontWeight: 600,
            textTransform: "none",
            px: 2.5,
            borderColor: isDark ? "rgba(59,130,246,0.4)" : alpha("#3B82F6", 0.4),
            color: "#3B82F6",
            "&:hover": {
              borderColor: "#3B82F6",
              background: alpha("#3B82F6", 0.06),
            },
          }}
        >
          Apply for Leave
        </Button>
      )}
    </Box>
  );
};
// import { Box, Typography } from "@mui/material";
// import InboxIcon from "@mui/icons-material/Inbox";

// interface LeaveTableEmptyStateProps {
//   message?: string;
// }

// export const LeaveTableEmptyState = ({
//   message = "No leave records found",
// }: LeaveTableEmptyStateProps) => (
//   <Box
//     display="flex"
//     flexDirection="column"
//     alignItems="center"
//     justifyContent="center"
//     py={10}
//     gap={1.5}
//   >
//     <InboxIcon sx={{ fontSize: 56, color: "text.disabled" }} />
//     <Typography variant="h6" color="text.secondary" fontWeight={500}>
//       {message}
//     </Typography>
//     <Typography variant="body2" color="text.disabled">
//       Requests you apply for will appear here.
//     </Typography>
//   </Box>
// );