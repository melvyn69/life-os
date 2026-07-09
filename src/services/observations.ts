import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/services/captures";
import type { Entity } from "@/services/entities";
import type { Memory } from "@/services/memories";
import type { Database } from "@/types/database";

export type Observation = Database["public"]["Tables"]["observations"]["Row"];
export type EntityDuplicateCandidate = Database["public"]["Tables"]["entity_duplicate_candidates"]["Row"];
export type MemoryEvidence = Database["public"]["Tables"]["memory_evidence"]["Row"];
export type MemoryContradiction = Database["public"]["Tables"]["memory_contradictions"]["Row"];
export type ConfidenceChange = {
  confidence: "low" | "medium" | "high";
  evidence_observation_ids: string[];
  independent_source_count: number;
  previous_confidence: "low" | "medium" | "high";
  reason: string;
  record_id: string;
  record_type: "entity" | "memory";
};
export type SuggestedObservation = Observation & {
  captures: {
    content: string;
    created_at: string;
  } | null;
};

type ProcessObservationsResponse = {
  confidence_changes?: ConfidenceChange[];
  contradictions?: MemoryContradiction[];
  duplicate_candidates?: EntityDuplicateCandidate[];
  evidence?: MemoryEvidence[];
  entities: Entity[];
  memories: Memory[];
  prompt_version?: string;
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

export async function processObservations(captureId: string) {
  const { data, error } = await supabase.functions.invoke<ProcessObservationsResponse>(
    "process-observations",
    {
      body: {
        capture_id: captureId
      }
    }
  );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("No observation processing response returned.");
  }

  return data;
}
