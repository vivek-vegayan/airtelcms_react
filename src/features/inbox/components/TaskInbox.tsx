import { useState, useEffect, useMemo } from "react";
import { Box, useTheme, useMediaQuery, Paper, Drawer } from "@mui/material";
import AssignmentLateIcon from "@mui/icons-material/AssignmentLate";
import AllInboxIcon from "@mui/icons-material/AllInbox";
import {
  type NotificationItem,
  type NotificationPayload,
  useGetUnreadNotificationsQuery,
} from "../api/inboxApiSlice";
import { SidebarMenu } from "./SidebarMenu";
import { NotificationList } from "./NotificationList";
import { DetailView } from "./DetailView";
import { getModuleIcon } from "../utils/getModuleIcon";
import { formatModuleName } from "../utils/formatModuleName";
import { isNotificationUnread, coerceBoolean } from "../utils/notificationType";

export interface InboxItem {
  id: string;
  originalData: NotificationItem;
  parsedPayload: Partial<NotificationPayload>;
  displayModule: string;
  shortTitle: string;
  time: string;
  date: string;
  isUnread: boolean;
  isActionable: boolean;
  priorityTag: string;
  status: "Pending" | "Read" | "Completed";
  message: string;
}

export default function DynamicTaskInbox() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [activeMenu, setActiveMenu] = useState<string>("ACTIONABLE");
  const [filterTab, setFilterTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Kept live the same way the bell's badge is: poll while the tab is in the
  // foreground, and refetch the moment it regains focus or the connection comes
  // back. Approving or rejecting also invalidates NotificationList, so an
  // actioned item leaves the list straight away rather than waiting for a tick.
  const {
    data: notifications,
    isLoading,
    isFetching,
  } = useGetUnreadNotificationsQuery(
    { readFlag: 0 },
    {
      pollingInterval: 60000,
      skipPollingIfUnfocused: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      refetchOnMountOrArgChange: true,
    },
  );

  const inboxData: InboxItem[] = useMemo(() => {
    if (!notifications) return [];
    return notifications.map((notification, index) => {
      let parsedPayload: Partial<NotificationPayload> = {};
      try {
        if (notification.payload) {
          parsedPayload = JSON.parse(
            notification.payload,
          ) as NotificationPayload;
        }
      } catch (e) {
        console.error("Failed to parse notification payload", e);
      }
      const createdDate = new Date(notification.createdAt);
      const rawModule =
        parsedPayload.module_code ||
        (notification as any).module ||
        "SYSTEM_ALERTS";
      const isUnread = isNotificationUnread(notification.readFlag);
      const isActionable = coerceBoolean(notification.isActionable);
      return {
        id: `${notification.createdAt}-${index}`,
        originalData: notification,
        parsedPayload,
        displayModule: rawModule.toUpperCase(),
        shortTitle:
          notification.subject ||
          parsedPayload.subject ||
          "System Notification",
        time: createdDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: createdDate.toLocaleDateString(),
        isUnread,
        isActionable,
        priorityTag: isActionable ? "Action Required" : "Update",
        status:
          notification.requestStatus === "PENDING"
            ? "Pending"
            : notification.requestStatus === "COMPLETED"
              ? "Completed"
              : "Read",
        message: parsedPayload.body || "No details provided.",
      };
    });
  }, [notifications]);

  const { primaryMenus, moduleMenus } = useMemo(() => {
    const actionableUnread = inboxData.filter(
      (i) => i.isActionable && i.isUnread,
    ).length;
    const totalUnread = inboxData.filter((i) => i.isUnread).length;
    const primary = [
      {
        id: "ACTIONABLE",
        text: "Action Required",
        icon: <AssignmentLateIcon sx={{ fontSize: 16 }} />,
        unreadCount: actionableUnread,
        isHighlight: true,
      },
      {
        id: "ALL",
        text: "All Updates",
        icon: <AllInboxIcon sx={{ fontSize: 16 }} />,
        unreadCount: totalUnread,
        isHighlight: false,
      },
    ];
    const uniqueModules = Array.from(
      new Set(inboxData.map((item) => item.displayModule)),
    );
    const modules = uniqueModules
      .map((mod) => ({
        id: mod,
        text: formatModuleName(mod),
        icon: getModuleIcon(mod),
        unreadCount: inboxData.filter(
          (i) => i.displayModule === mod && i.isUnread,
        ).length,
        isHighlight: false,
      }))
      .sort((a, b) => a.text.localeCompare(b.text));
    return { primaryMenus: primary, moduleMenus: modules };
  }, [inboxData]);

  const filteredData = useMemo(() => {
    let list = inboxData;
    if (activeMenu === "ACTIONABLE") {
      list = list.filter((i) => i.isActionable);
    } else if (activeMenu !== "ALL") {
      list = list.filter((i) => i.displayModule === activeMenu);
    }
    if (searchQuery) {
      const lowerQ = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.shortTitle.toLowerCase().includes(lowerQ) ||
          i.message.toLowerCase().includes(lowerQ),
      );
    }
    if (filterTab === 1) list = list.filter((i) => i.isUnread);
    return list;
  }, [inboxData, activeMenu, filterTab, searchQuery]);

  useEffect(() => {
    if (!isMobile && filteredData.length > 0) {
      if (
        !selectedItemId ||
        !filteredData.find((i) => i.id === selectedItemId)
      ) {
        setSelectedItemId(filteredData[0].id);
      }
    } else if (filteredData.length === 0) {
      setSelectedItemId(null);
    }
  }, [filteredData, isMobile, selectedItemId]);

  const activeItem = useMemo(
    () => filteredData.find((t) => t.id === selectedItemId),
    [filteredData, selectedItemId],
  );

  return (
    <Box
      sx={{
        height: { xs: "calc(100vh - 56px)", md: "calc(100vh - 95px)" },
        minHeight: 500,
        p: { xs: 0, sm: 1.5, md: 2 },
        bgcolor: theme.palette.mode === "dark" ? "#0f0f0f" : "#eef0f4",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          height: "100%",
          width: "100%",
          overflow: "hidden",
          borderRadius: { xs: 0, sm: "12px" },
          border: `1px solid ${theme.palette.divider}`,
          boxShadow:
            theme.palette.mode === "dark"
              ? "0 1px 3px rgba(0,0,0,0.4)"
              : "0 1px 6px rgba(0,0,0,0.07)",
        }}
      >
        {/* SIDEBAR – Desktop */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            width: 230,
            flexShrink: 0,
            borderRight: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === "dark" ? "#161616" : "#f8f9fb",
          }}
        >
          <SidebarMenu
            primaryMenus={primaryMenus}
            moduleMenus={moduleMenus}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
          />
        </Box>

        {/* SIDEBAR – Mobile Drawer */}
        <Drawer
          anchor="left"
          open={mobileDrawerOpen}
          onClose={() => setMobileDrawerOpen(false)}
          PaperProps={{ sx: { width: 260 } }}
        >
          <SidebarMenu
            primaryMenus={primaryMenus}
            moduleMenus={moduleMenus}
            activeMenu={activeMenu}
            setActiveMenu={(id: string) => {
              setActiveMenu(id);
              setMobileDrawerOpen(false);
            }}
          />
        </Drawer>

        {/* MIDDLE – Notification List */}
        <Box
          sx={{
            display: { xs: selectedItemId ? "none" : "flex", md: "flex" },
            flexDirection: "column",
            width: { xs: "100%", md: 380 },
            flexShrink: 0,
            borderRight: `1px solid ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === "dark" ? "#1a1a1a" : "#fff",
          }}
        >
          <NotificationList
            filterTab={filterTab}
            setFilterTab={setFilterTab}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filteredData={filteredData}
            isLoading={isLoading}
            isFetching={isFetching}
            selectedItemId={selectedItemId}
            setSelectedItemId={setSelectedItemId}
            onOpenMenu={() => setMobileDrawerOpen(true)}
            activeMenuName={
              activeMenu === "ACTIONABLE"
                ? "Action Required"
                : activeMenu === "ALL"
                  ? "All Updates"
                  : formatModuleName(activeMenu)
            }
          />
        </Box>

        {/* RIGHT – Detail View */}
        <Box
          sx={{
            display: { xs: selectedItemId ? "flex" : "none", md: "flex" },
            flex: 1,
            flexDirection: "column",
            overflow: "hidden",
            bgcolor: "background.paper",
          }}
        >
          <DetailView
            activeItem={activeItem}
            onBack={() => setSelectedItemId(null)}
          />
        </Box>
      </Paper>
    </Box>
  );
}
