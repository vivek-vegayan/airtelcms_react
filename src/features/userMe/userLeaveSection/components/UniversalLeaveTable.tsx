import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import { LeaveStatusChip } from "./LeaveStatusChip";
import { LeaveTableEmptyState } from "./LeaveTableEmptyState";
import { formatDateRange } from "../utils/leave.utils";
import type { LeaveHistoryResponse } from "../types/leave.types";

interface UniversalLeaveTableProps {
  data: LeaveHistoryResponse[];
}

const COLUMNS = [
  { key: "leaveType", label: "Leave Type", width: "25%" },
  { key: "dates",     label: "Dates",      width: "30%" },
  { key: "duration",  label: "Duration",   width: "20%" },
  { key: "status",    label: "Status",     width: "25%" },
] as const;

export const UniversalLeaveTable = ({ data }: UniversalLeaveTableProps) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  if (!data?.length) return <LeaveTableEmptyState />;

  return (
    <TableContainer sx={{ maxHeight: 440 }}>
      <Table sx={{ minWidth: 50, tableLayout: "fixed" }}>

        {/* ── Head ── */}
        <TableHead sx={{ position: "sticky", top: 0, zIndex: 1 }}>
          <TableRow
            sx={{
              bgcolor: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFD",
              "& .MuiTableCell-root": {
                borderBottom: "1.5px solid",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "#EEF1F5",
                py: 1.5,
                "&:first-of-type": { pl: 3 },
                "&:last-of-type": { pr: 3 },
              },
            }}
          >
            {COLUMNS.map((col) => (
              <TableCell
                key={col.key}
                width={col.width}
                sx={{
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: isDark ? "rgba(255,255,255,0.35)" : "#94A3B8",
                }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        {/* ── Body ── */}
        <TableBody>
          {data.map((leave) => (
            <TableRow
              key={leave.leaveId}
              hover
              sx={{
                cursor: "default",
                transition: "background-color 0.15s ease",
                "&:hover": {
                  bgcolor: isDark
                    ? "rgba(59,130,246,0.06)"
                    : alpha("#3B82F6", 0.03),
                },
                "&:last-child td": { borderBottom: 0 },
                "& .MuiTableCell-root": {
                  py: 1.75,
                  borderBottom: "0.5px solid",
                  borderColor: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
                  "&:first-of-type": { pl: 3 },
                  "&:last-of-type": { pr: 3 },
                },
              }}
            >
              {/* Leave Type */}
              <TableCell>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: getTypeColor(leave.leaveType),
                      flexShrink: 0,
                      boxShadow: `0 0 0 2px ${alpha(getTypeColor(leave.leaveType), 0.2)}`,
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      textTransform: "capitalize",
                      color: isDark ? "#E2E8F0" : "#1E293B",
                    }}
                  >
                    {leave.leaveType.toLowerCase()}
                  </Typography>
                </Box>
              </TableCell>

              {/* Dates */}
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    fontSize: "0.82rem",
                    color: isDark ? "#CBD5E1" : "#334155",
                  }}
                >
                  {formatDateRange(leave.leaveStartDate, leave.leaveEndDate)}
                </Typography>
              </TableCell>

              {/* Duration */}
              <TableCell>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontSize: "0.875rem",
                    lineHeight: 1.3,
                    color: isDark ? "#E2E8F0" : "#1E293B",
                    mb: 0.5,
                  }}
                >
                  {leave.ageDays} {leave.ageDays === 1 ? "Day" : "Days"}
                </Typography>
                <Chip
                  label={leave.leaveDuration}
                  size="small"
                  variant="outlined"
                  sx={{
                    height: 20,
                    fontSize: "0.62rem",
                    fontWeight: 600,
                    borderRadius: "6px",
                    letterSpacing: "0.02em",
                    color: isDark ? "rgba(255,255,255,0.4)" : "#64748B",
                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "#E2E8F0",
                    "& .MuiChip-label": { px: 1 },
                  }}
                />
              </TableCell>

              {/* Status */}
              <TableCell>
                <LeaveStatusChip status={leave.leaveStatus} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// ── Helpers ────────────────────────────────────────────────────────────────

const TYPE_COLOR_MAP: Record<string, string> = {
  "sick leave":      "#EF4444",
  "casual leave":    "#3B82F6",
  "earned leave":    "#10B981",
  "maternity leave": "#EC4899",
  "paternity leave": "#8B5CF6",
};

const getTypeColor = (leaveType: string): string =>
  TYPE_COLOR_MAP[leaveType.toLowerCase()] ?? "#94A3B8";

export default UniversalLeaveTable;

// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Typography,
//   Box,
//   Chip,
// } from "@mui/material";
// import { LeaveStatusChip } from "./LeaveStatusChip";
// import { LeaveTableEmptyState } from "./LeaveTableEmptyState";
// import { formatDateRange } from "../utils/leave.utils";
// import type { LeaveHistoryResponse } from "../types/leave.types";

// interface UniversalLeaveTableProps {
//   data: LeaveHistoryResponse[];
// }

// const COLUMNS = [
//   { key: "leaveType", label: "Leave Type", width: "25%" },
//   { key: "dates", label: "Dates", width: "30%" },
//   { key: "duration", label: "Duration", width: "20%" },
//   { key: "status", label: "Status", width: "25%" },
// ] as const;


// export const UniversalLeaveTable = ({ data }: UniversalLeaveTableProps) => {
//   if (!data?.length) return <LeaveTableEmptyState />;

//   return (
//     <TableContainer sx={{ maxHeight: 400 }}>
//       <Table sx={{ minWidth: 50, tableLayout: "fixed" }}>
//         {/* ── Head ──────────────────────────────────────────────── */}
//         <TableHead sx={{ position: "sticky", top: 0, zIndex: 1 }}>
//           <TableRow
//             sx={{
//               bgcolor: "grey.50",
//               "& .MuiTableCell-root": {
//                 borderBottom: "2px solid",
//                 borderColor: "divider",
//                 py: 1.25,
//               },
//             }}
//           >
//             {COLUMNS.map((col) => (
//               <TableCell
//                 key={col.key}
//                 width={col.width}
//                 sx={{
//                   fontSize: "0.7rem",
//                   fontWeight: 600,
//                   letterSpacing: "0.07em",
//                   textTransform: "uppercase",
//                   color: "text.secondary",
//                 }}
//               >
//                 {col.label}
//               </TableCell>
//             ))}
//           </TableRow>
//         </TableHead>

//         {/* ── Body ──────────────────────────────────────────────── */}
//         <TableBody>
//           {data.map((leave, index) => (
//             <TableRow
//               key={leave.leaveId}
//               hover
//               sx={{
//                 bgcolor: index % 2 === 0 ? "transparent" : "grey.50/40",
//                 transition: "background-color 0.15s ease",
//                 "&:hover": { bgcolor: "primary.50" },
//                 "&:last-child td": { borderBottom: 0 },
//                 "& .MuiTableCell-root": { py: 1.75 },
//               }}
//             >
//               {/* Leave Type */}
//               <TableCell>
//                 <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                   <Box
//                     sx={{
//                       width: 6,
//                       height: 6,
//                       borderRadius: "50%",
//                       bgcolor: getTypeColor(leave.leaveType),
//                       flexShrink: 0,
//                     }}
//                   />
//                   <Typography
//                     variant="body2"
//                     fontWeight={500}
//                     sx={{ textTransform: "capitalize" }}
//                   >
//                     {leave.leaveType.toLowerCase()}
//                   </Typography>
//                 </Box>
//               </TableCell>

//               {/* Dates */}
//               <TableCell>
//                 <Typography variant="body2" fontWeight={500}>
//                   {formatDateRange(leave.leaveStartDate, leave.leaveEndDate)}
//                 </Typography>
//               </TableCell>

//               {/* Duration */}
//               <TableCell>
//                 <Typography variant="body2" fontWeight={500} lineHeight={1.3}>
//                   {leave.ageDays} {leave.ageDays === 1 ? "Day" : "Days"}
//                 </Typography>
//                 <Chip
//                   label={leave.leaveDuration}
//                   size="small"
//                   variant="outlined"
//                   sx={{
//                     mt: 0.5,
//                     height: 18,
//                     fontSize: "0.65rem",
//                     borderRadius: 1,
//                     color: "text.secondary",
//                     borderColor: "divider",
//                     "& .MuiChip-label": { px: 0.75 },
//                   }}
//                 />
//               </TableCell>

//               {/* Status */}
//               <TableCell>
//                 <LeaveStatusChip status={leave.leaveStatus} />
//               </TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </TableContainer>
//   );
// };

// // ── Helpers ────────────────────────────────────────────────────────────────

// /**
//  * Maps leave type to a subtle color dot for quick scanning.
//  * Extend as more leave types are added.
//  */
// const TYPE_COLOR_MAP: Record<string, string> = {
//   "sick leave": "#EF4444",
//   "casual leave": "#3B82F6",
//   "earned leave": "#10B981",
//   "maternity leave": "#EC4899",
//   "paternity leave": "#8B5CF6",
// };

// const getTypeColor = (leaveType: string): string =>
//   TYPE_COLOR_MAP[leaveType.toLowerCase()] ?? "#9CA3AF";

// export default UniversalLeaveTable;
