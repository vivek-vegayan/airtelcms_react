import {
  Dashboard,
  Event,
  AssignmentTurnedIn,
  CheckCircleRounded,
  ArrowForwardRounded,
} from "@mui/icons-material";
import {
  Box,
  Fade,
  styled,
  Typography,
  useTheme,
  Stack,
  keyframes,
  alpha,
  useMediaQuery,
  ButtonBase,
} from "@mui/material";
import { CRQSubmission } from "./components/Crqsubmission";
import { Slotassignmentviewnew } from "./components/Slotassignmentviewnew";
// import { Planningviewcontent } from "./components/Planningviewcontent";
import { memo, useCallback, useState } from "react";
import React from "react";
import CommonContainer from "../../../../components/common/CommonContainer";
import Planningviewcontent from "./components/Planningviewcontent";

// ── Animations ────────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const scaleIn = keyframes`
  from { opacity: 0; transform: scale(0.97); }
  to   { opacity: 1; transform: scale(1); }
`;

const breathe = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.25); }
  50%      { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
`;

// ── Design tokens ─────────────────────────────────────────────────────────────

const ACCENT = {
  light: {
    primary: "#4F46E5",
    primarySoft: "#EEF2FF",
    primaryMedium: "#C7D2FE",
    gradient: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
    gradientSubtle: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)",
    surface: "#FFFFFF",
    surfaceElevated: "#FAFAFE",
    border: "#E5E7EB",
    borderActive: "#C7D2FE",
    text: "#111827",
    textSecondary: "#6B7280",
    textMuted: "#9CA3AF",
    shadow: "0 1px 3px rgba(0,0,0,0.04), 0 4px 24px rgba(0,0,0,0.06)",
    shadowElevated: "0 4px 6px rgba(0,0,0,0.03), 0 12px 40px rgba(0,0,0,0.08)",
    dotTrack: "#E5E7EB",
  },
  dark: {
    primary: "#818CF8",
    primarySoft: "rgba(129, 140, 248, 0.1)",
    primaryMedium: "rgba(129, 140, 248, 0.25)",
    gradient: "linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)",
    gradientSubtle:
      "linear-gradient(135deg, rgba(129,140,248,0.08) 0%, rgba(167,139,250,0.06) 100%)",
    surface: "#1E1E2E",
    surfaceElevated: "#252538",
    border: "rgba(255,255,255,0.08)",
    borderActive: "rgba(129, 140, 248, 0.3)",
    text: "#F3F4F6",
    textSecondary: "#9CA3AF",
    textMuted: "#6B7280",
    shadow: "0 1px 3px rgba(0,0,0,0.2), 0 4px 24px rgba(0,0,0,0.3)",
    shadowElevated: "0 4px 6px rgba(0,0,0,0.15), 0 12px 40px rgba(0,0,0,0.35)",
    dotTrack: "rgba(255,255,255,0.1)",
  },
};

// ── Step Rail (vertical side navigation) ──────────────────────────────────────

const StepRail = styled(Box)(({ theme }) => {
  const t = theme.palette.mode === "dark" ? ACCENT.dark : ACCENT.light;
  return {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    padding: theme.spacing(2, 1.5),
    borderRadius: 16,
    background: t.gradientSubtle,
    border: `1px solid ${t.border}`,
    minWidth: 210,
    position: "relative",
    backdropFilter: "blur(12px)",
    [theme.breakpoints.down("md")]: {
      flexDirection: "row",
      minWidth: "unset",
      overflowX: "auto",
      padding: theme.spacing(1, 1),
      gap: 6,
      borderRadius: 14,
    },
  };
});

// ── Individual step button ────────────────────────────────────────────────────

const StepButton = styled(ButtonBase)<{
  stepactive: string;
  stepcompleted: string;
}>(({ theme, stepactive, stepcompleted }) => {
  const t = theme.palette.mode === "dark" ? ACCENT.dark : ACCENT.light;
  const isActive = stepactive === "true";
  const isCompleted = stepcompleted === "true";

  return {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "10px 14px",
    borderRadius: 12,
    textAlign: "left",
    transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",
    overflow: "hidden",

    background: isActive ? t.surface : "transparent",
    border: `1.5px solid ${isActive ? t.borderActive : "transparent"}`,
    boxShadow: isActive ? t.shadow : "none",

    "&::before": isActive
      ? {
          content: '""',
          position: "absolute",
          left: 0,
          top: "50%",
          transform: "translateY(-50%)",
          width: 3,
          height: "60%",
          borderRadius: 4,
          background: t.gradient,
        }
      : {},

    "&:hover": {
      background: isActive ? t.surface : alpha(t.primary, 0.05),
      transform: "translateX(2px)",
    },

    [theme.breakpoints.down("md")]: {
      flexDirection: "column",
      gap: 6,
      padding: "10px 16px",
      minWidth: 100,
      textAlign: "center",
      "&:hover": {
        transform: "translateY(-2px)",
      },
      "&::before": isActive
        ? {
            content: '""',
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 0,
            top: "unset",
            width: "60%",
            height: 3,
            borderRadius: 4,
            background: t.gradient,
          }
        : {},
    },
  };
});

