import { useQuery } from "@tanstack/react-query";
import { listSuggestedObservations } from "@/services/observations";

export const suggestedObservationsQueryKey = ["observations", "suggested"] as const;

export function useSuggestedObservations() {
  return useQuery({
    queryKey: suggestedObservationsQueryKey,
    queryFn: listSuggestedObservations
  });
}
