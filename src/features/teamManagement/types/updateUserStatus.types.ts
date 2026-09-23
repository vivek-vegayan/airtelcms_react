export interface UpdateUserStatusRequest {
  actorUserId: number;
  userId: number;
  employeeStatus: "INACTIVE";
  dateOfLeaving: string;
  exitType: string;
  exitReason: string;
  replacementEmpOlmid: string | null;
  replacementEmpName: string | null;
}
