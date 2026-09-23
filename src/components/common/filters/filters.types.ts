export type FilterKey =
  | "domain"
  | "subDomain"
  | "teamFunction"
  | "teamSubFunction";

export interface FilterOption {
  label: string;
  value: string;
}

export type FilterValues = Partial<Record<FilterKey, string>>;

export interface TeamFiltersProps {
  values: FilterValues;
  onChange: (key: FilterKey, value: string) => void;
  role: string;
  status: "active" | "inactive";
  onStatusChange: (status: "active" | "inactive") => void;
  children?: React.ReactNode;
}
