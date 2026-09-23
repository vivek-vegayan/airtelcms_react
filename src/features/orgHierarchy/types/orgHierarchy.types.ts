export type OrgFilterKey =
  | "vertical"
  | "teamFunction"
  | "domain"
  | "subDomain";

export interface Vertical {
  id: number;
  name: string;
}

export interface TeamFunction {
  id: number;
  name: string;
  verticalId: number;
}

export interface Domain {
  id: number;
  name: string;
  functionId: number;
}

export interface SubDomain {
  id: number;
  name: string;
  domainId: number;
}

export interface OrgHierarchyResponse {
  status: string;
  data: {
    verticals: Vertical[];
    teamFunction: TeamFunction[];
    domains: Domain[];
    subDomains: SubDomain[];
  };
}

export interface OrgFilterOption {
  label: string;
  value: number;
}

export type OrgFilterValues = Partial<{
  vertical: number;
  teamFunction: number;
  domain: number;
  subDomain: number;
}>;



// export type OrgFilterKey =
//   | "vertical"
//   | "teamFunction"
//   | "domain"
//   | "subDomain";

// export interface OrgHierarchyResponse {
//   status: string;
//   data: {
//     verticals: string[];
//     teamFunctions: string[];
//     domains: string[];
//     subDomains: string[];
//   };
// }

// export interface OrgFilterOption {
//   label: string;
//   value: string;
// }

// export type OrgFilterValues = Partial<Record<OrgFilterKey, string>>;
