import { type ReactNode } from 'react';

export interface IStep {
  id: string | number;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export interface AppStepperProps {
  steps: IStep[];
  activeStep: number;
  orientation?: 'horizontal' | 'vertical';
  onStepClick?: (stepIndex: number) => void;
  sx?: any;
}

export interface CustomStepIconProps {
  active?: boolean;
  completed?: boolean;
  icon?: ReactNode;
  customIcon?: ReactNode;
}