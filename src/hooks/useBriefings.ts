import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { generateBriefing, getLatestBriefing } from "@/services/briefings";

export const latestBriefingQueryKey = ["briefings", "latest"] as const;

export function useLatestBriefing() {
  return useQuery({
    queryKey: latestBriefingQueryKey,
    queryFn: getLatestBriefing
  });
}

export function useGenerateBriefing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generateBriefing,
    onSuccess: (briefing) => {
      queryClient.setQueryData(latestBriefingQueryKey, briefing);
      void queryClient.invalidateQueries({ queryKey: latestBriefingQueryKey });
    }
  });
}
