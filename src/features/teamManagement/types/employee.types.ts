export interface EmployeeDto {
  userId: number;
  olmId: string;
  employeeName: string;
  emailId: string;
  mobileNo: string;

  employmentType: string;
  vendorCompany: string;
  designation: string;
  jobLevel: string;
  officeLocation: string;
  gender: string;

  deviceVendorCapability: string;

  dateOfJoining: string;
  dateOfLeaving: string | null;

  employeeStatus: "ACTIVE" | "INACTIVE";
}
