import { useState, useCallback } from 'react';

export const useStepper = (initialStep = 0, totalSteps: number) => {
  const [activeStep, setActiveStep] = useState(initialStep);

  const nextStep = useCallback(() => {
    setActiveStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, [totalSteps]);

  const prevStep = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < totalSteps) {
      setActiveStep(stepIndex);
    }
  }, [totalSteps]);

  return {
    activeStep,
    nextStep,
    prevStep,
    goToStep,
    isFirstStep: activeStep === 0,
    isLastStep: activeStep === totalSteps - 1,
  };
};