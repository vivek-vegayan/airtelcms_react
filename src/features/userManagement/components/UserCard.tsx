import { Avatar, Badge, Box, Chip, Divider, Stack, Typography, useTheme } from "@mui/material";
import dayjs from "dayjs";
import RoleBadge from "./RoleBadge";
import StatusBadge from "./StatusBadge";
import ActionMenu from "./ActionMenu";
import { getAvatarColor, getInitials, formatRelativeTime } from "../utils/userHelpers";
import { getUserStatus, STATUS_CONFIG, type User } from "../types/user";

export interface UserCardProps {
  user: User;
  onView: (u: User) => void;
  onEdit: (u: User) => void;
  onPermissions: (u: User) => void;
  onResetPassword: (u: User) => void;
  onDelete: (u: User) => void;
}

export default function UserCard({
  user,
  onView,
  onEdit,
  onPermissions,
  onResetPassword,
  onDelete,
}: UserCardProps) {
  const status = getUserStatus(user);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box
      className="row-hover"
      role="button"
      tabIndex={0}
      onClick={() => onView(user)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView(user);
        }
      }}
      sx={{
        p: 1.5,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: "12px",
        border: "1px solid",
        borderColor: "divider",
        // `background: "background.paper"` was passed as a raw CSS background,
        // which is not a palette path — the card rendered transparent.
        bgcolor: "background.paper",
        transition: "border-color 0.18s ease, box-shadow 0.18s ease",
        cursor: "pointer",
        "&:hover, &:focus-visible": {
          borderColor: "primary.main",
          boxShadow: isDark ? "0 6px 18px rgba(0,0,0,0.4)" : "0 6px 18px rgba(15,23,42,0.08)",
        },
        "&:focus-visible": { outline: "none" },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          badgeContent={
            <Box
              sx={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                bgcolor: STATUS_CONFIG[status].dot,
                border: "2px solid",
                borderColor: "background.paper",
              }}
            />
          }
        >
          <Avatar
            sx={{ bgcolor: getAvatarColor(user.id), width: 38, height: 38, fontSize: 13, fontWeight: 700 }}
          >
            {getInitials(user.name)}
          </Avatar>
        </Badge>
        <Box onClick={(e) => e.stopPropagation()}>
          <ActionMenu
            onView={() => onView(user)}
            onEdit={() => onEdit(user)}
            onPermissions={() => onPermissions(user)}
            onResetPassword={() => onResetPassword(user)}
            onDelete={() => onDelete(user)}
          />
        </Box>
      </Stack>

      <Typography sx={{ fontSize: 13, fontWeight: 700, color: "text.primary", mt: 1 }} noWrap title={user.name}>
        {user.name}
      </Typography>
      <Typography sx={{ fontSize: 11.5, color: "text.secondary" }} noWrap title={user.email}>
        {user.email}
      </Typography>
      <Typography sx={{ fontSize: 11, color: "text.secondary" }}>{user.employeeId}</Typography>

      <Stack direction="row" gap={0.6} mt={1} flexWrap="wrap">
        <RoleBadge role={user.role} size="small" />
        <StatusBadge status={status} />
        <Chip
          label={user.function}
          size="small"
          sx={{
            bgcolor: "action.hover",
            color: "text.secondary",
            fontSize: "0.65rem",
            fontWeight: 600,
            height: 20,
            maxWidth: 130,
          }}
        />
      </Stack>

      {/* Pushes the meta row to the bottom so cards of differing badge counts
          still line their footers up across the grid. */}
      <Box sx={{ flex: 1, minHeight: 8 }} />
      <Divider sx={{ my: 1 }} />

      <Stack direction="row" justifyContent="space-between" gap={1}>
        <Typography sx={{ fontSize: 10.5, color: "text.secondary" }} noWrap>
          Joined {user.joinedDate ? dayjs(user.joinedDate).format("MMM YYYY") : "—"}
        </Typography>
        <Typography sx={{ fontSize: 10.5, color: "text.secondary" }} noWrap>
          Seen {formatRelativeTime(user.lastLogin ?? undefined)}
        </Typography>
      </Stack>
    </Box>
  );
}
