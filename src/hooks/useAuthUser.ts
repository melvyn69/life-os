import { useQuery } from "@tanstack/react-query";
import { getCurrentUserId } from "@/services/captures";

export const authUserQueryKey = ["auth", "current-user"] as const;

export function useAuthUser() {
  return useQuery({
    queryKey: authUserQueryKey,
    queryFn: getCurrentUserId,
    retry: false,
    staleTime: 60_000
  });
}
