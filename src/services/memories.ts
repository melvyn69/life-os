import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/services/captures";
import type { Database } from "@/types/database";

export type Memory = Database["public"]["Tables"]["memories"]["Row"];
export type MemoryWithEntity = Memory & {
  entities: {
    name: string;
    type: string;
  } | null;
};

export async function listMemories() {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("memories")
    .select("*, entities(name, type)")
    .eq("user_id", userId)
    .in("status", ["suggested", "active"])
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as MemoryWithEntity[];
}

export async function validateMemory(memoryId: string) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("memories")
    .update({
      confidence: "confirmed",
      status: "active",
      updated_at: new Date().toISOString()
    })
    .eq("id", memoryId)
    .eq("user_id", userId)
    .eq("status", "suggested")
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function archiveMemory(memoryId: string) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("memories")
    .update({
      status: "archived",
      updated_at: new Date().toISOString()
    })
    .eq("id", memoryId)
    .eq("user_id", userId)
    .eq("status", "suggested")
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
