import React, { useContext, useRef, useState, type JSX } from "react";
import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Switch,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import LockResetIcon from "@mui/icons-material/LockReset";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import BadgeIcon from "@mui/icons-material/Badge";
import CheckIcon from "@mui/icons-material/Check";
import PaletteIcon from "@mui/icons-material/Palette";
import MenuIcon from "@mui/icons-material/Menu";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import BoltOutlined from "@mui/icons-material/BoltOutlined";

import {
  BRAND_COLOR_OPTIONS,
  ColorModeContext,
  useTabColorTokens,
} from "../../style/theme";
import { useNavigate } from "react-router";
import VegayanLogo from "../../assets/images/vegayan_logo.png";
import AirtelLog from "../../assets/images/airtel3.png";
import { toast } from "react-toastify";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useLogoutMutation } from "../../features/auth/api/auth.api";
import { logout } from "../../features/auth/slices/auth.slice";
import { authStorage } from "../../app/store/auth.storage";
import { api } from "../../service/api";
import ChangePasswordDialog from "../common/ChangePasswordDialog";
import { DRAWER_WIDTH, COLLAPSED_WIDTH, MOBILE_HEADER_INSET } from "./layoutConstants";
import GlobalSearchModal from "../../features/globalSearch/GlobalSearchModal";
import { useGlobalSearchShortcut } from "../../features/globalSearch/useGlobalSearchShortcut";
import { useQuickActionsIndex } from "../../features/globalSearch/useSearchIndex";

// ── Import the notification bell ──────────────────────────────────────────────
import NotificationBell from "../common/NotificationBell";
// If you want to pass real notifications from an API, import your notification
// type too: import NotificationBell, { type Notification } from "../common/NotificationBell";

