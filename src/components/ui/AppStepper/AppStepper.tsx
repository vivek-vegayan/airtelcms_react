import React from "react";
import {
  Stepper,
  Step,
  StepLabel,
  StepConnector,
  stepConnectorClasses,
  styled,
  Typography,
  Box,
  keyframes,
} from "@mui/material";
import { Check as CheckIcon } from "@mui/icons-material";
import { type AppStepperProps, type CustomStepIconProps } from "./types";

// --- 1. Animation Keyframes ---
// Creates a professional, soft pulsating ripple effect using the theme's color
const rippleAnimation = (color: string) => keyframes`
  0% {
    box-shadow: 0 0 0 0 ${color}80; /* 50% opacity */
  }
  70% {
    box-shadow: 0 0 0 10px ${color}00; /* Fade out and expand */
  }
  100% {
    box-shadow: 0 0 0 0 ${color}00;
  }
`;

// --- 2. Customized Line Connector ---
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 16, // Exactly half of the 32px icon to center the line perfectly
    left: "calc(-50% + 16px)",
    right: "calc(50% + 16px)",
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: theme.palette.secondary.main, // Emerald Green
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: theme.palette.secondary.main, // Emerald Green
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.divider,
    borderRadius: 1,
    transition: "background-color 0.4s ease-in-out",
  },
}));

// --- 3. Customized Step Icon Wrapper ---
const CustomStepIconRoot = styled("div")<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.background.paper,
  zIndex: 1,
  color: theme.palette.text.secondary,
  width: 30, // Minimal footprint
  height: 30, // Minimal footprint
  display: "flex",
  borderRadius: "50%",
  justifyContent: "center",
  alignItems: "center",
  border: `2px solid ${theme.palette.divider}`,
  transition: "all 0.3s ease-in-out",

  "& svg": {
    fontSize: "1.1rem",
  },

  //  ACTIVE STATE (Professional Pulsating Effect)
  ...(ownerState.active && {
    borderColor: theme.palette.secondary.main,
    borderWidth: 2,
    color: theme.palette.secondary.main,
    // Add a very subtle background tint inside the active circle
    backgroundColor: `${theme.palette.secondary.main}1A`, // 10% opacity
    transform: "scale(1.05)", 
    // Apply the pulsating ripple animation
    animation: `${rippleAnimation(theme.palette.secondary.main)} 2s infinite ease-in-out`,
  }),

  // COMPLETED STATE
  ...(ownerState.completed && {
    backgroundColor: theme.palette.secondary.main,
    borderColor: theme.palette.secondary.main,
    color: "#fff",
  }),
}));

function CustomStepIcon(props: CustomStepIconProps) {
  const { active, completed, customIcon } = props;

  return (
    <CustomStepIconRoot ownerState={{ completed, active }}>
      {completed ? <CheckIcon /> : customIcon}
    </CustomStepIconRoot>
  );
}

// --- 4. Main Exported Component ---
export const AppStepper: React.FC<AppStepperProps> = ({
  steps,
  activeStep,
  orientation = "horizontal",
  onStepClick,
  sx,
}) => {
  return (
    <Box sx={{ width: "100%", ...sx }}>
      <Stepper
        alternativeLabel={orientation === "horizontal"}
        activeStep={activeStep}
        orientation={orientation}
        connector={<ColorlibConnector />}
        sx={{ p: 0 }} 
      >
        {steps.map((step, index) => {
          const isActive = activeStep === index;
          const isCompleted = activeStep > index;

          return (
            <Step
              key={step.id}
              completed={isCompleted}
              disabled={step.disabled}
              onClick={() => {
                if (!step.disabled && onStepClick) {
                  onStepClick(index);
                }
              }}
              sx={{
                cursor: step.disabled ? "not-allowed" : onStepClick ? "pointer" : "default",
                px: 0,
              }}
            >
              <StepLabel
                StepIconComponent={(props) => (
                  <CustomStepIcon {...props} customIcon={step.icon} />
                )}
                sx={{
                  p: 0,
                  // Magic fix: Removes MUI's massive default 16px top margin
                  "& .MuiStepLabel-label.MuiStepLabel-alternativeLabel": {
                    marginTop: "4px",
                  },
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    lineHeight: 1.1, // Tight line-height
                    fontWeight: isActive ? 700 : 500, // Make active text slightly bolder
                    color: isActive
                      ? "text.primary"
                      : isCompleted
                      ? "secondary.main"
                      : "text.secondary",
                    transition: "all 0.3s ease",
                    maxWidth: 80,
                    margin: "0 auto",
                  }}
                >
                  {step.label}
                </Typography>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};