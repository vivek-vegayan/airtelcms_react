import React, { useState, useEffect } from "react";
import {
  Box,
  Badge,
  IconButton,
  Typography,
  Chip,
  Divider,
  Collapse,
  Button,
  ClickAwayListener,
  Tooltip,
  Fade,
  CircularProgress,
  useTheme,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";

import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PersonIcon from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  useGetUnreadNotificationCountQuery,
  useGetUnreadNotificationsQuery,
  useAcknowledgeNotificationMutation,
  useManagerShiftSwapActionMutation,
  useEmployeeShiftSwapActionMutation,
  useShiftChangeNotificationActionMutation,
  useRosterLeaveActionMutation,
  useCabCrqNotificationActionMutation,
  useCabRescheduleNotificationActionMutation,
  type NotificationItem,
} from "../../features/inbox/api/inboxApiSlice";
import { toast } from "react-toastify";
import { authStorage } from "../../app/store/auth.storage";
import {
  getRoleTier,
  getSubModuleActionMeta,
} from "../../features/inbox/config/notificationActionConfig";
import { RejectRemarksDialog } from "../../features/inbox/components/RejectRemarksDialog";
import { coerceBoolean } from "../../features/inbox/utils/notificationType";


// ─── Constants ────────────────────────────────────────────────────────────────

// Maps API `module` field → visual style
const MODULE_STYLE: Record<
  string,
  { bg: string; color: string; border: string; avatarBg: string }
> = {
  USER: {
    bg: "#eef2ff",
    color: "#6366f1",
    border: "#c7d2fe",
    avatarBg: "#e0e7ff",
  },
  CRQ: {
    bg: "#f5f3ff",
    color: "#7c3aed",
    border: "#ddd6fe",
    avatarBg: "#ede9fe",
  },
  INC: {
    bg: "#fef2f2",
    color: "#ef4444",
    border: "#fecaca",
    avatarBg: "#fee2e2",
  },
  PRB: {
    bg: "#fffbeb",
    color: "#f59e0b",
    border: "#fde68a",
    avatarBg: "#fef3c7",
  },
  DEFAULT: {
    bg: "#f1f5f9",
    color: "#64748b",
    border: "#e2e8f0",
    avatarBg: "#f8fafc",
  },
};

function getModuleStyle(module: string) {
  return MODULE_STYLE[module] ?? MODULE_STYLE.DEFAULT;
}

// Module → icon
function ModuleIcon({ module, size = 17 }: { module: string; size?: number }) {
  const sx = { fontSize: size, color: getModuleStyle(module).color };
  if (module === "USER") return <PersonIcon sx={sx} />;
  if (module === "CRQ") return <SwapHorizIcon sx={sx} />;
  if (module === "INC") return <WarningAmberIcon sx={sx} />;
  return <SettingsIcon sx={sx} />;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d === 1) return "Yesterday";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}

function parsePayloadBody(raw: string): string {
  try {
    return JSON.parse(raw)?.body ?? "";
  } catch {
    return "";
  }
}

function parsePayloadModule(raw: string): string {
  try {
    return JSON.parse(raw)?.module_code ?? "";
  } catch {
    return "";
  }
}

// ─── Tab type ─────────────────────────────────────────────────────────────────

type TabType = "All" | "Unread" | "Action";

// ─── Props ────────────────────────────────────────────────────────────────────

