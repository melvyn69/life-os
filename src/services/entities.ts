import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/services/captures";
import type { Database } from "@/types/database";

export type Entity = Database["public"]["Tables"]["entities"]["Row"];

export type EntityCorrection = {
  entityId: string;
  description: string | null;
};

export async function listEntities() {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("user_id", userId)
    .in("status", ["suggested", "active"])
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

export async function getEntity(entityId: string) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .eq("id", entityId)
    .eq("user_id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function validateEntity(entityId: string) {
  const { data, error } = await supabase
    .rpc("confirm_entity", { p_entity_id: entityId });

  if (error) {
    throw error;
  }

  return data;
}

export async function correctEntity({ entityId, description }: EntityCorrection) {
  const { data, error } = await supabase
    .rpc("correct_entity", {
      p_description: description ?? "",
      p_entity_id: entityId
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function archiveEntity(entityId: string) {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("entities")
    .update({
      status: "archived",
      updated_at: new Date().toISOString()
    })
    .eq("id", entityId)
    .eq("user_id", userId)
    .in("status", ["suggested", "active"])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
