import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/services/captures";

export type ValidationRequirements = {
  entityIds: string[];
  memoryIds: string[];
};

export async function listValidationRequirements(): Promise<ValidationRequirements> {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("memory_contradictions")
    .select("entity_id, memory_id")
    .eq("user_id", userId)
    .eq("resolution_status", "unresolved")
    .in("status", ["suggested", "active"]);

  if (error) {
    throw error;
  }

  return {
    entityIds: [...new Set((data ?? []).flatMap((item) => item.entity_id ? [item.entity_id] : []))],
    memoryIds: [...new Set((data ?? []).flatMap((item) => item.memory_id ? [item.memory_id] : []))]
  };
}
