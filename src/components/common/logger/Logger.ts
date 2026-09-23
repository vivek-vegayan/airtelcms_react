import { api } from "../../../service/api";
import type { LogRequest } from "./logger.types";
import { getCurrentTimestamp, getEpochTime } from "./logger.utils";
// import { LogRequest } from "../types/logger.types";
// import { getCurrentTimestamp, getEpochTime } from "../utils/logger.utils";

export const loggerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    insertLog: builder.mutation<void, LogRequest>({
      query: (payload) => {
        const params = new URLSearchParams({
          notifyId: String(getEpochTime(payload.notifyId)),
          module: payload.module,
          subModule: payload.subModule,
          action: payload.action,
          actioner: payload.actioner,
          time1: payload.time1 ?? getCurrentTimestamp(),
          sentToProcess: payload.sentToProcess,
          sentToNotify: payload.sentToNotify,
          logSeverity: payload.logSeverity,
        });

        return {
          url: `/logger/insertlogdetails?${params.toString()}`,
          method: "POST",
        };
      },
    }),
// |____________________
// |
// |माया मरी ना, मन मरा     
// |मरि मरि गयो शरीर
// |आशा तृष्णा ना मरी
// |कहे दास कबीर
// |____________________
    insertApproveLog: builder.mutation<void, LogRequest>({
      query: (payload) => {
        const params = new URLSearchParams({
          notifyId: String(getEpochTime(payload.notifyId)),
          module: payload.module,
          subModule: payload.subModule,
          action: payload.action,
          actioner: payload.actioner,
          time1: payload.time1 ?? getCurrentTimestamp(),
          sentToProcess: payload.sentToProcess,
          sentToNotify: payload.sentToNotify,
          logSeverity: payload.logSeverity,
        });

        return {
          url: `/logger/notificatoninbox/insertapprovedlog?${params.toString()}`,
          method: "POST",
        };
      },
    }),

    insertRejectLog: builder.mutation<void, LogRequest>({
      query: (payload) => {
        const params = new URLSearchParams({
          notifyId: String(getEpochTime(payload.notifyId)),
          module: payload.module,
          subModule: payload.subModule,
          action: payload.action,
          actioner: payload.actioner,
          time1: payload.time1 ?? getCurrentTimestamp(),
          sentToProcess: payload.sentToProcess,
          sentToNotify: payload.sentToNotify,
          logSeverity: payload.logSeverity,
        });

        return {
          url: `/logger/notificatoninbox/insertrejectlog?${params.toString()}`,
          method: "POST",
        };
      },
    }),

    getAllLogs: builder.query<any, void>({
      query: () => ({
        url: "/logger/getalllogs",
        method: "GET",
      }),
    }),
  }),
});
export const {
  useInsertLogMutation,
  useInsertApproveLogMutation,
  useInsertRejectLogMutation,
  useGetAllLogsQuery,
} = loggerApi;
