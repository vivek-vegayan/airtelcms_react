export interface ShiftInfo {
  assignActCount: number;
  availableMins: number;
  shiftDisplay: string;
  workMode: string | null;
}

export type RosterMap = Record<string, ShiftInfo>;

export interface UserRoster {
  userId: number;
  olmid: string;
  jobLevel: string;
  mobileNo: string;
  employeeName: string;
  officeLocation: string;
  roster: RosterMap;
}

export interface RosterViewResponse {
  data: UserRoster[];
  startDate: string;
  endDate: string;
  success: boolean;
  totalUsers: number;
}

export interface RosterViewParams {

 
  startDate: string;
  endDate: string;
  domainId: number;
  subDomainId: number;
  
}


/* ================= CURRENT SHIFT COUNT ================= */

export interface CurrentShiftCount {
  shiftName: string;
  totalUsers: string;
}

/* ================= ERROR RESPONSE (OPTIONAL BUT RECOMMENDED) ================= */

export interface RosterErrorResponse {
  status: string;
  message: string;
}