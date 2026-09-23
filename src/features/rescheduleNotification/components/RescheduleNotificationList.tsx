import { Box, Stack, TablePagination, useMediaQuery, useTheme } from "@mui/material";
import type { RescheduleNotification } from "../types/rescheduleNotification.types";
import type { Colors } from "../types/colorTypes";
import { RescheduleNotificationTable } from "./RescheduleNotificationTable";
import { RescheduleNotificationCard } from "./RescheduleNotificationCard";
import { RescheduleNotificationEmptyState } from "./RescheduleNotificationEmptyState";
import { PAGE_SIZE_OPTIONS } from "../constants/rescheduleNotification.constants";

interface RescheduleNotificationListProps {
  notifications: readonly RescheduleNotification[];
  totalCount: number;
  page: number;
  pageSize: number;
  colors: Colors;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onMarkAsRead: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function RescheduleNotificationList({
  notifications,
  totalCount,
  page,
  pageSize,
  colors,
  onPageChange,
  onPageSizeChange,
  hasActiveFilters,
  onResetFilters,
  onMarkAsRead,
  onApprove,
  onReject,
}: RescheduleNotificationListProps) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));

  if (notifications.length === 0) {
    return (
      <RescheduleNotificationEmptyState
        hasActiveFilters={hasActiveFilters}
        onResetFilters={onResetFilters}
        colors={colors}
      />
    );
  }

  return (
    <Stack spacing={1.25}>
      {isCompact ? (
        <Stack spacing={1}>
          {notifications.map((notification) => (
            <RescheduleNotificationCard
              key={notification.id}
              notification={notification}
              colors={colors}
              onMarkAsRead={onMarkAsRead}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </Stack>
      ) : (
        <Box sx={{ overflowX: "auto", borderRadius: "12px", border: `1.5px solid ${colors.border}` }}>
          <RescheduleNotificationTable
            notifications={notifications}
            colors={colors}
            onMarkAsRead={onMarkAsRead}
            onApprove={onApprove}
            onReject={onReject}
          />
        </Box>
      )}

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(_, newPage) => onPageChange(newPage)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => onPageSizeChange(Number(e.target.value))}
        rowsPerPageOptions={PAGE_SIZE_OPTIONS}
        sx={{
          borderTop: `1px solid ${colors.border}`,
          color: colors.textPrimary,
          "& .MuiTablePagination-toolbar": { minHeight: 42, px: 0 },
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
            fontSize: 11,
            color: colors.textSecondary,
            fontWeight: 600,
          },
          "& .MuiSvgIcon-root": { color: colors.textSecondary },
        }}
      />
    </Stack>
  );
}
