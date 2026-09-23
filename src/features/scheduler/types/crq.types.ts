export interface ReviewFormInputs {
  status?: "Done" | "Failed" | "canceled";
  remark?: string;
  cygnetStatus?: "REJECT_TO_PLANNING" | "REJECT_TO_OPERATIONS";
  field1?: string;
  cancellationReason?: string;
  field5?: string;
}

export interface ThemeColors {
  accent: string;
  accentDim?: string;
  border: string;
  surface: string;
  background?: string;
  textPrimary: string;
  textSecondary: string;
  isDark: boolean;
}

export interface PlanInvDialogProps {
  open: boolean;
  onClose: () => void;
  crq: any;
  colors?: Partial<ThemeColors>;
  onSubmit?: (data: any) => void | Promise<{ success: boolean } | void>;
}