interface NotificationBellProps {
  onViewAll?: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function NotificationBell({ onViewAll }: NotificationBellProps) {
  const theme = useTheme();
  // Brand accent — was a hardcoded indigo; now follows the header's
  // brand-color picker (theme.palette.primary.main) like the rest of the app.
  const ACCENT = theme.palette.primary.main;
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabType>("All");
  const [localReadIds, setLocalReadIds] = useState<Record<number, boolean>>({});
  const [dismissed, setDismissed] = useState<Record<number, boolean>>({});
  const [expanded, setExpanded] = useState<number | null>(null);
  const [pulse, setPulse] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<NotificationItem | null>(null);
  const currentUserRole = authStorage.getUser()?.roleCode ?? "TEAM_MEMBER";

  // ── API calls ──────────────────────────────────────────────────────────────

  // 1) Live unread COUNT for badge — polls every 60s while the tab is
  // focused (skipped in background tabs), and refetches immediately on
  // focus/reconnect. Mutations below also invalidate NotificationCount,
  // so acknowledging/approving/rejecting updates the badge right away
  // instead of waiting for the next poll.
  const { data: countData } = useGetUnreadNotificationCountQuery(undefined, {
    pollingInterval: 60000,
    skipPollingIfUnfocused: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // 2) Full notification list — fetched when panel opens
  const {
    data: apiNotifications = [],
    isLoading,
    isError,
    refetch,
  } = useGetUnreadNotificationsQuery(
    { readFlag: 0 },
    { skip: !open, refetchOnMountOrArgChange: true },
  );

  // 3) Mutations
  const [acknowledgeNotification] = useAcknowledgeNotificationMutation();
  const [managerShiftSwapAction, { isLoading: isManagerLoading }] = useManagerShiftSwapActionMutation();
  const [employeeShiftSwapAction, { isLoading: isEmpLoading }] = useEmployeeShiftSwapActionMutation();
  const [shiftChangeAction, { isLoading: isShiftChangeLoading }] = useShiftChangeNotificationActionMutation();
  const [leaveAction, { isLoading: isLeaveLoading }] = useRosterLeaveActionMutation();
  const [cabCrqAction, { isLoading: isCabLoading }] = useCabCrqNotificationActionMutation();
  const [cabRescheduleAction, { isLoading: isCabRescheduleLoading }] = useCabRescheduleNotificationActionMutation();
  const isActionLoading =
    isManagerLoading || isEmpLoading || isShiftChangeLoading || isLeaveLoading || isCabLoading || isCabRescheduleLoading;

  // Bell count: prefer API count, fall back to list length
  const badgeCount = countData?.notificationCount ?? apiNotifications.length;

  // Pulse bell on mount
  useEffect(() => {
    const t1 = setTimeout(() => setPulse(true), 600);
    const t2 = setTimeout(() => setPulse(false), 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // ── Derived data ───────────────────────────────────────────────────────────

  // Filter out locally dismissed items
  const active = apiNotifications.filter((n) => !dismissed[n.notificationId]);

  // Unread = not in localReadIds (API items all have readFlag "0" already)
  const unreadCount = active.filter(
    (n) => !localReadIds[n.notificationId],
  ).length;

  // Tab filter
  const filtered = active.filter((n) => {
    if (tab === "Unread") return !localReadIds[n.notificationId];
    if (tab === "Action") return coerceBoolean(n.isActionable);
    return true;
  });

  // Group into today / earlier
  const grouped = filtered.reduce<
    Record<"today" | "earlier", NotificationItem[]>
  >(
    (acc, n) => {
      const key = isToday(n.createdAt) ? "today" : "earlier";
      acc[key].push(n);
      return acc;
    },
    { today: [], earlier: [] },
  );

  // ── Handlers ───────────────────────────────────────────────────────────────

  const markRead = (id: number) => {
    setLocalReadIds((p) => ({ ...p, [id]: true }));
    acknowledgeNotification({ notificationId: id }).catch(() => {});
  };

  const dismiss = (id: number) => {
    setDismissed((p) => ({ ...p, [id]: true }));
    markRead(id);
  };

  const markAll = () => {
    const patch: Record<number, boolean> = {};
    active.forEach((n) => {
      patch[n.notificationId] = true;
      acknowledgeNotification({ notificationId: n.notificationId }).catch(
        () => {},
      );
    });
    setLocalReadIds((p) => ({ ...p, ...patch }));
  };

  const toggleExpand = (id: number) =>
    setExpanded((p) => (p === id ? null : id));

  // Dispatches by the notification's actual subModule + the caller's role
  // tier - the same registry DetailView/useNotificationAction use, so this
  // dropdown and the full inbox page never disagree on routing again.
  const handleActionableApprove = async (n: NotificationItem) => {
    const meta = getSubModuleActionMeta(n.subModule);
    if (!meta) {
      toast.error("This type of notification cannot be processed.");
      return;
    }
    try {
      if (meta.subModule === "SHIFT_SWAP") {
        const tier = getRoleTier(currentUserRole);
        if (tier === "MANAGER") {
          await managerShiftSwapAction({ notificationId: n.notificationId, status: "APPROVED" }).unwrap();
        } else {
          await employeeShiftSwapAction({ notificationId: n.notificationId, status: "APPROVED" }).unwrap();
        }
      } else if (meta.subModule === "SHIFT_CHANGE") {
        await shiftChangeAction({ notificationId: n.notificationId, status: "APPROVED" }).unwrap();
      } else if (meta.subModule === "LEAVE") {
        await leaveAction({ notificationId: n.notificationId, status: "APPROVED" }).unwrap();
      } else if (meta.subModule === "CAB_APPROVER") {
        await cabCrqAction({ notificationId: n.notificationId, status: "APPROVED" }).unwrap();
      } else if (meta.subModule === "RESCHEDULE") {
        await cabRescheduleAction({ notificationId: n.notificationId, status: "APPROVED" }).unwrap();
      }
      toast.success("Approved successfully.");
      setExpanded(null);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to approve request");
    }
  };

  const handleActionableReject = (n: NotificationItem) => {
    setRejectTarget(n);
  };

  const confirmReject = async (remark: string, reasonText?: string) => {
    if (!rejectTarget) return;
    const meta = getSubModuleActionMeta(rejectTarget.subModule);
    if (!meta) return;
    try {
      if (meta.subModule === "SHIFT_SWAP") {
        const tier = getRoleTier(currentUserRole);
        if (tier === "MANAGER") {
          await managerShiftSwapAction({ notificationId: rejectTarget.notificationId, status: "REJECTED", reason: remark }).unwrap();
        } else {
          await employeeShiftSwapAction({ notificationId: rejectTarget.notificationId, status: "REJECTED", reason: remark }).unwrap();
        }
      } else if (meta.subModule === "SHIFT_CHANGE") {
        await shiftChangeAction({ notificationId: rejectTarget.notificationId, status: "REJECTED", rejectReason: remark }).unwrap();
      } else if (meta.subModule === "LEAVE") {
        await leaveAction({ notificationId: rejectTarget.notificationId, status: "REJECTED", rejectReason: remark }).unwrap();
      } else if (meta.subModule === "CAB_APPROVER") {
        await cabCrqAction({ notificationId: rejectTarget.notificationId, status: "REJECTED", reason: reasonText, comment: remark }).unwrap();
      } else if (meta.subModule === "RESCHEDULE") {
        await cabRescheduleAction({ notificationId: rejectTarget.notificationId, status: "REJECTED", reason: reasonText, comment: remark }).unwrap();
      }
      toast.success("Rejected successfully.");
      setExpanded(null);
      setRejectTarget(null);
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || "Failed to reject request");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: "relative", display: "flex", alignItems: "center" }}>
        {/* ── Bell Button ──────────────────────────────────────────────────── */}
        <Tooltip title="Notifications" placement="bottom" arrow>
          <Box
            onClick={() => setOpen((p) => !p)}
            sx={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: "12px",
              cursor: "pointer",
              background: open
                ? "rgba(255,255,255,0.20)"
                : "rgba(255,255,255,0.08)",
              border: open
                ? "1.5px solid rgba(255,255,255,0.35)"
                : "1.5px solid rgba(255,255,255,0.14)",
              transition: "all 0.22s cubic-bezier(.4,0,.2,1)",
              "&:hover": {
                background: "rgba(255,255,255,0.18)",
                border: "1.5px solid rgba(255,255,255,0.30)",
                transform: "translateY(-1px)",
              },
              "&:active": { transform: "scale(0.96)" },
            }}
          >
            {open && (
              <Box
                sx={{
                  position: "absolute",
                  inset: -3,
                  borderRadius: "14px",
                  border: `1.5px solid ${ACCENT}55`,
                  pointerEvents: "none",
                }}
              />
            )}

            <NotificationsIcon
              sx={{
                fontSize: 22,
                color: badgeCount > 0 ? "#fff" : "rgba(255,255,255,0.75)",
                transition: "all 0.2s",
                animation: pulse ? "bellRing 0.6s ease" : "none",
                "@keyframes bellRing": {
                  "0%,100%": { transform: "rotate(0deg)" },
                  "15%": { transform: "rotate(14deg)" },
                  "30%": { transform: "rotate(-12deg)" },
                  "45%": { transform: "rotate(8deg)" },
                  "60%": { transform: "rotate(-5deg)" },
                  "75%": { transform: "rotate(3deg)" },
                },
              }}
            />

            {/* Live count badge from API */}
            {badgeCount > 0 && (
              <Box
                sx={{
                  position: "absolute",
                  top: -5,
                  right: -5,
                  minWidth: 20,
                  height: 20,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  border: "2.5px solid #141b2e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: "4px",
                  boxShadow: "0 2px 8px rgba(239,68,68,0.6)",
                  animation: "popIn 0.3s cubic-bezier(.4,0,.2,1)",
                  "@keyframes popIn": {
                    from: { transform: "scale(0)", opacity: 0 },
                    to: { transform: "scale(1)", opacity: 1 },
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: 10,
                    fontWeight: 900,
                    color: "#fff",
                    lineHeight: 1,
                    letterSpacing: "-0.3px",
                  }}
                >
                  {badgeCount > 99 ? "99+" : badgeCount}
                </Typography>
              </Box>
            )}
          </Box>
        </Tooltip>

        {/* ── Dropdown ─────────────────────────────────────────────────────── */}
        <Fade in={open} timeout={180}>
          <Box
            sx={{
              position: "absolute",
              top: "calc(100% + 14px)",
              right: -4,
              width: 360,
              maxWidth: "calc(100vw - 32px)",
              background: "#fff",
              borderRadius: "18px",
              boxShadow:
                "0 24px 60px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.08)",
              border: "1.5px solid #e8edf6",
              overflow: "hidden",
              zIndex: 1400,
              display: open ? "block" : "none",
              "&::before": {
                content: '""',
                position: "absolute",
                top: -8,
                right: 16,
                width: 16,
                height: 16,
                background: "#fff",
                border: "1.5px solid #e8edf6",
                borderBottom: "none",
                borderRight: "none",
                transform: "rotate(45deg)",
                borderRadius: "2px",
              },
            }}
          >
            {/* ── Header ── */}
            <Box
              sx={{
                px: "16px",
                pt: "16px",
                pb: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "linear-gradient(135deg, #fafbff 0%, #f0f3ff 100%)",
                borderBottom: "1.5px solid #eef1f8",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: "9px",
                    background: ACCENT,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: `0 4px 12px ${ACCENT}55`,
                  }}
                >
                  <NotificationsIcon sx={{ fontSize: 16, color: "#fff" }} />
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: "#1e1b4b",
                      lineHeight: 1.2,
                    }}
                  >
                    Notifications
                  </Typography>
                  <Typography
                    sx={{ fontSize: 10, color: "#94a3b8", fontWeight: 500 }}
                  >
                    {isLoading
                      ? "Loading…"
                      : unreadCount > 0
                        ? `${unreadCount} new update${unreadCount > 1 ? "s" : ""}`
                        : "You're all caught up"}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {/* Refresh button */}
                <Tooltip title="Refresh">
                  <Box
                    onClick={() => refetch()}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      borderRadius: "8px",
                      background: "#f1f5f9",
                      cursor: "pointer",
                      "&:hover": { background: "#e0e7ff" },
                    }}
                  >
                    <RefreshIcon sx={{ fontSize: 14, color: "#94a3b8" }} />
                  </Box>
                </Tooltip>

                {/* Mark all read */}
                <Tooltip title="Mark all as read">
                  <Box
                    onClick={markAll}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      px: "10px",
                      py: "5px",
                      borderRadius: "8px",
                      background: unreadCount > 0 ? "#eef2ff" : "#f1f5f9",
                      cursor: "pointer",
                      transition: "all .15s",
                      "&:hover": { background: "#e0e7ff" },
                    }}
                  >
                    <DoneAllIcon
                      sx={{
                        fontSize: 13,
                        color: unreadCount > 0 ? ACCENT : "#94a3b8",
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: unreadCount > 0 ? ACCENT : "#94a3b8",
                      }}
                    >
                      All read
                    </Typography>
                  </Box>
                </Tooltip>
              </Box>
            </Box>

            {/* ── Tabs ── */}
            <Box
              sx={{
                display: "flex",
                gap: "2px",
                px: "10px",
                pt: "8px",
                pb: "0",
                borderBottom: "1.5px solid #f1f5f9",
              }}
            >
              {(["All", "Unread", "Action"] as TabType[]).map((t) => {
                const count =
                  t === "Unread"
                    ? active.filter((n) => !localReadIds[n.notificationId])
                        .length
                    : t === "Action"
                      ? active.filter((n) => n.isActionable).length
                      : active.length;
                return (
                  <Box
                    key={t}
                    onClick={() => setTab(t)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      px: "12px",
                      py: "7px",
                      cursor: "pointer",
                      borderBottom:
                        tab === t
                          ? `2.5px solid ${ACCENT}`
                          : "2.5px solid transparent",
                      mb: "-1.5px",
                      transition: "all .15s",
                      "&:hover .tab-label": { color: ACCENT },
                    }}
                  >
                    <Typography
                      className="tab-label"
                      sx={{
                        fontSize: 11,
                        fontWeight: tab === t ? 800 : 500,
                        color: tab === t ? ACCENT : "#94a3b8",
                        transition: "color .15s",
                      }}
                    >
                      {t}
                    </Typography>
                    {count > 0 && (
                      <Box
                        sx={{
                          minWidth: 16,
                          height: 16,
                          borderRadius: "8px",
                          px: "4px",
                          background: tab === t ? ACCENT : "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: 9,
                            fontWeight: 800,
                            color: tab === t ? "#fff" : "#94a3b8",
                          }}
                        >
                          {count}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>

            {/* ── List ── */}
            <Box
              sx={{
                maxHeight: 360,
                overflowY: "auto",
                "&::-webkit-scrollbar": { width: "3px" },
                "&::-webkit-scrollbar-thumb": {
                  background: "#e2e8f0",
                  borderRadius: "4px",
                },
              }}
            >
              {/* Loading state */}
              {isLoading && (
                <Box
                  sx={{ display: "flex", justifyContent: "center", py: "36px" }}
                >
                  <CircularProgress size={24} sx={{ color: ACCENT }} />
                </Box>
              )}

              {/* Error state */}
              {isError && !isLoading && (
                <Box sx={{ textAlign: "center", py: "32px" }}>
                  <WarningAmberIcon
                    sx={{ fontSize: 28, color: "#f59e0b", mb: 1 }}
                  />
                  <Typography
                    sx={{ color: "#1e1b4b", fontSize: 12, fontWeight: 700 }}
                  >
                    Failed to load notifications
                  </Typography>
                  <Button
                    size="small"
                    onClick={() => refetch()}
                    sx={{
                      mt: 1,
                      fontSize: 10,
                      color: ACCENT,
                      textTransform: "none",
                      fontWeight: 700,
                    }}
                  >
                    Retry
                  </Button>
                </Box>
              )}

              {/* Notification groups */}
              {!isLoading &&
                !isError &&
                (["today", "earlier"] as const).map((group) => {
                  const items = grouped[group];
                  if (!items?.length) return null;
                  return (
                    <Box key={group}>
                      <Typography
                        sx={{
                          fontSize: 9,
                          fontWeight: 800,
                          color: "#94a3b8",
                          letterSpacing: "1px",
                          textTransform: "uppercase",
                          px: "16px",
                          pt: "10px",
                          pb: "4px",
                        }}
                      >
                        {group === "today" ? "Today" : "Earlier"}
                      </Typography>

                      {items.map((n) => {
                        const isRead = !!localReadIds[n.notificationId];
                        const isExpanded = expanded === n.notificationId;
                        const moduleCode = parsePayloadModule(n.payload);
                        const s = getModuleStyle(moduleCode);
                        const bodyText = parsePayloadBody(n.payload);
                        const isActionable = coerceBoolean(n.isActionable);
                        const actionMeta = getSubModuleActionMeta(n.subModule);

                        return (
                          <Box key={n.notificationId}>
                            <Box
                              onClick={() => {
                                toggleExpand(n.notificationId);
                                markRead(n.notificationId);
                              }}
                              sx={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: "11px",
                                px: "14px",
                                py: "10px",
                                cursor: "pointer",
                                background: isExpanded
                                  ? "#f5f7ff"
                                  : isRead
                                    ? "transparent"
                                    : "#fafbff",
                                borderBottom: "1px solid #f8fafc",
                                position: "relative",
                                transition: "background .15s",
                                "&:hover": { background: "#f5f7ff" },
                              }}
                            >
                              {/* Unread left bar */}
                              {!isRead && (
                                <Box
                                  sx={{
                                    position: "absolute",
                                    left: 0,
                                    top: "20%",
                                    bottom: "20%",
                                    width: 3,
                                    borderRadius: "0 3px 3px 0",
                                    background: ACCENT,
                                  }}
                                />
                              )}

                              {/* Module avatar */}
                              <Box
                                sx={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: "11px",
                                  flexShrink: 0,
                                  background: s.avatarBg,
                                  border: `1.5px solid ${s.border}`,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  position: "relative",
                                }}
                              >
                                <ModuleIcon module={moduleCode} size={17} />
                                {!isRead && (
                                  <Box
                                    sx={{
                                      position: "absolute",
                                      top: -3,
                                      right: -3,
                                      width: 9,
                                      height: 9,
                                      borderRadius: "50%",
                                      background: ACCENT,
                                      border: "2px solid #fff",
                                    }}
                                  />
                                )}
                              </Box>

                              {/* Text block */}
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                {/* Subject line */}
                                <Typography
                                  sx={{
                                    fontSize: 12,
                                    fontWeight: isRead ? 600 : 800,
                                    color: "#1e1b4b",
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {n.subject ?? "Notification"}
                                </Typography>

                                {/* Body preview */}
                                {bodyText && (
                                  <Typography
                                    sx={{
                                      fontSize: 10.5,
                                      color: "#64748b",
                                      mt: "2px",
                                      lineHeight: 1.4,
                                      whiteSpace: isExpanded
                                        ? "pre-line"
                                        : "nowrap",
                                      overflow: "hidden",
                                      textOverflow: isExpanded
                                        ? "unset"
                                        : "ellipsis",
                                    }}
                                  >
                                    {bodyText}
                                  </Typography>
                                )}

                                {/* Meta row: module chip + time */}
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    mt: "5px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {/* Module badge */}
                                  <Box
                                    sx={{
                                      px: "6px",
                                      py: "1px",
                                      borderRadius: "5px",
                                      background: s.bg,
                                      border: `1px solid ${s.border}`,
                                    }}
                                  >
                                    <Typography
                                      sx={{
                                        fontSize: 9,
                                        fontWeight: 700,
                                        color: s.color,
                                        letterSpacing: "0.4px",
                                      }}
                                    >
                                      {n.module}
                                      {n.subModule
                                        ? ` · ${n.subModule.replace(/_/g, " ")}`
                                        : ""}
                                    </Typography>
                                  </Box>

                                  {/* Pending badge */}
                                  {n.requestStatus === "PENDING" &&
                                    isActionable && (
                                      <Box
                                        sx={{
                                          px: "6px",
                                          py: "1px",
                                          borderRadius: "5px",
                                          background: "#fffbeb",
                                          border: "1px solid #fde68a",
                                        }}
                                      >
                                        <Typography
                                          sx={{
                                            fontSize: 9,
                                            fontWeight: 700,
                                            color: "#d97706",
                                          }}
                                        >
                                          Pending Action
                                        </Typography>
                                      </Box>
                                    )}

                                  <FiberManualRecordIcon
                                    sx={{ fontSize: 5, color: "#cbd5e1" }}
                                  />
                                  <Typography
                                    sx={{
                                      fontSize: 9.5,
                                      color: "#94a3b8",
                                      fontWeight: 600,
                                    }}
                                  >
                                    {timeAgo(n.createdAt)}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Right-side dismiss chip */}
                              <Chip
                                label={isActionable ? "Action" : "Dismiss"}
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismiss(n.notificationId);
                                }}
                                sx={{
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                  background: s.bg,
                                  color: s.color,
                                  border: `1.5px solid ${s.border}`,
                                  borderRadius: "8px",
                                  flexShrink: 0,
                                  alignSelf: "center",
                                  height: "auto",
                                  "& .MuiChip-label": { px: "9px", py: "3px" },
                                  "&:hover": {
                                    opacity: 0.8,
                                    transform: "scale(0.96)",
                                  },
                                  transition: "all .15s",
                                }}
                              />
                            </Box>

                            {/* ── Expanded panel ── */}
                            <Collapse in={isExpanded}>
                              <Box
                                sx={{
                                  mx: "12px",
                                  mb: "8px",
                                  p: "10px 12px",
                                  borderRadius: "10px",
                                  background: s.bg,
                                  border: `1px solid ${s.border}`,
                                }}
                              >
                                {/* Full body text */}
                                <Typography
                                  sx={{
                                    fontSize: 10.5,
                                    color: "#475569",
                                    lineHeight: 1.7,
                                    whiteSpace: "pre-line",
                                  }}
                                >
                                  {bodyText || n.subject}
                                </Typography>

                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: "6px",
                                    mt: "10px",
                                    flexWrap: "wrap",
                                  }}
                                >
                                  {/* Approve / Reject for actionable - only when we know how to
                                      dispatch this subModule, matching DetailView's fallback */}
                                  {isActionable &&
                                    n.requestStatus === "PENDING" &&
                                    actionMeta && (
                                      <>
                                        <Button
                                          size="small"
                                          variant="contained"
                                          disabled={isActionLoading}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleActionableApprove(n);
                                          }}
                                          sx={{
                                            fontSize: 9.5,
                                            fontWeight: 700,
                                            background: "#10b981",
                                            borderRadius: "7px",
                                            py: "4px",
                                            px: "14px",
                                            textTransform: "none",
                                            minWidth: 0,
                                            boxShadow: "none",
                                            "&:hover": {
                                              background: "#059669",
                                            },
                                          }}
                                        >
                                          Approve
                                        </Button>
                                        <Button
                                          size="small"
                                          variant="contained"
                                          disabled={isActionLoading}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleActionableReject(n);
                                          }}
                                          sx={{
                                            fontSize: 9.5,
                                            fontWeight: 700,
                                            background: "#ef4444",
                                            borderRadius: "7px",
                                            py: "4px",
                                            px: "14px",
                                            textTransform: "none",
                                            minWidth: 0,
                                            boxShadow: "none",
                                            "&:hover": {
                                              background: "#dc2626",
                                            },
                                          }}
                                        >
                                          Reject
                                        </Button>
                                      </>
                                    )}

                                  {/* Dismiss */}
                                  <Button
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      dismiss(n.notificationId);
                                    }}
                                    sx={{
                                      fontSize: 9.5,
                                      fontWeight: 700,
                                      color: s.color,
                                      background: "#fff",
                                      border: `1px solid ${s.border}`,
                                      borderRadius: "7px",
                                      py: "4px",
                                      px: "14px",
                                      textTransform: "none",
                                      minWidth: 0,
                                    }}
                                  >
                                    Dismiss
                                  </Button>

                                  {/* Collapse */}
                                  <Button
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleExpand(n.notificationId);
                                    }}
                                    sx={{
                                      fontSize: 9.5,
                                      fontWeight: 600,
                                      color: "#94a3b8",
                                      borderRadius: "7px",
                                      py: "4px",
                                      px: "10px",
                                      textTransform: "none",
                                      minWidth: 0,
                                    }}
                                  >
                                    Close
                                  </Button>
                                </Box>
                              </Box>
                            </Collapse>
                          </Box>
                        );
                      })}
                    </Box>
                  );
                })}

              {/* Empty state */}
              {!isLoading && !isError && filtered.length === 0 && (
                <Box sx={{ textAlign: "center", py: "36px" }}>
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      borderRadius: "16px",
                      background: "#eef2ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mx: "auto",
                      mb: "10px",
                    }}
                  >
                    <CheckCircleOutlineIcon
                      sx={{ fontSize: 28, color: "#a5b4fc" }}
                    />
                  </Box>
                  <Typography
                    sx={{ color: "#1e1b4b", fontSize: 12, fontWeight: 700 }}
                  >
                    {tab === "Unread"
                      ? "No unread notifications"
                      : tab === "Action"
                        ? "Nothing needs action"
                        : "All caught up!"}
                  </Typography>
                  <Typography
                    sx={{ color: "#94a3b8", fontSize: 10.5, mt: "3px" }}
                  >
                    Check back later for updates
                  </Typography>
                </Box>
              )}
            </Box>

            {/* ── Footer ── */}
            <Box
              sx={{
                borderTop: "1.5px solid #f1f5f9",
                background: "#fafbff",
                px: "14px",
                py: "10px",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <Button
                size="small"
                endIcon={<OpenInFullIcon sx={{ fontSize: 12 }} />}
                onClick={() => {
                  setOpen(false);
                  onViewAll?.();
                }}
                sx={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: ACCENT,
                  background: "#eef2ff",
                  borderRadius: "9px",
                  textTransform: "none",
                  px: "20px",
                  py: "6px",
                  width: "100%",
                  "&:hover": { background: "#e0e7ff" },
                }}
              >
                View all notifications
              </Button>
            </Box>
          </Box>
        </Fade>
      </Box>
    </ClickAwayListener>

      {rejectTarget && (
        <RejectRemarksDialog
          open={!!rejectTarget}
          title={`Reject "${rejectTarget.subject ?? "notification"}"`}
          rejectInput={getSubModuleActionMeta(rejectTarget.subModule)?.rejectInput ?? "TEXT"}
          isLoading={isActionLoading}
          onCancel={() => setRejectTarget(null)}
          onConfirm={confirmReject}
        />
      )}
    </>
  );
}
