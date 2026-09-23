import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  TableContainer,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";
import { useGetLeaveHistoryQuery } from "../api/leave.api";

// Helper function for status colors
const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "error";
    case "PENDING":
      return "warning";
    default:
      return "default";
  }
};

// Helper for date formatting
const formatDate = (dateString: string) => 
  new Date(dateString).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric"
  });

export default function LeaveHistoryTable() {
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
        <InboxIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No Leave History Found
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer>
      <Table sx={{ minWidth: 500 }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: "background.default" }}>
            <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Start Date</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>End Date</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {data.map((leave) => (
            <TableRow key={leave.id} hover>
              <TableCell sx={{ textTransform: "capitalize", fontWeight: 500 }}>
                {leave.leaveType.toLowerCase()} Leave
              </TableCell>
              <TableCell>{formatDate(leave.startDate)}</TableCell>
              <TableCell>{formatDate(leave.endDate)}</TableCell>
              <TableCell>
                <Chip
                  label={leave.status}
                  color={getStatusColor(leave.status) as any}
                  size="small"
                  sx={{ fontWeight: 600, minWidth: 80 }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}