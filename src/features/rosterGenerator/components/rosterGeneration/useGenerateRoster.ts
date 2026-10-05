import { useCallback } from "react";
import { toast } from "react-toastify";
import {
  useAddFutureWeekToRosterMutation,
  type AddFutureWeekToRosterPayload,
} from "../../api/rosterGenerationApiSlice";

export function useGenerateRoster() {
  const [addFutureWeekToRoster, { isLoading: isGenerating }] =
    useAddFutureWeekToRosterMutation();

  const generate = useCallback(
    async (payload: AddFutureWeekToRosterPayload) => {
      try {
        const res = await addFutureWeekToRoster(payload).unwrap();
        toast.success(res?.message || "Roster generated successfully");
      } catch (err: any) {
        toast.error(err?.data?.message || err?.message || "Failed to generate roster");
      }
    },
    [addFutureWeekToRoster],
  );

  return { isGenerating, generate };
}
