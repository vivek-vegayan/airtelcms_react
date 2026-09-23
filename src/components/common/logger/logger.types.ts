export type LogSeverity = "INFO" | "WARN" | "ERROR" | "SUCCESS";

export interface LogRequest {
  notifyId?: number;
  module: string;
  subModule: string;
  action: string;
  actioner: string;
  sentToProcess: string;
  sentToNotify: string;
  logSeverity: LogSeverity;
  time1?: string;
}
