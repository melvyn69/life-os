import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.1";

type LifeOsSupabaseClient = ReturnType<typeof createClient<any>>;
type Confidence = "low" | "medium" | "high" | "confirmed";
type Sensitivity = "normal" | "sensitive";
type LifeOsStatus = "suggested" | "active" | "confirmed" | "hidden" | "archived" | "deleted";

type ContextEntity = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  confidence: Confidence;
  sensitivity: Sensitivity;
  updated_at: string;
};

type ContextMemory = {
  id: string;
  entity_id: string | null;
  content: string;
  type: string;
  confidence: Confidence;
  sensitivity: Sensitivity;
  updated_at: string;
};

type ContextObservation = {
  id: string;
  content: string;
  type: string;
  confidence: Confidence;
  sensitivity: Sensitivity;
  status: LifeOsStatus;
  created_at: string;
};

type BriefingSection = {
  heading: string;
  bullets: string[];
};

type AiBriefing = {
  title: string;
  summary: string;
  sections: BriefingSection[];
  suggested_focus: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const activeStatus = "active";
const recentObservationStatuses: LifeOsStatus[] = ["suggested", "active", "confirmed"];

const briefingSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: {
      type: "string",
      description: "A short title for the briefing."
    },
    summary: {
      type: "string",
      description: "A concise summary grounded only in the supplied context."
    },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          heading: {
            type: "string",
            description: "A calm section heading."
          },
          bullets: {
            type: "array",
            items: {
              type: "string",
              description: "A short, useful bullet grounded in the supplied context."
            }
          }
        },
        required: ["heading", "bullets"]
      }
    },
    suggested_focus: {
      type: "string",
      description: "One gentle suggested focus for today."
    }
  },
  required: ["title", "summary", "sections", "suggested_focus"]
};

const systemPrompt = [
  "You are the briefing layer of a personal life companion.",
  "Create a short, calm, useful briefing from the user's recent life data.",
  "Use only the supplied active memories, active entities, and recent observations.",
  "Do not invent facts.",
  "Do not present observations or suggestions as certainty.",
  "Do not be motivational in an exaggerated way.",
  "Do not make medical, legal, or financial decisions.",
  "Do not give orders.",
  "Keep it concise and simple.",
  "Return JSON only."
].join("\n");

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization) {
      throw new PublicError("Sign in to generate a briefing.", 401);
    }

    const supabaseUrl = readRequiredEnv("SUPABASE_URL");
    const supabaseAnonKey = readRequiredEnv("SUPABASE_ANON_KEY");
    const openAiKey = readOpenAiApiKey();
    const openAiModel = readRequiredEnv("OPENAI_MODEL");

    const supabase = createClient<any>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization
        }
      }
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new PublicError("Sign in to generate a briefing.", 401);
    }

    const userId = userData.user.id;
    const { entities, memories, observations } = await loadBriefingContext(supabase, userId);

    if (entities.length === 0 && memories.length === 0 && observations.length === 0) {
      throw new PublicError("There is not enough memory to generate a briefing yet.", 400);
    }

    const briefing = await generateBriefingWithOpenAi({
      apiKey: openAiKey,
      entities,
      memories,
      model: openAiModel,
      observations
    });

    const { data: insertedBriefing, error: insertError } = await supabase
      .from("briefings")
      .insert({
        content: JSON.stringify({
          summary: briefing.summary,
          sections: briefing.sections,
          suggested_focus: briefing.suggested_focus
        }),
        status: activeStatus,
        title: briefing.title,
        user_id: userId
      })
      .select()
      .single();

    if (insertError || !insertedBriefing) {
      throw new PublicError("Unable to save the briefing right now.", 500);
    }

    return jsonResponse({ briefing: insertedBriefing });
  } catch (error) {
    if (error instanceof PublicError) {
      return jsonResponse({ error: error.message }, error.status);
    }

    console.error(
      "Unexpected briefing generation error.",
      error instanceof Error ? error.name : typeof error
    );

    return jsonResponse({ error: "Unable to generate a briefing right now." }, 500);
  }
});

