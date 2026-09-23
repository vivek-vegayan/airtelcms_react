export type ChartType =
  | "bar"
  | "line"
  | "pie"
  | "table"
  | "metrics"
  | "tags"
  | "multibar"
  | "area"
  | "barnegative";

export interface QueryResult {
  question: string;
  intent: string;
  sql: string;
  columns: string[];
  rows: Record<string, unknown>[];
  row_count: number;
  summary: string | null;
  error: string | null;
}

export interface AgentError {
  error: string;
  detail: string;
}

export interface WidgetData {
  columns: string[];
  rows: Record<string, unknown>[];
  question?: string;
}

export interface WidgetState {
  id: string;
  type: ChartType;
  availableTypes: ChartType[];
  title: string;
  data: WidgetData;
  summary?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  saved: boolean;
  minimized: boolean;
}

export interface CanvasPage {
  id: string;
  name: string;
  widgets: WidgetState[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
  loading?: boolean;
  error?: boolean;
  result?: QueryResult;
  rowCount?: number;
  columns?: string[];
  intent?: string;
  hasData?: boolean;
  /** The user's original question — assistant messages only, lets a failed reply be retried. */
  question?: string;
}

export interface HistoryEntry {
  id: number;
  question: string;
  summary: string | null;
  intent: string | null;
  rowCount: number | null;
  timestamp: string;
}
