import { useState } from "react";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import EventRepeatIcon from "@mui/icons-material/EventRepeat";
import { toast } from "react-toastify";
import { useTabColorTokens } from "../../../style/theme";
import { useRescheduleNotifications } from "../hooks/useRescheduleNotifications";
import { RescheduleNotificationSummary } from "../components/RescheduleNotificationSummary";
import { RescheduleNotificationToolbar } from "../components/RescheduleNotificationToolbar";
import { RescheduleNotificationList } from "../components/RescheduleNotificationList";
import { ApproveRescheduleDialog } from "../components/ApproveRescheduleDialog";
import { RejectRescheduleDialog } from "../components/RejectRescheduleDialog";
import type { RescheduleNotification } from "../types/rescheduleNotification.types";
import { getSurfaceSx } from "../constants/rescheduleNotification.styles";

export function RescheduleNotificationPage() {
  const theme = useTheme();
  const colors = useTabColorTokens(theme);

  const {
    notifications,
    totalCount,
    summaryCounts,
    search,
    setSearch,
    readFilter,
    setReadFilter,
    actionFilter,
    setActionFilter,
    sort,
    setSort,
    page,
    setPage,
    pageSize,
    setPageSize,
    markAsRead,
    approve,
    reject,
    resetFilters,
    filterByUnread,
    filterByAction,
    filterAll,
  } = useRescheduleNotifications();

  const [approveTarget, setApproveTarget] = useState<RescheduleNotification | null>(null);
  const [rejectTarget, setRejectTarget] = useState<RescheduleNotification | null>(null);

  const hasActiveFilters =
    search.trim().length > 0 || readFilter !== "ALL" || actionFilter !== "ALL";

  const handleApproveConfirm = async (id: string) => {
    try {
      await approve(id);
      setApproveTarget(null);
      toast.success("Reschedule request approved successfully");
    } catch (error) {
      const message =
        (error as { data?: { message?: string } })?.data?.message ??
        "Failed to approve the reschedule request.";
      toast.error(message);
    }
  };

  const handleRejectConfirm = (id: string, reason: string) => {
    reject(id, reason);
    setRejectTarget(null);
    toast.success("Reschedule request rejected successfully");
  };

  return (
    <Box
      sx={{
        p: { xs: "12px", md: "15px" },
        ...getSurfaceSx(colors),
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        minWidth: 0,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Stack direction="row" spacing={"12px"} alignItems="center">
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "10px",
              background: `linear-gradient(135deg,${colors.accent},${colors.accentLight})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 12px ${colors.accentBorder}`,
              flexShrink: 0,
            }}
          >
            <EventRepeatIcon sx={{ fontSize: 17, color: "#fff" }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 800, color: colors.textPrimary }}>
              Reschedule Notifications
            </Typography>
            <Typography sx={{ fontSize: 10, color: colors.textSecondary, mt: "1px", fontWeight: 500 }}>
              Review and act on CRQ execution reschedule requests
            </Typography>
          </Box>
        </Stack>
        {summaryCounts.pending > 0 && (
          <Chip
            label={`${summaryCounts.pending} awaiting action`}
            size="small"
            sx={{
              fontSize: 10,
              fontWeight: 800,
              color: colors.warning,
              background: colors.warningDim,
              border: `1.5px solid ${colors.warningBorder}`,
              borderRadius: "20px",
              height: "auto",
              "& .MuiChip-label": { px: "9px", py: "3px" },
            }}
          />
        )}
      </Stack>

      <RescheduleNotificationSummary
        counts={summaryCounts}
        readFilter={readFilter}
        actionFilter={actionFilter}
        colors={colors}
        onSelectAll={filterAll}
        onSelectUnread={filterByUnread}
        onSelectPending={() => filterByAction("PENDING")}
        onSelectApproved={() => filterByAction("APPROVED")}
        onSelectRejected={() => filterByAction("REJECTED")}
      />

      <RescheduleNotificationToolbar
        search={search}
        onSearchChange={setSearch}
        readFilter={readFilter}
        onReadFilterChange={setReadFilter}
        actionFilter={actionFilter}
        onActionFilterChange={setActionFilter}
        sort={sort}
        onSortChange={setSort}
        onReset={resetFilters}
        colors={colors}
      />

      <RescheduleNotificationList
        notifications={notifications}
        totalCount={totalCount}
        page={page}
        pageSize={pageSize}
        colors={colors}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        hasActiveFilters={hasActiveFilters}
        onResetFilters={resetFilters}
        onMarkAsRead={markAsRead}
        onApprove={(id) => {
          const target = notifications.find((n) => n.id === id) ?? null;
          setApproveTarget(target);
        }}
        onReject={(id) => {
          const target = notifications.find((n) => n.id === id) ?? null;
          setRejectTarget(target);
        }}
      />

      <ApproveRescheduleDialog
        notification={approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleApproveConfirm}
      />
      <RejectRescheduleDialog
        notification={rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
      />
    </Box>
  );
}
