import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Close,
  Edit,
  Email,
  Phone,
  CalendarMonth,
  Person,
  Work,
  Business,
  Shield,
  History,
  Login,
  Logout,
  ContentCopy,
  AccountTree,
} from "@mui/icons-material";
import dayjs from "dayjs";
import RoleBadge from "./RoleBadge";
import StatusBadge from "./StatusBadge";
import { getAvatarColor, getInitials } from "../utils/userHelpers";
import { useGetUserProfileQuery } from "../api/userManagementApi";
import { CreateEditMemberDialog } from "../../teamManagement/components/dialog/CreateEditMemberDialog";

interface InfoRowProps {
  icon: React.ElementType;
  label: string;
  value: string;
  copyable?: boolean;
}

function InfoRow({ icon: Icon, label, value, copyable = false }: InfoRowProps) {
  const [copied, setCopied] = useState(false);
  const hasValue = value !== "—" && value !== "";

  const copy = () => {
    navigator.clipboard?.writeText(value).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      },
      () => undefined,
    );
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1.5}
      py={1}
      sx={{ "&:hover .row-copy": { opacity: 1 } }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: "9px",
          bgcolor: "action.hover",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon sx={{ fontSize: 16, color: "text.secondary" }} />
      </Box>
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontSize: 10.5,
            color: "text.secondary",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.primary" }} noWrap title={value}>
          {value}
        </Typography>
      </Box>
      {copyable && hasValue && (
        <Tooltip title={copied ? "Copied" : "Copy"}>
          <IconButton
            size="small"
            onClick={copy}
            className="row-copy"
            sx={{ opacity: { xs: 1, md: 0 }, transition: "opacity 0.15s", color: "text.secondary" }}
          >
            <ContentCopy sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}

function ProfileSkeleton() {
  return (
    <Box sx={{ p: 3 }}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Stack key={i} direction="row" gap={1.5} py={1} alignItems="center">
          <Skeleton variant="rounded" width={32} height={32} sx={{ borderRadius: "9px" }} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="35%" height={12} />
            <Skeleton variant="text" width="65%" height={18} />
          </Box>
        </Stack>
      ))}
    </Box>
  );
}