async function loadBriefingContext(supabase: LifeOsSupabaseClient, userId: string) {
  const [entitiesResult, memoriesResult, observationsResult] = await Promise.all([
    supabase
      .from("entities")
      .select("id, name, type, description, confidence, sensitivity, updated_at")
      .eq("user_id", userId)
      .eq("status", activeStatus)
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("memories")
      .select("id, entity_id, content, type, confidence, sensitivity, updated_at")
      .eq("user_id", userId)
      .eq("status", activeStatus)
      .order("updated_at", { ascending: false })
      .limit(30),
    supabase
      .from("observations")
      .select("id, content, type, confidence, sensitivity, status, created_at")
      .eq("user_id", userId)
      .in("status", recentObservationStatuses)
      .order("created_at", { ascending: false })
      .limit(20)
  ]);

  if (entitiesResult.error || memoriesResult.error || observationsResult.error) {
    throw new PublicError("Unable to load briefing context right now.", 500);
  }

  return {
    entities: (entitiesResult.data ?? []) as ContextEntity[],
    memories: (memoriesResult.data ?? []) as ContextMemory[],
    observations: (observationsResult.data ?? []) as ContextObservation[]
  };
}

async function generateBriefingWithOpenAi({
  apiKey,
  entities,
  memories,
  model,
  observations
}: {
  apiKey: string;
  entities: ContextEntity[];
  memories: ContextMemory[];
  model: string;
  observations: ContextObservation[];
}) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: JSON.stringify({
            active_entities: entities.map((entity) => ({
              id: entity.id,
              name: entity.name,
              type: entity.type,
              description: entity.description,
              confidence: entity.confidence,
              sensitivity: entity.sensitivity,
              updated_at: entity.updated_at
            })),
            active_memories: memories.map((memory) => ({
              id: memory.id,
              entity_id: memory.entity_id,
              content: memory.content,
              type: memory.type,
              confidence: memory.confidence,
              sensitivity: memory.sensitivity,
              updated_at: memory.updated_at
            })),
            recent_observations: observations.map((observation) => ({
              id: observation.id,
              content: observation.content,
              type: observation.type,
              confidence: observation.confidence,
              sensitivity: observation.sensitivity,
              status: observation.status,
              created_at: observation.created_at
            }))
          })
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "life_os_briefing",
          schema: briefingSchema,
          strict: true
        }
      }
    })
  });

  if (!response.ok) {
    throw new PublicError("Unable to generate a briefing right now.", 502);
  }

  const completion = await response.json();
  const content = completion?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new PublicError("Unable to generate a briefing right now.", 502);
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new PublicError("Unable to generate a briefing right now.", 502);
  }

  return validateAiBriefingPayload(parsed);
}

function validateAiBriefingPayload(payload: unknown): AiBriefing {
  if (!isRecord(payload)) {
    throw new PublicError("Unable to generate a briefing right now.", 502);
  }

  const title = readTrimmedString(payload.title);
  const summary = readTrimmedString(payload.summary);
  const suggestedFocus = readTrimmedString(payload.suggested_focus);
  const sections = payload.sections;

  if (!title || title.length > 80) {
    throw new PublicError("Unable to generate a briefing right now.", 502);
  }

  if (!summary || summary.length > 500) {
    throw new PublicError("Unable to generate a briefing right now.", 502);
  }

  if (!suggestedFocus || suggestedFocus.length > 240) {
    throw new PublicError("Unable to generate a briefing right now.", 502);
  }

  if (!Array.isArray(sections) || sections.length > 4) {
    throw new PublicError("Unable to generate a briefing right now.", 502);
  }

  return {
    title,
    summary,
    sections: sections.map(validateBriefingSection),
    suggested_focus: suggestedFocus
  };
}

function validateBriefingSection(value: unknown): BriefingSection {
  if (!isRecord(value)) {
    throw new PublicError("Unable to generate a briefing right now.", 502);
  }

  const heading = readTrimmedString(value.heading);
  const bullets = value.bullets;

  if (!heading || heading.length > 80) {
    throw new PublicError("Unable to generate a briefing right now.", 502);
  }

  if (!Array.isArray(bullets) || bullets.length === 0 || bullets.length > 3) {
    throw new PublicError("Unable to generate a briefing right now.", 502);
  }

  return {
    heading,
    bullets: bullets.map((bullet) => {
      const text = readTrimmedString(bullet);

      if (!text || text.length > 220) {
        throw new PublicError("Unable to generate a briefing right now.", 502);
      }

      return text;
    })
  };
}

function readRequiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new PublicError("Briefing generation is not configured.", 500);
  }

  return value;
}

function readOpenAiApiKey() {
  const value = Deno.env.get("OPENAI_API_KEY");

  if (!value) {
    throw new PublicError("Briefing generation is not configured.", 500);
  }

  return value;
}

function readTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    throw new PublicError("Unable to generate a briefing right now.", 502);
  }

  return value.trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    },
    status
  });
}

class PublicError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PublicError";
    this.status = status;
  }
}
