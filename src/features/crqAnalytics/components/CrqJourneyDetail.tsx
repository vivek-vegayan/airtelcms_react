import { Box, Chip, Divider, IconButton, Skeleton, Tooltip, Typography, useTheme } from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import RefreshRoundedIcon from "@mui/icons-material/Refresh";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import { useGetCrqDetailQuery } from "../api/crqAnalyticsApi";
import { EmptyOrErrorState } from "./EmptyOrErrorState";
import type { CRQTimelineStepDto } from "../types/crqAnalytics.types";

interface Props {
  crqNo: string;
  onBack: () => void;
}

// ─── Journey timeline ───────────────────────────────────────────────────────

function JourneyTimeline({ steps, isDark }: { steps: CRQTimelineStepDto[]; isDark: boolean }) {
  const colors = {
    completed: "#22c55e",
    active: "#3b82f6",
    rejected: "#ef4444",
    pending: isDark ? "#334155" : "#e2e8f0",
  };

  return (
    <Box sx={{ position: "relative", py: 0.5, overflowX: "auto" }}>
      {/* Connector line behind the step circles */}
      <Box
        sx={{
          position: "absolute",
          top: 22,
          left: "7%",
          right: "7%",
          height: 4,
          borderRadius: 10,
          background: isDark ? "linear-gradient(90deg,#1e293b,#334155)" : "linear-gradient(90deg,#dbeafe,#cbd5e1)",
          zIndex: 0,
        }}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(steps.length, 1)}, minmax(120px,1fr))`,
          gap: 1,
          position: "relative",
          zIndex: 1,
        }}
      >
        {steps.map((step) => {
          const isCompleted = step.status === "completed";
          const isActive = step.status === "active";
          const isRejected = step.status === "rejected";

          const circleColor = isCompleted
            ? colors.completed
            : isActive
              ? colors.active
              : isRejected
                ? colors.rejected
                : colors.pending;

          const labelColor = isCompleted
            ? colors.completed
            : isActive
              ? colors.active
              : isRejected
                ? colors.rejected
                : isDark
                  ? "#94a3b8"
                  : "#64748b";

          return (
            <Box
              key={step.stepNo}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                transition: "all .25s ease",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: isCompleted
                    ? "linear-gradient(135deg,#22c55e,#16a34a)"
                    : isActive
                      ? "linear-gradient(135deg,#60a5fa,#2563eb)"
                      : isRejected
                        ? "linear-gradient(135deg,#f87171,#dc2626)"
                        : isDark
                          ? "#1e293b"
                          : "#ffffff",
                  border: `2px solid ${circleColor}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isCompleted || isActive || isRejected ? `0 0 18px ${circleColor}55` : "0 4px 10px rgba(0,0,0,.08)",
                  transition: "all .3s ease",
                }}
              >
                {isCompleted ? (
                  <CheckIcon sx={{ color: "#fff", fontSize: 15 }} />
                ) : isRejected ? (
                  <CloseIcon sx={{ color: "#fff", fontSize: 15 }} />
                ) : (
                  <Typography sx={{ fontWeight: 800, fontSize: 12, color: isDark ? "#fff" : "#1e293b" }}>{step.stepNo}</Typography>
                )}
              </Box>

              <Chip
                size="small"
                label={step.status.toUpperCase()}
                sx={{
                  mt: 0.7,
                  height: 18,
                  fontSize: 8,
                  fontWeight: 700,
                  bgcolor: `${circleColor}20`,
                  color: circleColor,
                  border: `1px solid ${circleColor}55`,
                }}
              />

              <Typography
                sx={{
                  mt: 1.2,
                  px: 0.5,
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 600,
                  color: labelColor,
                  lineHeight: 1.45,
                  maxWidth: 110,
                  minHeight: 32,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {step.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// ─── Section card wrapper ───────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  isDark,
  extra,
  children,
}: {
  title: string;
  subtitle?: string;
  isDark: boolean;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box
      sx={{
        width: "100%",
        background: isDark ? "linear-gradient(180deg,#0d1b2e,#08111d)" : "linear-gradient(180deg,#ffffff,#fafcff)",
        border: `1px solid ${isDark ? "rgba(99,130,180,0.15)" : "rgba(226,232,240,0.9)"}`,
        borderRadius: 3,
        p: 2,
        boxShadow: isDark ? "0 12px 30px rgba(0,0,0,.35)" : "0 12px 35px rgba(15,23,42,.08)",
        transition: "all .25s ease",
        "&:hover": { transform: "translateY(-2px)" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: 16, fontWeight: 800, color: isDark ? "#fff" : "#1e293b" }}>{title}</Typography>
          {subtitle && <Typography sx={{ fontSize: 12, color: isDark ? "#64748b" : "#94a3b8", mt: 0.5 }}>{subtitle}</Typography>}
        </Box>
        {extra}
      </Box>
      {children}
    </Box>
  );
}

// ─── Detail row ─────────────────────────────────────────────────────────────

function DetailRow({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
  return (
    <Box
      sx={{
        p: 1,
        borderRadius: 1.5,
        bgcolor: isDark ? "rgba(255,255,255,.03)" : "#f8fafc",
        border: `1px solid ${isDark ? "rgba(255,255,255,.05)" : "#e2e8f0"}`,
      }}
    >
      <Typography
        sx={{ fontSize: 9, color: isDark ? "#94a3b8" : "#64748b", mb: 0.25, textTransform: "uppercase", letterSpacing: ".05em" }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: isDark ? "#fff" : "#0f172a", lineHeight: 1.2 }}>{value || "—"}</Typography>
    </Box>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

/** Full-screen CRQ Journey detail — opened by clicking a CRQ row in the
 * analytics drill-down table. Renders only what GET /crq-analytics-new/crqs/
 * {changeId} still returns (main fields + timeline). */
export function CrqJourneyDetail({ crqNo, onBack }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";
  const { data: d, isFetching, isError, refetch } = useGetCrqDetailQuery(crqNo);

  const text = isDark ? "#e2e8f0" : "#1e293b";
  const muted = isDark ? "#64748b" : "#94a3b8";
  const notFound = d?.status === "NOT_FOUND";

  const flags = d
    ? ([
        ["B2B", d.flagB2B],
        ["SA", d.flagSA],
        ["Core Node", d.flagCoreNode],
        ["NSA", d.flagNSA],
      ] as const).filter(([, on]) => on)
    : [];

  const hasFieldEngineer = !!(d?.fieldEngineerName || d?.fieldEngineerMobile || d?.fieldEngineerEmail);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {/* ─ Top bar ─ */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
          pb: 1.25,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={onBack} size="small">
            <ArrowBackRoundedIcon fontSize="small" />
          </IconButton>
          <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
          <Box>
            <Typography sx={{ fontSize: 9.5, color: muted, letterSpacing: "0.06em" }}>CRQ › Analytics › CRQ Details</Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.02em", color: text }}>CRQ Journey</Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          {d?.lastUpdated && <Typography sx={{ fontSize: 10.5, color: muted }}>Last updated: {d.lastUpdated}</Typography>}
          <Tooltip title="Refresh">
            <span>
              <IconButton size="small" onClick={() => refetch()} disabled={isFetching}>
                <RefreshRoundedIcon sx={{ fontSize: 17 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      {isFetching && !d && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Skeleton variant="rounded" height={70} />
          <Skeleton variant="rounded" height={160} />
          <Skeleton variant="rounded" height={220} />
        </Box>
      )}

      {isError && !isFetching && <EmptyOrErrorState kind="error" message={`Couldn't load ${crqNo}.`} />}

      {notFound && !isFetching && <EmptyOrErrorState kind="empty" message={`No details found for ${crqNo}.`} />}

      {d && !notFound && !isError && (
        <>
          {/* ─ Title row ─ */}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: text }}>{d.title}</Typography>
              {d.impactLabel && (
                <Chip
                  size="small"
                  label={`${d.impactLabel} (${d.impactCount})`}
                  sx={{
                    bgcolor: "rgba(251,191,36,0.18)",
                    color: "#fbbf24",
                    border: "1px solid rgba(251,191,36,0.4)",
                    fontWeight: 700,
                    fontSize: 11,
                  }}
                />
              )}
              {flags.map(([label]) => (
                <Chip key={label} size="small" label={label} variant="outlined" sx={{ fontSize: 10, fontWeight: 700 }} />
              ))}
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 0.5, flexWrap: "wrap" }}>
              <Typography sx={{ fontSize: 12, color: "#dc2626", fontWeight: 700 }}>{d.crqNo}</Typography>
              <Typography sx={{ fontSize: 12, color: muted }}>·</Typography>
              <Typography sx={{ fontSize: 12, color: muted }}>{d.currentStage}</Typography>
              <Typography sx={{ fontSize: 12, color: muted }}>·</Typography>
              <Typography sx={{ fontSize: 12, color: muted }}>{d.planNo}</Typography>
            </Box>
          </Box>

          {/* ─ Journey timeline ─ */}
          <Section
            title="Journey Timeline"
            subtitle="Current CRQ execution progress"
            isDark={isDark}
            extra={
              d.progressPct != null && (
                <Chip
                  label={`${d.progressPct}% Completed`}
                  sx={{
                    height: 34,
                    px: 1,
                    bgcolor: "rgba(34,197,94,.12)",
                    color: "#16a34a",
                    border: "1px solid rgba(34,197,94,.25)",
                    fontWeight: 800,
                    fontSize: 12,
                  }}
                />
              )
            }
          >
            {d.timeline.length > 0 ? (
              <JourneyTimeline steps={d.timeline} isDark={isDark} />
            ) : (
              <EmptyOrErrorState kind="empty" message="No timeline steps recorded yet." />
            )}
          </Section>

          {/* ─ Details ─ */}
          <Section
            title="CRQ Details"
            isDark={isDark}
            extra={<Chip label={d.status} size="small" sx={{ bgcolor: "rgba(59,130,246,.12)", color: "#2563eb", fontWeight: 700 }} />}
          >
            <Typography sx={{ fontSize: 14, color: text, mb: 2, fontWeight: 600 }}>{d.title}</Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(4,1fr)" },
                gap: 2.5,
              }}
            >
              <DetailRow label="Requestor" value={d.requestor} isDark={isDark} />
              <DetailRow label="Domain" value={d.domain} isDark={isDark} />
              <DetailRow label="Category" value={d.category} isDark={isDark} />
              <DetailRow label="Scheduled" value={d.scheduledDate} isDark={isDark} />
              <DetailRow label="Circle" value={d.circle} isDark={isDark} />
              <DetailRow label="Impact" value={d.impact} isDark={isDark} />
              <DetailRow label="Plan Type" value={d.planType} isDark={isDark} />
              <DetailRow label="Execution Window" value={d.executionWindow} isDark={isDark} />
              <DetailRow label="Submit Date" value={d.submitDate} isDark={isDark} />
              <DetailRow label="Last Updated" value={d.lastUpdated} isDark={isDark} />
            </Box>

            {hasFieldEngineer && (
              <Box sx={{ mt: 2.5 }}>
                <Typography sx={{ fontSize: 11, fontWeight: 800, color: text, mb: 1 }}>Field Engineer</Typography>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(4,1fr)" },
                    gap: 2.5,
                  }}
                >
                  <DetailRow label="Name" value={d.fieldEngineerName} isDark={isDark} />
                  <DetailRow label="Mobile" value={d.fieldEngineerMobile} isDark={isDark} />
                  <DetailRow label="Email" value={d.fieldEngineerEmail} isDark={isDark} />
                </Box>
              </Box>
            )}
          </Section>
        </>
      )}
    </Box>
  );
}