export default function ProfileDrawer({
  userId,
  actorUserId,
  onClose,
  onUserChanged,
  openInEditMode = false,
}: {
  userId: number | null;
  actorUserId: number;
  onClose: () => void;
  onUserChanged: () => void;
  /** Opened from a row's Edit action rather than from View — go straight to the
   *  form instead of parking the user on the read-only Overview tab. */
  openInEditMode?: boolean;
}) {
  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  const { data, isLoading, isFetching, isError, error, refetch } = useGetUserProfileQuery(
    userId as number,
    { skip: userId === null },
  );
  const profile = data?.profile;

  // Always land on Overview for a newly opened user rather than whatever tab
  // the previously inspected user was left on.
  useEffect(() => {
    setTab(0);
    setEditOpen(false);
  }, [userId]);

  // The dialog is prefilled from `profile`, so it can only be raised once that
  // has arrived — opening it against an empty profile would render blank fields
  // and then reset them underneath whatever the user had started typing.
  const profileLoaded = Boolean(profile) && profile?.userId === userId;

  useEffect(() => {
    if (openInEditMode && profileLoaded) setEditOpen(true);
  }, [openInEditMode, profileLoaded]);

  const errorMessage =
    (error as { data?: { message?: string } } | undefined)?.data?.message ??
    "This profile could not be loaded.";

  const hierarchy = profile
    ? [profile.verticalName, profile.functionName, profile.domainName, profile.subDomainName]
        .filter(Boolean)
        .join(" › ")
    : "";

  return (
    <>
      <Drawer
        anchor="right"
        open={userId !== null}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: 440 },
            maxWidth: "100%",
            borderRadius: { xs: 0, sm: "18px 0 0 18px" },
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            pt: 3,
            pb: 2.5,
            flexShrink: 0,
            position: "relative",
            borderBottom: "1px solid",
            borderColor: "divider",
            background: isDark
              ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.16)} 0%, ${alpha(
                  theme.palette.background.paper,
                  0.4,
                )} 100%)`
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
                  theme.palette.primary.main,
                  0.02,
                )} 100%)`,
          }}
        >
          <Stack direction="row" gap={0.75} sx={{ position: "absolute", top: 12, right: 12 }}>
            {profile && (
              <Tooltip title="Edit user">
                <IconButton
                  onClick={() => setEditOpen(true)}
                  size="small"
                  sx={{
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                    "&:hover": { bgcolor: "background.paper" },
                  }}
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Close">
              <IconButton
                onClick={onClose}
                size="small"
                sx={{
                  bgcolor: "background.paper",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": { bgcolor: "background.paper" },
                }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>

          {isLoading && !profile ? (
            <Stack alignItems="center" gap={1.5}>
              <Skeleton variant="circular" width={84} height={84} />
              <Skeleton variant="text" width={160} height={26} />
              <Skeleton variant="text" width={110} height={16} />
            </Stack>
          ) : profile ? (
            <Stack alignItems="center" gap={1.5}>
              <Avatar
                sx={{
                  width: 84,
                  height: 84,
                  fontSize: 28,
                  fontWeight: 700,
                  bgcolor: getAvatarColor(String(profile.userId)),
                  border: "4px solid",
                  borderColor: "background.paper",
                  boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.4)" : "0 8px 24px rgba(15,23,42,0.15)",
                }}
              >
                {getInitials(profile.employeeName)}
              </Avatar>
              <Box textAlign="center" sx={{ maxWidth: "100%" }}>
                <Typography sx={{ fontSize: 18, fontWeight: 800, color: "text.primary" }} noWrap>
                  {profile.employeeName}
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: "text.secondary" }} noWrap>
                  {profile.designation ?? profile.functionName ?? "—"}
                </Typography>
              </Box>
              <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="center">
                <RoleBadge role={profile.roleCode} />
                <StatusBadge status={profile.employeeStatus === "ACTIVE" ? "Active" : "Inactive"} />
              </Stack>
            </Stack>
          ) : null}
        </Box>

        {/* A background refresh (after an edit) keeps the current content on
            screen under a thin progress bar rather than blanking the drawer. */}
        <Box sx={{ height: 3, flexShrink: 0 }}>
          {isFetching && !isLoading && <LinearProgress sx={{ height: 3 }} />}
        </Box>

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{
            flexShrink: 0,
            borderBottom: "1px solid",
            borderColor: "divider",
            minHeight: 42,
            "& .MuiTab-root": { minHeight: 42, textTransform: "none", fontWeight: 600, fontSize: 13 },
          }}
        >
          <Tab label="Overview" />
          <Tab label={`Permissions${data ? ` (${data.permissions.length})` : ""}`} />
          <Tab label="Sessions" />
        </Tabs>

        <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {isError && (
            <Box sx={{ p: 3 }}>
              <Alert
                severity="error"
                variant="outlined"
                sx={{ borderRadius: "10px", fontSize: 12.5 }}
                action={
                  <Button size="small" color="inherit" onClick={() => refetch()}>
                    Retry
                  </Button>
                }
              >
                {errorMessage}
              </Alert>
            </Box>
          )}

          {isLoading && !profile && !isError && <ProfileSkeleton />}

          {profile && tab === 0 && (
            <Box sx={{ p: 3 }}>
              <InfoRow icon={Person} label="OLM ID" value={profile.olmid} copyable />
              <InfoRow icon={Email} label="Email" value={profile.emailId} copyable />
              <InfoRow icon={Phone} label="Phone" value={profile.mobileNo ?? "—"} copyable />
              <InfoRow icon={AccountTree} label="Organisation" value={hierarchy || "—"} />
              <InfoRow
                icon={Business}
                label="Department"
                value={
                  [profile.verticalName, profile.functionName].filter(Boolean).join(" · ") || "—"
                }
              />
              <InfoRow
                icon={Work}
                label="Employment Type"
                value={
                  [profile.employmentType, profile.jobLevel].filter(Boolean).join(" · ") || "—"
                }
              />
              <InfoRow
                icon={CalendarMonth}
                label="Joining Date"
                value={profile.dateOfJoining ? dayjs(profile.dateOfJoining).format("DD MMM YYYY") : "—"}
              />
              <InfoRow
                icon={History}
                label="Last Login"
                value={
                  profile.lastLogin ? dayjs(profile.lastLogin).format("DD MMM YYYY, hh:mm A") : "—"
                }
              />
            </Box>
          )}

          {profile && tab === 1 && (
            <Box sx={{ p: 3 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", mb: 1.5 }}>
                GRANTED PERMISSIONS ({profile.roleCode ? profile.roleCode.replaceAll("_", " ") : "no role"})
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {(data?.permissions ?? []).length === 0 ? (
                  <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                    No permissions assigned.
                  </Typography>
                ) : (
                  data!.permissions.map((p, i) => (
                    <Chip
                      key={`${p.moduleName}-${p.subModuleName}-${p.permissionName}-${i}`}
                      icon={<Shield sx={{ fontSize: 14 }} />}
                      label={`${p.subModuleName} · ${p.permissionName}`}
                      size="small"
                      title={p.moduleName}
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, isDark ? 0.18 : 0.1),
                        color: isDark ? theme.palette.primary.light : theme.palette.primary.dark,
                        fontWeight: 600,
                        "& .MuiChip-icon": { color: "inherit" },
                      }}
                    />
                  ))
                )}
              </Stack>
            </Box>
          )}

          {profile && tab === 2 && (
            <Box sx={{ p: 3 }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: "text.secondary", mb: 1.5 }}>
                RECENT LOGIN ACTIVITY
              </Typography>
              <Stack gap={0}>
                {(data?.loginHistory ?? []).length === 0 ? (
                  <Typography sx={{ fontSize: 13, color: "text.secondary" }}>
                    No recorded sessions.
                  </Typography>
                ) : (
                  data!.loginHistory.map((s, i) => (
                    <Box key={s.id}>
                      <Stack direction="row" gap={1.5} py={1.25} alignItems="flex-start">
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "8px",
                            bgcolor: "action.hover",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          {s.status === "LOGIN" ? (
                            <Login sx={{ fontSize: 14, color: "success.main" }} />
                          ) : (
                            <Logout sx={{ fontSize: 14, color: "text.secondary" }} />
                          )}
                        </Box>
                        <Box>
                          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.primary" }}>
                            {s.status === "LOGIN" ? "Logged in" : "Logged out"}
                          </Typography>
                          <Typography sx={{ fontSize: 11.5, color: "text.secondary" }}>
                            {dayjs(s.loginTime).format("DD MMM YYYY, hh:mm A")}
                            {s.logoutTime && ` → ${dayjs(s.logoutTime).format("hh:mm A")}`}
                          </Typography>
                        </Box>
                      </Stack>
                      {i < data!.loginHistory.length - 1 && <Divider />}
                    </Box>
                  ))
                )}
              </Stack>
            </Box>
          )}
        </Box>
      </Drawer>

      {/* Rendered as a sibling of the Drawer, not a child: a Dialog nested
          inside the Drawer's modal ends up fighting it for the focus trap, so
          fields could not be typed into reliably. */}
      {profile && (
        <CreateEditMemberDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            // The mutation already invalidates this profile and the directory
            // list; refetch keeps the open drawer honest even if the tag ever
            // stops matching.
            refetch();
            onUserChanged();
          }}
          actorUserId={actorUserId}
          mode="edit"
          editData={profile}
        />
      )}
    </>
  );
}
