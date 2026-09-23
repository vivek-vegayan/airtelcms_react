export function pickLabelCol(columns: string[], question: string): string {
  const q = question.toLowerCase();

  const priorities: { keyword: string; colMatch: string }[] = [
    { keyword: "interface", colMatch: "interface" },
    { keyword: "node", colMatch: "node" },
    { keyword: "linktype", colMatch: "linktype" },
    { keyword: "link type", colMatch: "linktype" },
    { keyword: "location", colMatch: "location" },
    { keyword: "region", colMatch: "region" },
    { keyword: "customer", colMatch: "customer" },
    { keyword: "device", colMatch: "device" },
    { keyword: "port", colMatch: "port" },
  ];

  for (const { keyword, colMatch } of priorities) {
    if (q.includes(keyword)) {
      const match = columns.find((col) => col.toLowerCase().includes(colMatch));
      if (match) return match;
    }
  }

  return columns[0];
}

export function pickValueCol(
  columns: string[],
  rows: Record<string, unknown>[],
): string {
  return (
    columns.find((col) => typeof rows[0]?.[col] === "number") ??
    columns[columns.length - 1]
  );
}
