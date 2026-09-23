import type { ChartType, QueryResult } from "../types/dataAgent.types";

export function getAvailableTypes(result: QueryResult): ChartType[] {
  // ── guard: empty result
  if (!result.rows || result.rows.length === 0) return ["table"];
  if (!result.columns || result.columns.length === 0) return ["table"];

  const numCols = result.columns.length;
  const q = result.question?.toLowerCase() ?? "";
  const intent = result.intent?.toLowerCase() ?? "";

  // ── classify each column
  const numericCols = result.columns.filter(
    (col) => typeof result.rows[0]?.[col] === "number",
  );
  const textCols = result.columns.filter(
    (col) => typeof result.rows[0]?.[col] === "string",
  );

  const numNumeric = numericCols.length;
  const numText = textCols.length;
  const hasNumeric = numNumeric > 0;
  const hasText = numText > 0;
  const multiNumeric = numNumeric >= 2;
  const multiText = numText >= 2;

  // ── negative values in any numeric column
  const hasNegative = numericCols.some((col) =>
    result.rows.some((row) => Number(row[col]) < 0),
  );

  // ── second col is numeric (for 2-col bar/pie)
  const secondColNumeric =
    numCols >= 2 && typeof result.rows[0]?.[result.columns[1]] === "number";

  // ── time/date column
  const hasTimeCol = result.columns.some((col) => {
    const lower = col.toLowerCase();
    return (
      lower.includes("date") ||
      lower.includes("time") ||
      lower.includes("month") ||
      lower.includes("year") ||
      lower.includes("week") ||
      lower.includes("day")
    );
  });

  // CASE 1: single cell — 1 col, 1 row
  if (result.row_count === 1 && numCols === 1) {
    return ["metrics"];
  }

  // CASE 2: single row, multiple numeric cols
  if (result.row_count === 1 && hasNumeric) {
    return ["metrics", "table"];
  }

  // CASE 3: single text column, multiple rows
  if (numCols === 1 && numText === 1 && result.row_count > 1) {
    return ["tags", "table"];
  }

  // CASE 4: time series — date/time col detected OR trend intent
  if (
    hasTimeCol ||
    intent === "trend" ||
    q.includes("trend") ||
    q.includes("over time") ||
    q.includes("per month") ||
    q.includes("per day") ||
    q.includes("per week") ||
    q.includes("history") ||
    q.includes("historical") ||
    q.includes("traffic") ||
    q.includes("graph")
  ) {
    return ["area", "line", "bar", "table"];
  }

  // CASE 5: negative values present
  if (hasNegative) {
    return ["barnegative", "table", "bar"];
  }

  // CASE 6: 2+ text cols + exactly 1 numeric col
  if (multiText && numNumeric === 1) {
    return ["table", "multibar", "bar", "pie"];
  }

  // CASE 7: 1 text col + 2+ numeric cols
  if (numText === 1 && multiNumeric) {
    return ["table", "multibar", "bar", "area"];
  }

  // CASE 8: distribution / share question
  if (
    q.includes("distribution") ||
    q.includes("share") ||
    q.includes("breakdown") ||
    q.includes("proportion") ||
    q.includes("percentage") ||
    intent === "distribution"
  ) {
    return ["pie", "bar", "table"];
  }

  // CASE 9: ranking / top N
  if (
    intent === "ranking" ||
    intent === "top_n" ||
    q.includes("top") ||
    q.includes("peak") ||
    q.includes("highest") ||
    q.includes("lowest") ||
    q.includes("most") ||
    q.includes("least") ||
    q.includes("best") ||
    q.includes("worst") ||
    q.includes("rank")
  ) {
    if (hasNumeric && hasText) {
      if (numCols === 2) return ["bar", "pie", "table"];
      return ["table", "bar", "pie"];
    }
  }

  // CASE 10: exactly 2 cols — 1 text + 1 numeric
  if (numCols === 2 && hasText && secondColNumeric) {
    return ["bar", "pie", "table"];
  }

  // CASE 11: lookup / list intent
  if (
    intent === "lookup" ||
    intent === "list" ||
    q.includes("show all") ||
    q.includes("list all") ||
    q.includes("what are") ||
    q.includes("distinct")
  ) {
    if (numText === 1 && !hasNumeric) return ["tags", "table"];
    return ["table"];
  }

  // CASE 12: 3+ cols with at least 1 numeric
  if (numCols > 2 && hasNumeric) {
    return ["table", "bar", "multibar"];
  }

  // CASE 13: all text columns (no numbers)
  if (!hasNumeric) {
    return ["table"];
  }

  // ── fallback
  return ["table"];
}

export function detectType(result: QueryResult): ChartType {
  return getAvailableTypes(result)[0];
}
