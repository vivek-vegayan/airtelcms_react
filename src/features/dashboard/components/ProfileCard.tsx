import type { ElementType } from "react";
import { Box, Card, Skeleton, Typography } from "@mui/material";
import { Email, Phone, CalendarMonth, History } from "@mui/icons-material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import dayjs from "dayjs";
import type { Colors } from "../types/colorTypes";
import { fadeIn, getCardSx } from "../constants/dashboard.styles";
import { RadialProgress } from "./RadialProgress";
import { getAvatarColor, getInitials } from "../../userManagement/utils/userHelpers";
import type { UserProfile } from "../../userManagement/api/userManagementApi";
import type { DashboardProfileStatus } from "../hooks/useDashboardProfile";

export interface ProfileCardStats {
  doneCount: number;
  totalTasks: number;
  progressPct: number;
  wfMode: string;
}

interface ProfileCardProps {
  status: DashboardProfileStatus;
  profile?: UserProfile;
  errorMessage?: string;
  /** Compact fits a narrow sidebar rail; detailed shows contact/org info by default. */
  mode?: "compact" | "detailed";
  showAvatar?: boolean;
  showOrganization?: boolean;
  showContactDetails?: boolean;
  /** Optional task-progress footer — dashboard-specific, unrelated to profile data. */
  stats?: ProfileCardStats;
  colors: Colors;
  mounted: boolean;
  delay: number;
}

function ContactRow({ icon: Icon, value }: { icon: ElementType; value: string }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <Icon sx={{ fontSize: 12, color: "rgba(199,210,254,.55)" }} />
      <Typography sx={{ fontSize: 10, color: "rgba(199,210,254,.75)" }} noWrap>
        {value}
      </Typography>
    </Box>
  );
}

function IdentitySkeleton() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: "12px", position: "relative", zIndex: 1 }}>
      <Skeleton variant="circular" width={46} height={46} sx={{ bgcolor: "rgba(255,255,255,.1)" }} />
      <Box sx={{ flex: 1 }}>
        <Skeleton variant="text" width="70%" height={20} sx={{ bgcolor: "rgba(255,255,255,.1)" }} />
        <Skeleton variant="text" width="50%" height={14} sx={{ bgcolor: "rgba(255,255,255,.08)" }} />
        <Skeleton variant="rounded" width={90} height={16} sx={{ mt: "6px", borderRadius: "20px", bgcolor: "rgba(255,255,255,.08)" }} />
      </Box>
    </Box>
  );
}

