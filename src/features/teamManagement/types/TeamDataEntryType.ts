export interface TeamDataEntryType {
  teamFunction: string;
  subFunction: string;
  employeeName: string;
  designation: string;
  role: string;
  level: string;
  payRoll: string; 
  olmId: string;
  emailId: string;
  mobileNo: string;
  functionHead: string;
  companyName: string;
  remark: string | null;
  domain: string;
  vendor: string[]; // Changed from string[] to string to match API response
  preferredShiftSchedule?: string; // Raw data from API is a string, we will transform it later
  gender: string;
  officeLocation: string;
  dateOfJoining: string; // This is a string like "YYYY-MM-DD"
  dateOfLeaving: string | null;
  expInYears: string; 
  status: string;
  empReplaceOlmId: string | null;
  empReplaceName: string | null;
  deleteUpdateReason?: string | null;
  preferredShiftScheduleArray?: string[]; 
  action?: any; 
}
export type RawTeamMemberApiResponse = Omit<TeamDataEntryType, 'preferredShiftScheduleArray'>;