// ── Icon container ────────────────────────────────────────────────────────────

const IconBadge = styled(Box)<{
  stepactive: string;
  stepcompleted: string;
}>(({ theme, stepactive, stepcompleted }) => {
  const t = theme.palette.mode === "dark" ? ACCENT.dark : ACCENT.light;
  const isActive = stepactive === "true";
  const isCompleted = stepcompleted === "true";

  return {
    width: 36,
    height: 36,
    minWidth: 36,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    position: "relative",

    ...(isActive && {
      background: t.gradient,
      color: "#fff",
      animation: `${breathe} 2.5s ease-in-out infinite`,
    }),
    ...(isCompleted &&
      !isActive && {
        background: alpha(t.primary, 0.12),
        color: t.primary,
      }),
    ...(!isActive &&
      !isCompleted && {
        background:
          theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : "#F3F4F6",
        color: t.textMuted,
      }),

    "& .MuiSvgIcon-root": {
      fontSize: "1.1rem",
    },
  };
});

// ── Progress connector (vertical dots between steps) ──────────────────────────

const VerticalConnector = styled(Box)<{ completed: string }>(({
  theme,
  completed,
}) => {
  const t = theme.palette.mode === "dark" ? ACCENT.dark : ACCENT.light;
  const isCompleted = completed === "true";
  return {
    width: 2,
    height: 20,
    marginLeft: 31, // center under icon
    borderRadius: 2,
    background: isCompleted ? t.primary : t.dotTrack,
    transition: "background 0.4s ease",
    [theme.breakpoints.down("md")]: {
      display: "none",
    },
  };
});

// ── Content panel ─────────────────────────────────────────────────────────────

const ContentPanel = styled(Box)(({ theme }) => {
  const t = theme.palette.mode === "dark" ? ACCENT.dark : ACCENT.light;
  return {
    flex: 1,
    borderRadius: 16,
    background: t.surface,
    border: `1px solid ${t.border}`,
    boxShadow: t.shadow,
    overflow: "hidden",
    animation: `${scaleIn} 0.35s cubic-bezier(0.4, 0, 0.2, 1)`,
    position: "relative",
  };
});

// ── Breadcrumb header inside content panel ────────────────────────────────────

const ContentHeader = styled(Box)(({ theme }) => {
  const t = theme.palette.mode === "dark" ? ACCENT.dark : ACCENT.light;
  return {
    padding: theme.spacing(1.5, 2),
    display: "flex",
    alignItems: "center",
    gap: 8,
    borderBottom: `1px solid ${t.border}`,
    background:
      theme.palette.mode === "dark"
        ? "rgba(255,255,255,0.02)"
        : "rgba(0,0,0,0.01)",
  };
});

// ── Step number badge (small) ─────────────────────────────────────────────────

const StepNumberChip = styled(Box)(({ theme }) => {
  const t = theme.palette.mode === "dark" ? ACCENT.dark : ACCENT.light;
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 22,
    height: 22,
    borderRadius: 7,
    fontSize: "0.7rem",
    fontWeight: 700,
    background: t.gradient,
    color: "#fff",
    letterSpacing: "0.02em",
  };
});

// ── Step configuration ────────────────────────────────────────────────────────

const STEP_CONFIG = [
  {
    label: "Plan",
    description: "Create & define task plan",
    icon: <Dashboard />,
    component: () => <Planningviewcontent />,
  },
  {
    label: "Slot Assignment",
    description: "Pick a time slot",
    icon: <Event />,
    component: () => <Slotassignmentviewnew />,
  },
  {
    label: "CRQ Submission",
    description: "Submit change request",
    icon: <AssignmentTurnedIn />,
    component: () => <CRQSubmission />,
  },
];

// ── Main Component ────────────────────────────────────────────────────────────

