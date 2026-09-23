export interface NotificationItemType {
  id: string;
  message: string;
  time: string;
  type: "success" | "error" | "info" | "warning";
  isRead: boolean;
}

export const notifications: NotificationItemType[] = [
  {
    id: "1",
    message: "Shift swap approved by manager",
    time: "2 min ago",
    type: "success",
    isRead: false,
  },
  {
    id: "2",
    message: "Leave request rejected",
    time: "1 hr ago",
    type: "error",
    isRead: false,
  },
  {
    id: "3",
    message: "New company holiday announced",
    time: "3 hrs ago",
    type: "info",
    isRead: true,
  },
  {
    id: "4",
    message: "New company holiday announced",
    time: "3 hrs ago",
    type: "info",
    isRead: true,
  },
  {
    id: "5",
    message: "New company holiday announced",
    time: "3 hrs ago",
    type: "info",
    isRead: true,
  },
  {
    id: "6",
    message: "New company holiday announced",
    time: "3 hrs ago",
    type: "info",
    isRead: true,
  },
  {
    id: "7",
    message: "New company holiday announced",
    time: "3 hrs ago",
    type: "info",
    isRead: true,
  },
  {
    id: "8",
    message: "New company holiday announced",
    time: "3 hrs ago",
    type: "info",
    isRead: true,
  },
];
