import React, { useMemo, useState, useRef } from "react";
import {
  Box,
  Divider,
  IconButton,
  Typography,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Drawer,
  Badge,
  Collapse,
  Paper,
  Popper,
  Fade,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { NavLink, useLocation } from "react-router";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StarRounded from "@mui/icons-material/StarRounded";
import StarBorderRounded from "@mui/icons-material/StarBorderRounded";
import vegayanLogo from "../../assets/images/Airtel.png";
import { useTabColorTokens } from "../../style/theme";
import { useAppSelector } from "../../app/hooks";
import { useGetUnreadNotificationCountQuery } from "../../features/inbox/api/inboxApiSlice";
import { useSidebarNav, type NavItem } from "../../rbac/useSidebarNav";
import SmartScrollContainer from "../common/SmartScrollContainer";
import { DRAWER_WIDTH, COLLAPSED_WIDTH } from "./layoutConstants";
import { useNavHistory } from "./useNavHistory";

type Colors = ReturnType<typeof useTabColorTokens>;

interface SideBarProps {
  isCollapsed?: boolean;
  onCollapseToggle?: () => void;
  /** Mobile-only: whether the off-canvas temporary drawer is open. */
  mobileOpen?: boolean;
  /** Mobile-only: called to close the off-canvas drawer (backdrop click, nav, Esc). */
  onMobileClose?: () => void;
}

const activeItemSx = (colors: Colors) => ({
  background: "linear-gradient(90deg, rgba(255,255,255,0.22), rgba(255,255,255,0.05))",
  color: "#ffffff",
  "&::before": {
    content: '""',
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 4,
    borderRadius: "0 6px 6px 0",
    background: `linear-gradient(180deg, ${colors.accentLight}, ${colors.accent})`,
    boxShadow: `0 0 12px ${colors.accent}CC`,
  },
});

const baseItemSx = (active: boolean, isCollapsed: boolean, colors: Colors) => ({
  position: "relative",
  my: 0.6,
  borderRadius: 2.5,
  px: isCollapsed ? 1.5 : 2,
  py: 1.2,
  color: active ? "#ffffff" : "rgba(255,255,255,0.75)",
  background: "transparent",
  ...(active ? activeItemSx(colors) : {}),
  "&:hover": {
    background: "linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.05))",
    transform: "translateX(6px)",
  },
  "&:hover .fav-star": { opacity: 1 },
  transition: "all 0.28s ease",
});

/** Small star toggle shown on hover — stops the click from also triggering the NavLink navigation underneath it. */
const FavoriteToggle: React.FC<{ active: boolean; onToggle: () => void; alwaysVisible?: boolean }> = ({
  active,
  onToggle,
  alwaysVisible,
}) => (
  <IconButton
    className="fav-star"
    size="small"
    onClick={(e) => {
      e.preventDefault();
      e.stopPropagation();
      onToggle();
    }}
    sx={{
      ml: "auto",
      opacity: alwaysVisible || active ? 1 : 0,
      transition: "opacity 0.15s ease",
      color: active ? "#F6C445" : "rgba(255,255,255,0.55)",
      p: 0.4,
      "&:hover": { color: "#F6C445" },
    }}
  >
    {active ? <StarRounded sx={{ fontSize: 17 }} /> : <StarBorderRounded sx={{ fontSize: 17 }} />}
  </IconButton>
);

interface SubItemProps {
  item: Omit<NavItem, "children">;
  isActive: boolean;
  colors: Colors;
  flyout?: boolean;
  onNavigate?: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

const SubItem: React.FC<SubItemProps> = ({ item, isActive, colors, flyout, onNavigate, isFavorite, onToggleFavorite }) => (
  <ListItemButton
    component={NavLink}
    to={item.to}
    onClick={onNavigate}
    sx={{
      position: "relative",
      mx: flyout ? 0.5 : 1,
      my: 0.3,
      pl: flyout ? 1.5 : 4,
      pr: 1.5,
      py: flyout ? 1 : 0.9,
      borderRadius: 2,
      color: isActive
        ? flyout ? colors.accent : "#ffffff"
        : flyout ? colors.textSecondary : "rgba(255,255,255,0.65)",
      background: isActive
        ? flyout ? colors.accentDim : "rgba(255,255,255,0.12)"
        : "transparent",
      "&::before": isActive
        ? {
            content: '""',
            position: "absolute",
            left: 0,
            top: 6,
            bottom: 6,
            width: 3,
            borderRadius: "0 4px 4px 0",
            background: `linear-gradient(180deg, ${colors.accentLight}, ${colors.accent})`,
            boxShadow: `0 0 8px ${colors.accent}B3`,
          }
        : {},
      "&:hover": {
        background: flyout ? colors.accentDim : "rgba(255,255,255,0.10)",
        transform: "translateX(4px)",
      },
      "&:hover .fav-star": { opacity: 1 },
      transition: "all 0.22s ease",
    }}
  >
    <ListItemIcon sx={{ color: "inherit", minWidth: 32, "& svg": { fontSize: 17 } }}>
      {item.icon}
    </ListItemIcon>
    <ListItemText
      primary={item.text}
      primaryTypographyProps={{ fontSize: 13.5, fontWeight: isActive ? 600 : 400, letterSpacing: 0.2 }}
    />
    {onToggleFavorite && !flyout && <FavoriteToggle active={!!isFavorite} onToggle={onToggleFavorite} />}
  </ListItemButton>
);

interface FlyoutMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  parentText: string;
  children: Omit<NavItem, "children">[];
  colors: Colors;
  isItemActive: (to: string, matchPaths?: string[], exactOnly?: boolean) => boolean;
  onClose: () => void;
}

const FlyoutMenu: React.FC<FlyoutMenuProps> = ({
  anchorEl, open, parentText, children, colors, isItemActive, onClose,
}) => (
  <Popper
    open={open}
    anchorEl={anchorEl}
    placement="right-start"
    transition
    style={{ zIndex: 1400 }}
    modifiers={[{ name: "offset", options: { offset: [0, 8] } }]}
  >
    {({ TransitionProps }) => (
      <Fade {...TransitionProps} timeout={180}>
        <Paper
          elevation={8}
          onMouseLeave={onClose}
          sx={{
            minWidth: 196,
            borderRadius: 3,
            overflow: "hidden",
            background: colors.surface,
            boxShadow: colors.shadowElevated,
            border: `1px solid ${colors.border}`,
            py: 0.8,
          }}
        >
          <Typography
            sx={{
              px: 2,
              pt: 0.5,
              pb: 0.8,
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
              color: colors.textDim,
              borderBottom: `1px solid ${colors.border}`,
              mb: 0.5,
            }}
          >
            {parentText}
          </Typography>
          <List disablePadding>
            {children.map((child) => (
              <SubItem
                key={child.to}
                item={child}
                isActive={isItemActive(child.to, child.matchPaths, true)}
                colors={colors}
                flyout
                onNavigate={onClose}
              />
            ))}
          </List>
        </Paper>
      </Fade>
    )}
  </Popper>
);

// ─── Main SideBar ─────────────────────────────────────────────────────────────
const SideBar: React.FC<SideBarProps> = ({
  isCollapsed: isCollapsedProp = false,
  onCollapseToggle,
  mobileOpen = false,
  onMobileClose,
}) => {
  const location = useLocation();
  const theme = useTheme();
  const colors = useTabColorTokens(theme);
  const user = useAppSelector((s) => s.auth.user);

  // Below "sm" the sidebar becomes an off-canvas temporary drawer instead
  // of a permanent rail — a permanent 70px rail on a phone still eats a
  // meaningful slice of an already-narrow viewport.
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isCollapsed = isCollapsedProp;

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [flyoutAnchor, setFlyoutAnchor] = useState<HTMLElement | null>(null);
  const [flyoutItem, setFlyoutItem] = useState<NavItem | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Shares the NotificationBell's cache entry/poll — kept here as a plain
  // read so this component doesn't layer its own refetch triggers on top
  // (that previously combined with the bell's poll to over-fetch).
  const { data: countData } = useGetUnreadNotificationCountQuery();
  const inboxCount = countData?.notificationCount ?? 0;
  const sidebarItems = useSidebarNav();

  const flatNavItems = useMemo(() => {
    const flat: Omit<NavItem, "children">[] = [];
    for (const item of sidebarItems) {
      flat.push(item);
      for (const child of item.children ?? []) flat.push(child);
    }
    return flat;
  }, [sidebarItems]);

  const isItemActive = (to: string, matchPaths?: string[], exactOnly = false): boolean => {
    const p = location.pathname;
    if (p === to) return true;
    if (!exactOnly && !matchPaths) return p.startsWith(to + "/");
    if (matchPaths) return matchPaths.some((mp) => p === mp || p.startsWith(mp + "/"));
    return false;
  };

  const currentNavItem = useMemo(
    () => flatNavItems.find((it) => isItemActive(it.to, it.matchPaths, true)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flatNavItems, location.pathname],
  );

  const { favorites, recents, toggleFavorite, isFavorite } = useNavHistory(currentNavItem?.to);

  const favoriteItems = useMemo(
    () => favorites.map((path) => flatNavItems.find((it) => it.to === path)).filter((it): it is Omit<NavItem, "children"> => !!it),
    [favorites, flatNavItems],
  );
  const recentItems = useMemo(
    () =>
      recents
        .map((path) => flatNavItems.find((it) => it.to === path))
        .filter((it): it is Omit<NavItem, "children"> => !!it)
        .filter((it) => !favorites.includes(it.to)),
    [recents, flatNavItems, favorites],
  );

  if (!user) return null;

  const toggleGroup = (to: string) =>
    setOpenGroups((prev) => ({ ...prev, [to]: !prev[to] }));

  const isGroupOpen = (item: NavItem) => {
    if (openGroups[item.to] !== undefined) return openGroups[item.to];
    return item.children?.some((c) => isItemActive(c.to, c.matchPaths, true)) ?? false;
  };

  const openFlyout = (e: React.MouseEvent<HTMLElement>, item: NavItem) => {
    if (!isCollapsed) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setFlyoutAnchor(e.currentTarget);
    setFlyoutItem(item);
  };

  const scheduleFlyoutClose = () => {
    if (!isCollapsed) return;
    closeTimer.current = setTimeout(() => {
      setFlyoutAnchor(null);
      setFlyoutItem(null);
    }, 120);
  };

  const cancelFlyoutClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const closeFlyout = () => {
    setFlyoutAnchor(null);
    setFlyoutItem(null);
  };

  const navContent = (collapsedView: boolean) => (
    <>
      {/* ── HEADER ── */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent={collapsedView ? "center" : "space-between"}
        px={collapsedView ? 1 : 2}
        py={1.8}
        sx={{ flexShrink: 0 }}
      >
        {!collapsedView && (
          <Box display="flex" alignItems="center" gap={1.2}>
            <Box
              component="img"
              src={vegayanLogo}
              alt="Logo"
              width={34}
              height={34}
              sx={{ filter: `drop-shadow(0 0 6px ${colors.accentLight}80)` }}
            />
            <Typography
              fontWeight={800}
              letterSpacing={1.4}
              sx={{
                opacity: 0.95,
                background: `linear-gradient(90deg, #fff 60%, ${colors.accentLight})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              CHM
            </Typography>
          </Box>
        )}
        {isMobile ? (
          <IconButton onClick={onMobileClose} sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.08)" }}>
            <MenuIcon />
          </IconButton>
        ) : (
          <IconButton
            onClick={onCollapseToggle}
            sx={{
              display: { xs: "none", sm: "inline-flex" },
              color: "#fff",
              bgcolor: "rgba(255,255,255,0.08)",
              "&:hover": { bgcolor: "rgba(255,255,255,0.18)", transform: "rotate(180deg)" },
              transition: "all 0.35s ease",
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mx: 1.5, mb: 0.5, flexShrink: 0 }} />

      {/* ── NAVIGATION ── */}
      <Box sx={{ flex: 1, overflow: "hidden", px: 0 }}>
        <SmartScrollContainer height="calc(100vh - 84px)">
          {/* Favorites */}
          {!collapsedView && favoriteItems.length > 0 && (
            <>
              <Typography sx={{ px: 2.5, pt: 1.5, pb: 0.3, fontSize: 10.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                Favorites
              </Typography>
              <List disablePadding sx={{ px: 0.5 }}>
                {favoriteItems.map((item) => (
                  <SubItem
                    key={`fav-${item.to}`}
                    item={item}
                    isActive={isItemActive(item.to, item.matchPaths, true)}
                    colors={colors}
                    isFavorite
                    onToggleFavorite={() => toggleFavorite(item.to)}
                    onNavigate={isMobile ? onMobileClose : undefined}
                  />
                ))}
              </List>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mx: 1.5, my: 0.75 }} />
            </>
          )}

          {/* Recently visited */}
          {!collapsedView && recentItems.length > 0 && (
            <>
              <Typography sx={{ px: 2.5, pt: 0.5, pb: 0.3, fontSize: 10.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                Recently Visited
              </Typography>
              <List disablePadding sx={{ px: 0.5 }}>
                {recentItems.map((item) => (
                  <SubItem
                    key={`recent-${item.to}`}
                    item={item}
                    isActive={isItemActive(item.to, item.matchPaths, true)}
                    colors={colors}
                    isFavorite={isFavorite(item.to)}
                    onToggleFavorite={() => toggleFavorite(item.to)}
                    onNavigate={isMobile ? onMobileClose : undefined}
                  />
                ))}
              </List>
              <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mx: 1.5, my: 0.75 }} />
            </>
          )}

          <List sx={{ px: 1.5, mt: 0.5, pb: 2 }}>
            {sidebarItems.map((item) => {
              const { to, text, icon, showBadge, children } = item;
              const active = isItemActive(to);
              const hasChildren = Array.isArray(children) && children.length > 0;
              const groupOpen = hasChildren && isGroupOpen(item);

              const renderedIcon = showBadge ? (
                <Badge badgeContent={inboxCount} color="error">{icon}</Badge>
              ) : icon;

              if (hasChildren) {
                return (
                  <React.Fragment key={to}>
                    <ListItemButton
                      onClick={() => !collapsedView && toggleGroup(to)}
                      onMouseEnter={(e) => openFlyout(e, item)}
                      onMouseLeave={scheduleFlyoutClose}
                      sx={baseItemSx(active, collapsedView, colors)}
                    >
                      <ListItemIcon
                        sx={{
                          color: "inherit",
                          minWidth: 42,
                          transform: active ? "scale(1.15)" : "scale(1)",
                          transition: "transform 0.25s ease",
                        }}
                      >
                        {renderedIcon}
                      </ListItemIcon>
                      {!collapsedView && (
                        <>
                          <ListItemText
                            primary={text}
                            primaryTypographyProps={{ fontSize: 14.5, fontWeight: active ? 600 : 400, letterSpacing: 0.3 }}
                          />
                          <Box
                            component="span"
                            sx={{ display: "flex", color: "rgba(255,255,255,0.55)", "& svg": { fontSize: 18 } }}
                          >
                            {groupOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </Box>
                        </>
                      )}
                    </ListItemButton>

                    {!collapsedView && (
                      <Collapse in={groupOpen} timeout={260} unmountOnExit>
                        <List disablePadding sx={{ pb: 0.5 }}>
                          {children!.map((child) => (
                            <SubItem
                              key={child.to}
                              item={child}
                              isActive={isItemActive(child.to, child.matchPaths, true)}
                              colors={colors}
                              isFavorite={isFavorite(child.to)}
                              onToggleFavorite={() => toggleFavorite(child.to)}
                              onNavigate={isMobile ? onMobileClose : undefined}
                            />
                          ))}
                        </List>
                      </Collapse>
                    )}
                  </React.Fragment>
                );
              }

              return (
                <Tooltip key={to} title={collapsedView ? text : ""} placement="right" arrow>
                  <ListItemButton
                    component={NavLink}
                    to={to}
                    onClick={isMobile ? onMobileClose : undefined}
                    sx={baseItemSx(active, collapsedView, colors)}
                  >
                    <ListItemIcon
                      sx={{
                        color: "inherit",
                        minWidth: 42,
                        transform: active ? "scale(1.15)" : "scale(1)",
                        transition: "transform 0.25s ease",
                      }}
                    >
                      {renderedIcon}
                    </ListItemIcon>
                    {!collapsedView && (
                      <ListItemText
                        primary={text}
                        primaryTypographyProps={{ fontSize: 14.5, fontWeight: active ? 600 : 400, letterSpacing: 0.3 }}
                      />
                    )}
                    {!collapsedView && (
                      <FavoriteToggle active={isFavorite(to)} onToggle={() => toggleFavorite(to)} />
                    )}
                  </ListItemButton>
                </Tooltip>
              );
            })}
          </List>
        </SmartScrollContainer>
      </Box>
    </>
  );

  const paperSx = {
    background: `linear-gradient(180deg, ${theme.palette.primary.dark} 0%, #0b1320 100%)`,
    color: "#fff",
    borderRight: "none",
    overflowX: "hidden" as const,
    boxShadow: "2px 0 16px rgba(0,0,0,0.5)",
    display: "flex",
    flexDirection: "column" as const,
  };

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            ...paperSx,
            borderRadius: "0 18px 18px 0",
          },
        }}
      >
        {navContent(false)}
      </Drawer>
    );
  }

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: isCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: isCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH,
            ...paperSx,
            transition: "width 0.35s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease",
            borderRadius: "0 18px 18px 0",
          },
        }}
      >
        {navContent(isCollapsed)}
      </Drawer>

      {flyoutItem && (
        <Box
          onMouseEnter={cancelFlyoutClose}
          onMouseLeave={closeFlyout}
          sx={{ position: "fixed", zIndex: 1400 }}
        >
          <FlyoutMenu
            anchorEl={flyoutAnchor}
            open={Boolean(flyoutAnchor)}  
            parentText={flyoutItem.text}
            children={flyoutItem.children ?? []}
            colors={colors}
            isItemActive={isItemActive}
            onClose={closeFlyout}
          />
        </Box>
      )}
    </>
  );
};

export default React.memo(SideBar);
