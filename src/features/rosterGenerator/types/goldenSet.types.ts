export interface GoldenSetApiRow {
  prefId: number;
  olmid: string;
  employeeName: string;
  employeeRoll: string;
  employeeLevel: string;
  // NB: keys are lower-case "w" — GoldenSetRowDto's fields (W1D1 etc.) go
  // through Jackson's default bean-name mangling on serialization, which
  // lower-cases a single leading capital when it's followed by a digit
  // (java.beans.Introspector decapitalize behaviour), so the JSON actually
  // sent on the wire is w1D1..w6D7, not W1D1..W6D7. Verified against the
  // live /goldenset response — do not "correct" this back to upper-case.
  w1D1: string;
  w1D2: string;
  w1D3: string;
  w1D4: string;
  w1D5: string;
  w1D6: string;
  w1D7: string;
  w2D1: string;
  w2D2: string;
  w2D3: string;
  w2D4: string;
  w2D5: string;
  w2D6: string;
  w2D7: string;
  w3D1: string;
  w3D2: string;
  w3D3: string;
  w3D4: string;
  w3D5: string;
  w3D6: string;
  w3D7: string;
  w4D1: string;
  w4D2: string;
  w4D3: string;
  w4D4: string;
  w4D5: string;
  w4D6: string;
  w4D7: string;
  w5D1: string;
  w5D2: string;
  w5D3: string;
  w5D4: string;
  w5D5: string;
  w5D6: string;
  w5D7: string;
  w6D1: string;
  w6D2: string;
  w6D3: string;
  w6D4: string;
  w6D5: string;
  w6D6: string;
  w6D7: string;
}

export interface GoldenSetApiResponse {
  data: GoldenSetApiRow[];
}

export interface GoldenSetQueryParams {
  subDomainId: number | string;
}

/** Normalised flat row used by the grid */
export interface GoldenSetEmployee {
  prefId: number;
  olmid: string;
  name: string;
  role: string;
  level: string;
  /** 42-element array: index = week*7 + dayOfWeek (0-based) */
  shifts: string[];
}

/** Parsed summary stats per employee row */
export interface RowSummary {
  work: number;
  off: number;
  night: number;
  loadPct: number;
}
