export interface UpdateEmployeeRequest {
  actorUserId: number;
  userId: number;
  employeeName: string;
  emailId: string;
  mobileNo: string;
  employmentType: "ONROLE" | "OFFROLE" | "PROJECT";
  vendorCompany: string;
  designation: string;
  jobLevel: string;
  officeLocation: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  deviceVendorCapability: string;
  dateOfJoining: string;
  dateOfLeaving: string | null;
  replacementEmpOlmid: string | null;
  replacementEmpName: string | null;
  /** Optional. Omit/null to keep the user's current role; the backing
   *  procedure validates the code against ROLE_MASTER. */
  roleCode?: string | null;
}
