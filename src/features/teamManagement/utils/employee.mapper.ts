import type { EmployeeDto } from "../types/employee.types";
import type { TeamSkillSet } from "../types/teamSkillset.types";

export const mapEmployeesToTeamSkillSet = (
  employees: EmployeeDto[],
): TeamSkillSet[] =>
  employees.map((e) => ({
    olmId: e.olmId,
    employeeName: e.employeeName,

    teamFunction: "-",        // not in API yet
    subFunction: "-",         // not in API yet
    designation: e.designation,
    role: "TEAM_MEMBER",      // derive later if needed
    level: e.jobLevel,
    payRoll: e.employmentType,
    companyName: e.vendorCompany,
    domain: "-",              // can be injected later
    vendor: e.deviceVendorCapability
      ? e.deviceVendorCapability.split(",")
      : [],
    gender: e.gender,
    officeLocation: e.officeLocation,
    status: e.employeeStatus === "ACTIVE" ? "Active" : "Inactive",
  }));
