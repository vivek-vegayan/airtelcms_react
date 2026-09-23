import { type MRT_ColumnDef } from "material-react-table";
import type { TeamSkillSet } from "../types/teamSkillset.types";
// import { TeamSkillSet } from "../types/teamSkillset.types";

export const teamSkillsetColumns: MRT_ColumnDef<TeamSkillSet>[] = [
  { accessorKey: "employeeName", header: "Employee" },
  { accessorKey: "teamFunction", header: "Function" },
  { accessorKey: "subFunction", header: "Sub Function" },
  { accessorKey: "designation", header: "Designation" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "level", header: "Level" },
  { accessorKey: "payRoll", header: "Payroll" },
  { accessorKey: "companyName", header: "Company" },
  { accessorKey: "domain", header: "Domain" },
  {
    accessorKey: "vendor",
    header: "Vendor",
    Cell: ({ cell }) => cell.getValue<string[]>().join(", "),
  },
  { accessorKey: "gender", header: "Gender" },
  { accessorKey: "officeLocation", header: "Location" },
  { accessorKey: "status", header: "Status" },
];
