import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { archiveEntity, listEntities, validateEntity } from "@/services/entities";

export const entitiesQueryKey = ["entities"] as const;

export function useEntities() {
  return useQuery({
    queryKey: entitiesQueryKey,
    queryFn: listEntities
  });
}

export function useValidateEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: validateEntity,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: entitiesQueryKey });
    }
  });
}

export function useArchiveEntity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveEntity,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: entitiesQueryKey });
    }
  });
}