export const TaskPlanningViewMain: React.FC = memo(() => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const t = theme.palette.mode === "dark" ? ACCENT.dark : ACCENT.light;

  const [activeStep, setActiveStep] = useState(0);
  const [maxCompletedStep, setMaxCompletedStep] = useState(0);

  const handleStepClick = useCallback((index: number) => {
    setActiveStep(index);
  }, []);

  const ActiveComponent = STEP_CONFIG[activeStep].component;

  return (
    <>
      <Stack
        direction={isMobile ? "column" : "row"}
        spacing={isMobile ? 1.5 : 2}
        sx={{ minHeight: 0 }}
      >
        {/* ── Step Rail (sidebar / top bar) ── */}
        <StepRail>
          {/* Header */}
          <Box
            sx={{
              // px: 1,
              // pb: 1.5,
              // mb: 0.5,
              borderBottom: `1px solid ${t.border}`,
              display: isMobile ? "none" : "block",
            }}
          >
            <Typography
              sx={{
                fontSize: "0.65rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: t.textMuted,
              }}
            >
              Progress
            </Typography>
            {/* Mini progress bar */}
            <Box
              sx={{
                // mt: 1,
                height: 4,
                borderRadius: 4,
                background: t.dotTrack,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  width: `${((activeStep + 1) / STEP_CONFIG.length) * 100}%`,
                  borderRadius: 4,
                  background: t.gradient,
                  transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </Box>
            <Typography
              sx={{
                fontSize: "0.65rem",
                color: t.textMuted,
                mt: 0.5,
                fontWeight: 500,
              }}
            >
              Step {activeStep + 1} of {STEP_CONFIG.length}
            </Typography>
          </Box>

          {STEP_CONFIG.map((config, index) => {
            const isActive = activeStep === index;
            const isCompleted = index < maxCompletedStep;
            return (
              <React.Fragment key={config.label}>
                <StepButton
                  stepactive={String(isActive)}
                  stepcompleted={String(isCompleted)}
                  onClick={() => handleStepClick(index)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Go to step ${index + 1}: ${config.label}`}
                  disableRipple
                >
                  <IconBadge
                    stepactive={String(isActive)}
                    stepcompleted={String(isCompleted)}
                  >
                    {isCompleted && !isActive ? (
                      <CheckCircleRounded sx={{ fontSize: "1.1rem" }} />
                    ) : (
                      config.icon
                    )}
                  </IconBadge>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: "0.8rem",
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? t.primary : t.text,
                        lineHeight: 1.3,
                        transition: "color 0.25s ease",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {config.label}
                    </Typography>
                    {!isMobile && (
                      <Typography
                        sx={{
                          fontSize: "0.65rem",
                          color: isActive ? alpha(t.primary, 0.7) : t.textMuted,
                          lineHeight: 1.3,
                          mt: 0.25,
                          transition: "color 0.25s ease",
                        }}
                      >
                        {config.description}
                      </Typography>
                    )}
                  </Box>

                  {isActive && !isMobile && (
                    <ArrowForwardRounded
                      sx={{
                        fontSize: "0.9rem",
                        color: t.primary,
                        opacity: 0.6,
                      }}
                    />
                  )}
                </StepButton>

                {/* Vertical connector */}
                {index < STEP_CONFIG.length - 1 && !isMobile && (
                  <VerticalConnector completed={String(isCompleted)} />
                )}
              </React.Fragment>
            );
          })}
        </StepRail>

        {/* ── Content area ── */}
        <Fade in timeout={300} key={`content-${activeStep}`}>
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <ContentPanel key={activeStep}>
              {/* Panel header */}
              <ContentHeader>
                <StepNumberChip>{activeStep + 1}</StepNumberChip>
                <Box>
                  <Typography
                    sx={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: t.text,
                      lineHeight: 1.3,
                    }}
                  >
                    {STEP_CONFIG[activeStep].label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.65rem",
                      color: t.textSecondary,
                      lineHeight: 1.3,
                    }}
                  >
                    {STEP_CONFIG[activeStep].description}
                  </Typography>
                </Box>
              </ContentHeader>

              {/* Panel body */}
              <Box
                sx={{
                  p: { xs: 0.5, md:0.5 },
                  animation: `${fadeUp} 0.35s ease`,
                }}
              >
                <ActiveComponent />
              </Box>
            </ContentPanel>
          </Box>
        </Fade>
      </Stack>
    </>
  );
});

export default TaskPlanningViewMain;
