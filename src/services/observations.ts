import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/services/captures";
import type { Database } from "@/types/database";

export type Observation = Database["public"]["Tables"]["observations"]["Row"];
export type SuggestedObservation = Observation & {
  captures: {
    content: string;
    created_at: string;
  } | null;
};

export async function listSuggestedObservations() {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("observations")
    .select("*, captures(content, created_at)")
    .eq("user_id", userId)
    .eq("status", "suggested")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as SuggestedObservation[];
}
