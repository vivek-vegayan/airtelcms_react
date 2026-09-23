export interface ShiftInfo {
  assignActCount: number;
  availableMins: number;
  shiftDisplay: string;
  workMode: string | null;
}

export interface UserRoster {
  userId: number;
  olmid: string;
  jobLevel: string;
  mobileNo: string;
  officeLocation: string;
  roster: Record<string, ShiftInfo>;
}

export interface MonthlyRosterResponse {
  data: UserRoster[];
  month: string;
  year: number;
  totalUsers: number;
  success: boolean;
}

export interface MonthlyRosterParams {
  year: number;
  month: string;
  teamId: number;
  userId?: number;
}

export interface Shift {
  assignActCount: number;
  availableMins: number;
  shiftDisplay: string;
  workMode: string | null;
}