interface HeaderProps {
  dynamicHeaderText: string;
  dynamicHeaderIcon?: JSX.Element;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  isSidebarCollapsed: boolean;
  /** Mobile-only: opens the off-canvas sidebar drawer. */
  onMobileNavToggle?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  dynamicHeaderText,
  dynamicHeaderIcon,
  setLoading,
  loading,
  isSidebarCollapsed,
  onMobileNavToggle,
}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const colors = useTabColorTokens(theme);
  const { toggleColorMode, primaryColor, setPrimaryColor } = useContext(ColorModeContext);
  const isDark = theme.palette.mode === "dark";

  // Below "sm" the sidebar is an off-canvas overlay (see SideBar) rather
  // than a permanent rail, so it reserves no layout width at all — the
  // header only needs to leave room for its own hamburger button there.
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const headerOffset = isMobile ? MOBILE_HEADER_INSET : isSidebarCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  const [searchOpen, setSearchOpen] = useState(false);
  const searchTriggerRef = useRef<HTMLDivElement>(null);
  useGlobalSearchShortcut(() => setSearchOpen(true));

  const [quickActionsAnchor, setQuickActionsAnchor] = useState<null | HTMLElement>(null);
  const quickActions = useQuickActionsIndex();

  const user = useAppSelector((s) => s.auth.user);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newPasswordError, setNewPasswordError] = useState<string | null>(null);

  const [logoutApi] = useLogoutMutation();
  if (!user) return null;

  const olmId = user.olmId;
  const roleCode = user.roleCode;

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logoutApi({ olmId: user.olmId }).unwrap();
    } catch {
      console.warn("Logout API failed, continuing local logout");
    } finally {
      // Only clear the auth keys, not the whole storage — a blanket
      // localStorage.clear() also wiped unrelated saved preferences
      // (theme, brand colour, sidebar state) on every logout.
      // Clearing these keys fires the native `storage` event in every
      // other open tab, which AuthHydrator listens for to log them out too.
      authStorage.clear();
      dispatch(logout());
      // Clear every cached query too — otherwise a re-login (same user or a
      // different one on a shared machine) can briefly render this session's
      // stale attendance/roster/profile data before a refetch catches up.
      dispatch(api.util.resetApiState());
      navigate("/login", { replace: true });
      setLoading(false);
    }
  };

  const validateNewPassword = (password: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    return regex.test(password)
      ? null
      : "Password must be strong (8+ chars, uppercase, lowercase, number, symbol)";
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const error = validateNewPassword(newPassword);
    if (error) {
      setNewPasswordError(error);
      return;
    }
    setLoading(true);
    setLoading(false);
    toast.success("Password changed successfully");
    setIsChangePasswordOpen(false);
  };

  return (
    <>
      <Box
        display="flex"
        alignItems="center"
        gap={{ xs: 1, sm: 1.5 }}
        p={0.8}
        sx={{
          position: "fixed",
          width: "100%",
          zIndex: 1000,
          color: "#fff",
          pl: { xs: `${headerOffset}px`, sm: `${headerOffset}px` },
          pr: { xs: 1, sm: 2 },
          background: `linear-gradient(115deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          boxShadow: isDark ? "0 2px 16px rgba(0,0,0,.45)" : "0 2px 16px rgba(13,27,42,.18)",
          transition: "background 0.3s ease, padding-left 0.3s ease",
        }}
      >
        {/* Mobile hamburger — opens the off-canvas sidebar drawer */}
        <IconButton
          onClick={onMobileNavToggle}
          sx={{ display: { xs: "inline-flex", sm: "none" }, color: "#fff", flexShrink: 0 }}
        >
          <MenuIcon />
        </IconButton>

        {/* Left — Airtel logo + current page breadcrumb */}
        <Box display="flex" alignItems="center" gap={{ xs: "8px", sm: "14px" }} minWidth={0} flexShrink={0}>
          <IconButton sx={{ p: 0, flexShrink: 0, display: { xs: "none", sm: "inline-flex" } }}>
            <img
              src={AirtelLog}
              alt="Airtel Logo"
              width={80}
              height={35}
              style={{ width: "80px", maxWidth: "18vw", height: "auto", objectFit: "contain" }}
            />
          </IconButton>

          {/* {dynamicHeaderText && (
            <>
              <Box
                sx={{
                  display: { xs: "none", md: "block" },
                  width: "1px",
                  height: 22,
                  bgcolor: "rgba(255,255,255,0.25)",
                  flexShrink: 0,
                }}
              />
              <Stack
                direction="row"
                alignItems="center"
                spacing={0.9}
                sx={{ display: { xs: "none", md: "flex" }, minWidth: 0 }}
              >
                {dynamicHeaderIcon && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 26,
                      height: 26,
                      borderRadius: "8px",
                      bgcolor: "rgba(255,255,255,0.16)",
                      flexShrink: 0,
                      "& svg": { fontSize: 16 },
                    }}
                  >
                    {dynamicHeaderIcon}
                  </Box>
                )}
                <Typography
                  noWrap
                  sx={{ color: "#fff", fontWeight: 700, fontSize: 14.5, letterSpacing: 0.2 }}
                >
                  {dynamicHeaderText}
                </Typography>
              </Stack>
            </>
          )} */}
        </Box>

        {/* Center — global search trigger */}
        <Box
          ref={searchTriggerRef}
          onClick={() => setSearchOpen(true)}
          role="button"
          aria-label="Open global search"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flex: 1,
            maxWidth: 420,
            mx: "auto",
            px: 1.5,
            py: 0.7,
            borderRadius: colors.radiusPill,
            bgcolor: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.16)",
            cursor: "pointer",
            transition: "background 0.15s, border-color 0.15s",
            "&:hover": { bgcolor: "rgba(255,255,255,0.18)", borderColor: "rgba(255,255,255,0.3)" },
          }}
        >
          <SearchOutlined sx={{ fontSize: 18, color: "rgba(255,255,255,0.85)" }} />
          <Typography noWrap sx={{ fontSize: 13, color: "rgba(255,255,255,0.75)", flex: 1, display: { xs: "none", sm: "block" } }}>
            Search modules, pages, actions…
          </Typography>
          <Box
            sx={{
              display: { xs: "none", sm: "block" },
              fontSize: 10.5,
              fontWeight: 700,
              color: "rgba(255,255,255,0.75)",
              bgcolor: "rgba(255,255,255,0.14)",
              borderRadius: "6px",
              px: 0.75,
              py: 0.25,
              flexShrink: 0,
            }}
          >
            {typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac") ? "⌘K" : "Ctrl K"}
          </Box>
        </Box>

        {/* Right — Quick actions + Bell + user menu */}
        <Box display="flex" alignItems="center" gap="8px" flexShrink={0}>
          <Tooltip title="Quick actions" arrow>
            <IconButton
              onClick={(e) => setQuickActionsAnchor(e.currentTarget)}
              sx={{ color: "#fff", display: { xs: "none", sm: "inline-flex" } }}
            >
              <BoltOutlined />
            </IconButton>
          </Tooltip>
          <Menu
            anchorEl={quickActionsAnchor}
            open={Boolean(quickActionsAnchor)}
            onClose={() => setQuickActionsAnchor(null)}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  width: 240,
                  borderRadius: "14px",
                  bgcolor: colors.surface,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.border}`,
                  boxShadow: colors.shadowElevated,
                  p: 0.5,
                },
              },
            }}
          >
            {quickActions.length === 0 && (
              <MenuItem disabled>No quick actions available</MenuItem>
            )}
            {quickActions.map((qa) => (
              <MenuItem
                key={qa.id}
                onClick={() => {
                  setQuickActionsAnchor(null);
                  navigate(qa.path);
                }}
              >
                <ListItemIcon sx={{ color: colors.textSecondary, minWidth: 32 }}>{qa.icon}</ListItemIcon>
                <ListItemText primaryTypographyProps={{ fontSize: 13 }}>{qa.label}</ListItemText>
              </MenuItem>
            ))}
          </Menu>

          <Box
            component="img"
            src={VegayanLogo}
            alt="Logo"
            width={100}
            height={28}
            sx={{ display: { xs: "none", md: "block" }, objectFit: "contain" }}
          />

          <NotificationBell onViewAll={() => navigate("/inbox/notifications")} />

          {/* User avatar / profile menu */}
          <Box
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              ml: 0.5,
              px: 1,
              py: 0.4,
              borderRadius: "20px",
              transition: "background 0.18s",
              "&:hover": { background: "rgba(255,255,255,0.14)" },
            }}
          >
            <AccountCircleIcon sx={{ fontSize: 30, color: "#fff" }} />
            <Typography
              noWrap
              sx={{ display: { xs: "none", sm: "block" }, color: "#fff", fontWeight: 600, fontSize: 13 }}
            >
              {olmId}
            </Typography>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={openMenu}
            onClose={() => setAnchorEl(null)}
            slotProps={{
              paper: {
                sx: {
                  mt: 1,
                  width: 288,
                  borderRadius: "14px",
                  bgcolor: colors.surface,
                  color: colors.textPrimary,
                  border: `1px solid ${colors.border}`,
                  boxShadow: isDark
                    ? "0 20px 44px rgba(0,0,0,0.5)"
                    : "0 20px 44px rgba(13,27,42,0.18)",
                  p: 1,
                },
              },
            }}
          >
            <MenuItem>
              <PersonIcon sx={{ mr: 1, color: colors.textSecondary }} />
              {user.employeeName}
            </MenuItem>

            <MenuItem onClick={() => setIsChangePasswordOpen(true)}>
              <LockResetIcon sx={{ mr: 1, color: colors.textSecondary }} />
              Change Password
            </MenuItem>

            <MenuItem>
              <PersonIcon sx={{ mr: 1, color: colors.textSecondary }} /> {olmId}
            </MenuItem>

            <MenuItem>
              <BadgeIcon sx={{ mr: 1, color: colors.textSecondary }} /> Role: {roleCode}
            </MenuItem>

            <MenuItem onClick={handleLogout} disabled={loading}>
              <LogoutIcon sx={{ mr: 1, color: colors.danger }} />
              Logout
              {loading && <CircularProgress size={16} sx={{ ml: 2 }} />}
            </MenuItem>

            <Divider sx={{ my: 1 }} />

            {/* ── Appearance controls ── */}
            <Box sx={{ px: 1.5, pb: 1 }}>
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
                <PaletteIcon sx={{ fontSize: 14, color: colors.textSecondary }} />
                <Typography sx={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".6px", textTransform: "uppercase", color: colors.textSecondary }}>
                  Appearance
                </Typography>
              </Stack>

              {/* Brand colour swatches */}
              <Stack direction="row" spacing={1.1} justifyContent="space-between" sx={{ mb: 1.25 }}>
                {BRAND_COLOR_OPTIONS.map((option) => {
                  const active = option.value.toLowerCase() === primaryColor.toLowerCase();
                  return (
                    <Tooltip key={option.value} title={option.label} arrow>
                      <Box
                        onClick={() => setPrimaryColor(option.value)}
                        role="button"
                        aria-label={`Use ${option.label} theme`}
                        aria-pressed={active}
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: "8px",
                          bgcolor: option.value,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: active ? `2px solid ${colors.textPrimary}` : "2px solid transparent",
                          boxShadow: active ? `0 0 0 3px ${option.value}35` : "none",
                          transition: "transform 0.15s, box-shadow 0.15s",
                          "&:hover": { transform: "scale(1.12)" },
                        }}
                      >
                        {active && <CheckIcon sx={{ fontSize: 15, color: "#fff" }} />}
                      </Box>
                    </Tooltip>
                  );
                })}
              </Stack>

              {/* Light / dark toggle */}
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                  px: 1.25,
                  py: 0.75,
                  borderRadius: "10px",
                  background: colors.surface2,
                  border: `1px solid ${colors.border}`,
                }}
              >
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  {isDark ? (
                    <DarkModeIcon fontSize="small" sx={{ color: colors.accent }} />
                  ) : (
                    <LightModeIcon fontSize="small" sx={{ color: colors.accent }} />
                  )}
                  <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: colors.textPrimary }}>
                    {isDark ? "Dark mode" : "Light mode"}
                  </Typography>
                </Stack>
                <Switch checked={isDark} onChange={toggleColorMode} size="small" />
              </Stack>
            </Box>
          </Menu>
        </Box>
      </Box>

      <ChangePasswordDialog
        open={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        loading={loading}
        currentPassword={currentPassword}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        showNewPassword={showNewPassword}
        showConfirmPassword={showConfirmPassword}
        newPasswordError={newPasswordError}
        onCurrentPasswordChange={setCurrentPassword}
        onNewPasswordChange={(value) => {
          setNewPassword(value);
          setNewPasswordError(validateNewPassword(value));
        }}
        onConfirmPasswordChange={setConfirmPassword}
        onToggleNewPassword={() => setShowNewPassword(!showNewPassword)}
        onToggleConfirmPassword={() =>
          setShowConfirmPassword(!showConfirmPassword)
        }
        onSubmit={handleChangePassword}
      />

      <GlobalSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} anchorRef={searchTriggerRef} />
    </>
  );
};

export default React.memo(Header);