export function ProfileCard({
  status,
  profile,
  errorMessage,
  mode = "compact",
  showAvatar = true,
  showOrganization = true,
  showContactDetails = mode === "detailed",
  stats,
  colors,
  mounted,
  delay,
}: ProfileCardProps) {
  const organizationLine = profile
    ? [profile.verticalName, profile.functionName, profile.domainName].filter(Boolean).join(" · ")
    : "";

  const statCells = stats
    ? [
        { v: stats.doneCount, l: "Done" },
        { v: stats.totalTasks - stats.doneCount, l: "Remaining" },
        { v: stats.wfMode, l: "Mode" },
      ]
    : [];

  return (
    <Card
      sx={{
        ...getCardSx(colors),
        overflow: "hidden",
        minWidth: 0,
        ...fadeIn(mounted, delay),
      }}
    >
      <Box
        sx={{
          background: "linear-gradient(130deg,#1e1b4b 0%,#312e81 60%,#4338ca 100%)",
          p: "20px 16px 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ position: "absolute", top: -40, right: -20, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.04)" }} />
        <Box sx={{ position: "absolute", top: 10, right: 50, width: 55, height: 55, borderRadius: "50%", background: "rgba(165,180,252,.09)" }} />

        {status === "loading" && (
          <Box sx={{ pb: "14px" }}>
            <IdentitySkeleton />
          </Box>
        )}

        {status === "error" && (
          <Box sx={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", py: "22px" }}>
            <ErrorOutlineIcon sx={{ fontSize: 24, color: "#fca5a5" }} />
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "#fca5a5", textAlign: "center" }}>
              {errorMessage}
            </Typography>
          </Box>
        )}

        {status === "empty" && (
          <Box sx={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", py: "22px" }}>
            <PersonOffIcon sx={{ fontSize: 24, color: "rgba(199,210,254,.6)" }} />
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "rgba(199,210,254,.6)", textAlign: "center" }}>
              Profile unavailable
            </Typography>
          </Box>
        )}

        {status === "ready" && profile && (
          <Box sx={{ pb: "14px" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: "12px", position: "relative", zIndex: 1 }}>
              {showAvatar && (
                <Box sx={{ position: "relative", flexShrink: 0 }}>
                  <Box
                    sx={{
                      width: 46,
                      height: 46,
                      borderRadius: "50%",
                      background: getAvatarColor(String(profile.userId)),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 900,
                      color: "#fff",
                      boxShadow: "0 0 0 3px rgba(255,255,255,.18)",
                    }}
                  >
                    {getInitials(profile.employeeName)}
                  </Box>
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 1,
                      right: 1,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: profile.employeeStatus === "ACTIVE" ? colors.success : colors.danger,
                      border: "2px solid #1e1b4b",
                    }}
                  />
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 900, color: "#fff", letterSpacing: "-0.3px" }} noWrap>
                  {profile.employeeName}
                </Typography>
                <Typography sx={{ fontSize: 10, color: "rgba(199,210,254,.65)", mt: 0.3 }} noWrap>
                  {profile.designation ?? profile.functionName ?? "—"}
                </Typography>
                <Box sx={{ display: "inline-flex", alignItems: "center", maxWidth: "100%", gap: "4px", mt: "6px", background: "rgba(255,255,255,.1)", borderRadius: "20px", px: "8px", py: "2px" }}>
                  <Box sx={{ width: 5, height: 5, borderRadius: "50%", flexShrink: 0, background: profile.employeeStatus === "ACTIVE" ? colors.success : colors.danger }} />
                  <Typography sx={{ fontSize: 9, fontWeight: 700, color: "rgba(199,210,254,.8)", letterSpacing: ".4px" }} noWrap>
                    {profile.employeeStatus} · {profile.olmid}
                  </Typography>
                </Box>
              </Box>
              {stats && (
                <Box sx={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <RadialProgress value={stats.doneCount} max={stats.totalTasks} color={colors.accentLight} />
                  <Box sx={{ position: "absolute", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                      {Math.round(stats.progressPct)}%
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {showOrganization && organizationLine && (
              <Typography sx={{ fontSize: 10, color: "rgba(199,210,254,.5)", mt: "10px", position: "relative", zIndex: 1 }} noWrap>
                {organizationLine}
              </Typography>
            )}

            {showContactDetails && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: "6px", mt: "12px", position: "relative", zIndex: 1 }}>
                <ContactRow icon={Email} value={profile.emailId} />
                {profile.mobileNo && <ContactRow icon={Phone} value={profile.mobileNo} />}
                {profile.dateOfJoining && (
                  <ContactRow icon={CalendarMonth} value={`Joined ${dayjs(profile.dateOfJoining).format("DD MMM YYYY")}`} />
                )}
                {profile.lastLogin && (
                  <ContactRow icon={History} value={`Last login ${dayjs(profile.lastLogin).format("DD MMM, hh:mm A")}`} />
                )}
              </Box>
            )}
          </Box>
        )}

        {stats && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              // Cancels the hero band's 16px side padding — the divider spans
              // the full card width instead of stopping short of both edges.
              mx: "-16px",
              borderTop: "1px solid rgba(255,255,255,.08)",
            }}
          >
            {statCells.map((s, i) => (
              <Box
                key={s.l}
                sx={{
                  textAlign: "center",
                  py: "9px",
                  px: "4px",
                  minWidth: 0,
                  borderRight: i < statCells.length - 1 ? "1px solid rgba(255,255,255,.08)" : "none",
                }}
              >
                <Typography sx={{ fontSize: 15, fontWeight: 800, color: "#fff", lineHeight: 1 }} noWrap>
                  {s.v}
                </Typography>
                <Typography
                  sx={{ fontSize: 9, fontWeight: 700, color: "rgba(199,210,254,.5)", mt: "3px", letterSpacing: ".5px", textTransform: "uppercase" }}
                  noWrap
                >
                  {s.l}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {stats && (
        <Box sx={{ p: "12px 16px 14px" }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: "6px" }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: colors.textSecondary, letterSpacing: ".5px", textTransform: "uppercase" }}>
              Task Progress
            </Typography>
            <Typography sx={{ fontSize: 10, fontWeight: 700, color: colors.accent }}>
              {stats.doneCount} of {stats.totalTasks}
            </Typography>
          </Box>
          <Box sx={{ height: 5, background: colors.surface2, borderRadius: "99px", overflow: "hidden" }}>
            <Box
              sx={{
                height: "100%",
                borderRadius: "99px",
                background: `linear-gradient(90deg,${colors.accent},#8b5cf6)`,
                width: `${stats.progressPct}%`,
                transition: "width 1.2s cubic-bezier(.4,0,.2,1)",
              }}
            />
          </Box>
          <Typography sx={{ fontSize: 10, color: colors.textSecondary, mt: "5px" }}>
            {Math.round(stats.progressPct)}% complete
          </Typography>
        </Box>
      )}
    </Card>
  );
}
