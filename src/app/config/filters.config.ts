import type {
  FilterKey,
  FilterOption,
} from "../../components/common/filters/filters.types";

export const FILTER_OPTIONS: Record<FilterKey, FilterOption[]> = {
  domain: [
    { label: "Technology", value: "TECH" },
    { label: "Operations", value: "OPS" },
  ],
  subDomain: [
    { label: "Frontend", value: "FE" },
    { label: "Backend", value: "BE" },
  ],
  teamFunction: [
    { label: "Engineering", value: "ENGINEERING" },
    { label: "QA", value: "QA" },
  ],
  teamSubFunction: [
    { label: "React Team", value: "REACT" },
    { label: "API Team", value: "API" },
  ],
};

export const ROLE_FILTER_VISIBILITY: Record<string, FilterKey[]> = {
  admin: ["domain", "subDomain", "teamFunction", "teamSubFunction"],
  manager: ["teamFunction", "teamSubFunction"],
  user: ["teamFunction"],
  SUB_DOMAIN_HEAD: ["domain","subDomain", "teamFunction", "teamSubFunction"],
  SUPER_ADMIN: ["domain", "subDomain", "teamFunction", "teamSubFunction"],
  VERTICAL_HEAD: ["domain", "subDomain", "teamFunction", "teamSubFunction"],
  FUNCTION_HEAD: ["domain", "subDomain", "teamFunction", "teamSubFunction"],
  DOMAIN_HEAD: ["domain", "subDomain", "teamFunction", "teamSubFunction"],
  TEAM_LEAD: ["teamFunction", "teamSubFunction"],
  TEAM_MEMBER: ["teamFunction", "teamSubFunction"],
};
