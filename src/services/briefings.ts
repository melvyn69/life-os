import { supabase } from "@/lib/supabase";
import { getCurrentUserId } from "@/services/captures";
import type { Database } from "@/types/database";

export type Briefing = Database["public"]["Tables"]["briefings"]["Row"];

export type BriefingSection = {
  heading: string;
  bullets: string[];
};

export type BriefingContent = {
  summary: string;
  sections: BriefingSection[];
  suggestedFocus: string;
};

type StoredBriefingContent = {
  summary?: unknown;
  sections?: unknown;
  suggested_focus?: unknown;
};

type GenerateBriefingResponse = {
  briefing: Briefing;
};

export async function getLatestBriefing() {
  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("briefings")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function generateBriefing() {
  await getCurrentUserId();

  const { data, error } = await supabase.functions.invoke<GenerateBriefingResponse>(
    "generate-briefing",
    {
      body: {}
    }
  );

  if (error) {
    throw error;
  }

  if (!data?.briefing) {
    throw new Error("No briefing response returned.");
  }

  return data.briefing;
}

export function parseBriefingContent(briefing: Briefing): BriefingContent {
  try {
    const parsed = JSON.parse(briefing.content) as StoredBriefingContent;
    const summary = typeof parsed.summary === "string" ? parsed.summary : briefing.content;
    const suggestedFocus = typeof parsed.suggested_focus === "string" ? parsed.suggested_focus : "";
    const sections = Array.isArray(parsed.sections)
      ? parsed.sections.map(parseBriefingSection).filter((section) => section !== null)
      : [];

    return {
      sections,
      suggestedFocus,
      summary
    };
  } catch {
    return {
      sections: [],
      suggestedFocus: "",
      summary: briefing.content
    };
  }
}

function parseBriefingSection(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.heading !== "string" || !Array.isArray(value.bullets)) {
    return null;
  }

  const bullets = value.bullets.filter((bullet): bullet is string => typeof bullet === "string");

  return {
    bullets,
    heading: value.heading
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
