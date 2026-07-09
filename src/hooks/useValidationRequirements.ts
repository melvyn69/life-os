import { useQuery } from "@tanstack/react-query";
import { listValidationRequirements } from "@/services/validation";

export const validationRequirementsQueryKey = ["validation-requirements"] as const;

export function useValidationRequirements() {
  return useQuery({
    queryKey: validationRequirementsQueryKey,
    queryFn: listValidationRequirements
  });
}
