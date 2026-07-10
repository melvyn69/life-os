import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { entitiesQueryKey } from "@/hooks/useEntities";
import { memoriesQueryKey } from "@/hooks/useMemories";
import { listSuggestedObservations, processObservations } from "@/services/observations";

export const suggestedObservationsQueryKey = ["observations", "suggested"] as const;

export function useSuggestedObservations() {
  return useQuery({
    queryKey: suggestedObservationsQueryKey,
    queryFn: listSuggestedObservations
  });
}

export function useProcessObservations() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: processObservations,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: entitiesQueryKey });
      void queryClient.invalidateQueries({ queryKey: memoriesQueryKey });
      void queryClient.invalidateQueries({ queryKey: suggestedObservationsQueryKey });
    }
  });
}
