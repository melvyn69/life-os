import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type Observation = Database["public"]["Tables"]["observations"]["Row"];

type AnalyzeCaptureResponse = {
  observations: Observation[];
};

export async function analyzeCapture(captureId: string) {
  const { data, error } = await supabase.functions.invoke<AnalyzeCaptureResponse>(
    "analyze-capture",
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
    throw new Error("No analysis response returned.");
  }

  return data.observations;
}
