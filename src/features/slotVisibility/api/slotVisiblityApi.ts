import { api } from "../../../service/api";

export interface TeamCapacityCount {
  shiftDate: string;
  teamName: string;
  shiftName: string;
  free_min: number;
  reserved_cnt: number;
  confirmed_cnt: number;
}

export interface TeamCapacityCountParams {
  fromDate: string;
  toDate: string;
  teamName: string;
  shiftName?: string;
}

export interface TotalTeamCount {
  activities_that_fit: number;
  reserved_cnt: number;
  confirmed_cnt: number;
}

export interface EngineerCapacity {
  rosterId: number;
  shiftDate: string;
  workDate: string;
  shiftId: number;
  shiftName: string;
  domainId: number;
  teamId: number;
  teamName: string;
  userId: number;
  olmid: string;
  employeeName: string;
  jobLevel: string;
  vendorCapability: string;
  windowMin: number;
  availableMin: number;
  reservedMin: number;
  reservedCnt: number;
  confirmedMin: number;
  confirmedCnt: number;
  dayStatus: string;
  freeMin: number;
  utilisationPct: number;
}

//------------------------------------  CHECK ACTIVITY
export interface CheckActivityFilter {
  domain: string[];
  layer: string[];
  plan_type: string[];
  change_impact: string[];
  vendor_oem: string[];
}

export interface ShowAvailability {
  shiftDate: string;
  shiftName: string;
  workWindow: string;

  rostered: number;
  eligible: number;
  reserved: number;
  confirmed: number;
  stillFits: number;

  status: string;
  reason: string;
}

//---------------------------------All Plans
export interface AllPlans {
  shift_date: string;
  activities_that_fit: number;
  slot_status: string;
  shift_name: string;
  required_min: number;
  plan_type: string;
  domain: string;
}

export interface AllPlansParams {
  teamName: string;
}

export const slotVisibilityApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTeamCapacityCount: builder.query<
      TeamCapacityCount[],
      TeamCapacityCountParams
    >({
      query: ({ fromDate, toDate, teamName, shiftName }) => ({
        url: "/slotVisibility/teamCapacity/teamCapacityCount",
        method: "GET",
        params: {
          fromDate,
          toDate,
          teamName,
          shiftName,
        },
      }),
    }),

    getTotalTeamCount: builder.query<TotalTeamCount, TeamCapacityCountParams>({
      query: ({ fromDate, toDate, teamName, shiftName }) => ({
        url: "/slotVisibility/teamCapacity/totalTeamCount",
        method: "GET",
        params: {
          fromDate,
          toDate,
          teamName,
          shiftName,
        },
      }),
    }),

    getEngineerCapacity: builder.query<
      EngineerCapacity[],
      {
        shiftDate: string;
        teamName: string;
        shiftName: string;
      }
    >({
      query: ({ shiftDate, teamName, shiftName }) => ({
        url: "/slotVisibility/teamCapacity/selectedSlotCount",
        method: "GET",
        params: {
          shiftDate,
          teamName,
          shiftName,
        },
      }),
    }),

    //------------------------CHECK ACTIVITY-----------
    getCheckActivityFilter: builder.query<CheckActivityFilter, void>({
      query: () => ({
        url: "/slotVisibility/checkActivity/checkActivityFilter",
        method: "GET",
      }),
    }),

    getShowAvailability: builder.query<
      ShowAvailability[],
      {
        domain: string;
        layer: string;
        planType: string;
        changeImpact: string;
        vendorOem: string;
        fromDate: string;
        toDate: string;
      }
    >({
      query: ({
        domain,
        layer,
        planType,
        changeImpact,
        vendorOem,
        fromDate,
        toDate,
      }) => ({
        url: "/slotVisibility/checkActivity/showAvaliability",
        method: "GET",
        params: {
          domain,
          layer,
          planType,
          changeImpact,
          vendorOem,
          fromDate,
          toDate,
        },
      }),
    }),
    //-----------------------ALL PLANS----------------------
    getAllPlans: builder.query<AllPlans[], AllPlansParams>({
      query: ({ teamName }) => ({
        url: "/slotVisibility/allPlans/showAvaliability",
        method: "GET",
        params: {
          teamName,
        },
      }),
    }),
  }),

  overrideExisting: false,
});

export const {
  useLazyGetTeamCapacityCountQuery,
  useLazyGetTotalTeamCountQuery,
  useLazyGetEngineerCapacityQuery,
  useLazyGetCheckActivityFilterQuery,
  useLazyGetShowAvailabilityQuery,
  useLazyGetAllPlansQuery,
} = slotVisibilityApi;
