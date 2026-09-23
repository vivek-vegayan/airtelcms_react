import { api } from "../../../../../service/api";

type TaskDataFromApi = {
  userId: number;
  crqValidation: boolean;
  employeeLevel: "L2" | "L3" | "L4";
  employeeName: string;
  impactAnalysis: boolean;
  mopCreation: boolean;
  mopValidation: boolean;
  networkExecution: boolean;
  olmId: string;
  schedulingApprovals: boolean;
};

export const taskConfigApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTaskConfigView: builder.query<
      TaskDataFromApi[],
      { domainId: number; subDomainId: number }
    >({
      query: ({ domainId, subDomainId }) => ({
        url: `/schedular/task-config?domainId=${domainId}&subDomainId=${subDomainId}`,
        method: "GET",
      }),
      providesTags: ["TaskConfig"],
    }),

    updateTaskConfig: builder.mutation<
      { status: string; message: string },
      {
        affectedUserId: string | number;
        colName: string;
        newValue: string;
      }
    >({
      query: ({ affectedUserId, colName, newValue }) => ({
        url: "/schedular/task-config/update",
        method: "PATCH",
        params: {
          affectedUserId,
          colName,
          newValue,
        },
      }),
      invalidatesTags: ["TaskConfig"],
    }),
  }),
});

export const { useGetTaskConfigViewQuery, useUpdateTaskConfigMutation } = taskConfigApi;
