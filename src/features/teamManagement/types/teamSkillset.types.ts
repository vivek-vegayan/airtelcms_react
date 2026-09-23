export interface TeamSkillSet {
  olmId: string;
  employeeName: string;
  teamFunction: string;
  subFunction: string;
  designation: string;
  role: string;
  level: string;
  payRoll: string;
  companyName: string;
  domain: string;
  vendor: string[];
  gender: string;
  officeLocation: string;
  status: "Active" | "Inactive";
}
