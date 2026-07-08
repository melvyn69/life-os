import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createCapture, listInboxCaptures } from "@/services/captures";

const inboxCapturesQueryKey = ["captures", "inbox"] as const;

export function useCaptures() {
  return useQuery({
    queryKey: inboxCapturesQueryKey,
    queryFn: listInboxCaptures
  });
}

export function useCreateCapture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCapture,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inboxCapturesQueryKey });
    }
  });
}
