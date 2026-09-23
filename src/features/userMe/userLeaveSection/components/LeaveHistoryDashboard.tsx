import  { useState, useMemo } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Chip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Tabs,
  Tab,
  Tooltip,
  IconButton,
} from "@mui/material";
import InboxIcon from "@mui/icons-material/Inbox";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useGetLeaveHistoryQuery } from "../api/leave.api";
import type { LeaveHistoryResponse } from "../types/leave.types";

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// Status configurations for clean mapping
const STATUS_CONFIG: Record<
  string,
  { color: "warning" | "success" | "error" | "default" }
> = {
  PENDING: { color: "warning" },
  APPROVED: { color: "success" },
  REJECTED: { color: "error" },
};

export default function LeaveHistoryDashboard() {
  const { data, isLoading, isError } = useGetLeaveHistoryQuery();
  const [tabIndex, setTabIndex] = useState(0);

  // Client-side filtering based on tabs
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (tabIndex === 0) return data; // All
    if (tabIndex === 1) return data.filter((l) => l.leaveStatus === "Pending");
    if (tabIndex === 2) return data.filter((l) => l.leaveStatus === "Approved");
    if (tabIndex === 3) return data.filter((l) => l.leaveStatus === "Rejected");
    return [];
  }, [data, tabIndex]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight={300}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box textAlign="center" py={8}>
        <Typography color="error">Failed to load leave history.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header & Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tabIndex}
          onChange={(_, newValue) => setTabIndex(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Requests" />
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      </Box>

      {/* Empty State */}
      {!filteredData.length ? (
        <Box textAlign="center" py={8}>
          <InboxIcon sx={{ fontSize: 60, color: "text.disabled", mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {tabIndex === 1
              ? "No pending requests. You're all caught up!"
              : "No leave history found."}
          </Typography>
        </Box>
      ) : (
        /* Data Table */
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ boxShadow: "none" }}
        >
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: "grey.50" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Leave Details</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Dates</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredData.map((leave: LeaveHistoryResponse) => (
                <TableRow key={leave.leaveId} hover>
                  {/* Leave Type & Id */}
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      textTransform="capitalize"
                    >
                      {leave.leaveType.toLowerCase()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: #{leave.leaveId}
                    </Typography>
                  </TableCell>

                  {/* Duration Context */}
                  <TableCell>
                    <Typography variant="body2">
                      {leave.ageDays} Day(s)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {leave.leaveDuration}
                    </Typography>
                  </TableCell>

                  {/* Dates */}
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(leave.leaveStartDate)}
                      {leave.leaveStartDate !== leave.leaveEndDate &&
                        ` - ${formatDate(leave.leaveEndDate)}`}
                    </Typography>
                  </TableCell>

                  {/* Reason with Tooltip for long text */}
                  <TableCell>
                    <Tooltip title={leave.leaveReason} placement="top">
                      <Typography
                        variant="body2"
                        sx={{
                          maxWidth: 150,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {leave.leaveReason || "-"}
                      </Typography>
                    </Tooltip>
                  </TableCell>

                  {/* Interactive Status Chip */}
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={leave.leaveStatus}
                        color={
                          STATUS_CONFIG[leave.leaveStatus?.toUpperCase()]
                            ?.color || "default"
                        }
                        size="small"
                        sx={{ fontWeight: 600, minWidth: 85 }}
                      />
                      {/* Show rejection reason icon if rejected */}
                      {leave.leaveStatus === "Rejected" &&
                        leave.rejectionReason && (
                          <Tooltip
                            title={`Reason: ${leave.rejectionReason}`}
                            arrow
                            placement="top"
                          >
                            <IconButton size="small" color="error">
                              <InfoOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
