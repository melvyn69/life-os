import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { archiveMemory, correctMemory, listMemories, validateMemory } from "@/services/memories";

export const memoriesQueryKey = ["memories"] as const;

export function useMemories() {
  return useQuery({
    queryKey: memoriesQueryKey,
    queryFn: listMemories
  });
}

export function useValidateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: validateMemory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memoriesQueryKey });
    }
  });
}

export function useCorrectMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: correctMemory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memoriesQueryKey });
    }
  });
}

export function useArchiveMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveMemory,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: memoriesQueryKey });
    }
  });
}
