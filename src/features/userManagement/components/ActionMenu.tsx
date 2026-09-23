import { useState } from "react";
import {
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Visibility,
  Edit,
  AdminPanelSettings,
  LockReset,
  Delete,
  MoreVert,
} from "@mui/icons-material";

export interface ActionMenuProps {
  onView: () => void;
  onEdit: () => void;
  onPermissions: () => void;
  onResetPassword: () => void;
  onDelete: () => void;
  /** Compact rows use smaller hit targets so the action column doesn't set the
   *  row height. */
  dense?: boolean;
}

export default function ActionMenu({
  onView,
  onEdit,
  onPermissions,
  onResetPassword,
  onDelete,
  dense = false,
}: ActionMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const iconSx = { fontSize: dense ? 16 : 18 };
  const buttonSx = {
    color: "text.secondary",
    p: dense ? 0.4 : 0.6,
    "&:hover": { color: "primary.main", bgcolor: "action.hover" },
  };

  return (
    // Always visible. These used to be `opacity: 0` until the row was hovered,
    // which hides the only way to act on a row behind a gesture that leaves no
    // trace — invisible to anyone scanning the grid, and unreachable entirely
    // on a touch screen, where there is no hover state to enter.
    <Stack direction="row" alignItems="center" gap={dense ? 0 : 0.25}>
      <Tooltip title="View profile">
        <IconButton size="small" onClick={onView} aria-label="View profile" sx={buttonSx}>
          <Visibility sx={iconSx} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Edit user">
        <IconButton size="small" onClick={onEdit} aria-label="Edit user" sx={buttonSx}>
          <Edit sx={iconSx} />
        </IconButton>
      </Tooltip>
      <Tooltip title="More actions">
        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          aria-label="More actions"
          sx={buttonSx}
        >
          <MoreVert sx={iconSx} />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            borderRadius: "12px",
            boxShadow: isDark ? "0 12px 32px rgba(0,0,0,0.4)" : "0 12px 32px rgba(15,23,42,0.14)",
            minWidth: 190,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            onPermissions();
            setAnchorEl(null);
          }}
          sx={{ gap: 1.5 }}
        >
          <AdminPanelSettings fontSize="small" sx={{ color: "text.secondary" }} />
          <Typography variant="body2">Permissions</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onResetPassword();
            setAnchorEl(null);
          }}
          sx={{ gap: 1.5 }}
        >
          <LockReset fontSize="small" sx={{ color: "text.secondary" }} />
          <Typography variant="body2">Reset Password</Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            onDelete();
            setAnchorEl(null);
          }}
          sx={{ gap: 1.5, color: "error.main" }}
        >
          <Delete fontSize="small" />
          <Typography variant="body2" color="inherit">
            Remove User
          </Typography>
        </MenuItem>
      </Menu>
    </Stack>
  );
}
