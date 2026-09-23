import {
  Box,
  Typography,
  CircularProgress,
  Card,
  Stack,
  Chip,
} from "@mui/material";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import { useGetLeaveHistoryQuery } from "../api/leave.api";

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function PendingLeaveList() {
  const { data, isLoading } = useGetLeaveHistoryQuery();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data?.length) {
    return (
      <Box textAlign="center" py={8}>
        <EventBusyIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" color="text.primary" gutterBottom>
          No Pending Leave Requests
        </Typography>
        <Typography color="text.secondary">
          You are all caught up! No requests are waiting for approval.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {data.map((leave) => (
        <Card
          key={leave.id}
          variant="outlined"
          sx={{
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderLeft: "4px solid",
            borderLeftColor: "warning.main",
            transition: "box-shadow 0.2s",
            "&:hover": { boxShadow: 1 },
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <CalendarMonthIcon color="action" />
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                textTransform="capitalize"
              >
                {leave.leaveType.toLowerCase()} Leave
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatDate(leave.startDate)} — {formatDate(leave.endDate)}
              </Typography>
            </Box>
          </Box>

          <Chip
            label="Pending"
            color="warning"
            size="small"
            variant="outlined"
          />
        </Card>
      ))}
    </Stack>
  );
}
