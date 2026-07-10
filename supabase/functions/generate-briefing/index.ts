import {
  createClient,
  type SupabaseClient
} from "https://esm.sh/@supabase/supabase-js@2.110.1";
import type { Database } from "../_shared/database.ts";
import {
  getBriefingRelationshipUsage,
  isRecord,
  readOpenAiJsonContent,
  type RelationshipSensitivity
} from "../_shared/life-graph.ts";
import { logSafeOperation, type ApiErrorCode } from "../_shared/http.ts";
import { OpenAiRequestError, requestOpenAiJson } from "../_shared/openai.ts";

type LifeOsSupabaseClient = SupabaseClient<Database>;
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

type ContextRelationship = {
  id: string;
  source_entity_name: string;
  target_entity_name: string;
  relationship_type: string;
  status: "suggested" | "supported" | "confirmed";
  explanation: string | null;
  start_date: string | null;
  end_date: string | null;
  sensitivity: RelationshipSensitivity;
  is_visible: boolean;
};

type StoredContextRelationship = {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  status: ContextRelationship["status"];
  explanation: string | null;
  start_date: string | null;
  end_date: string | null;
  sensitivity: RelationshipSensitivity;
  is_visible: boolean;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const activeStatus = "active";
const recentObservationStatuses: LifeOsStatus[] = ["suggested", "active", "confirmed"];
const promptVersion = "life-os-generate-briefing-v3";

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
  "Relationship facts are allowed as facts because the server supplied only relationships authorized by the canonical status, visibility, sensitivity, and contradiction rules.",
  "Relationship possibilities must always be phrased as possibilities and never converted into facts.",
  "Do not infer any relationship meaning beyond the supplied canonical relationship type and explanation.",
  "Do not invent facts.",
  "Do not present observations or suggestions as certainty.",
  "Do not be motivational in an exaggerated way.",
  "Do not make medical, legal, or financial decisions.",
  "Do not give orders.",
  "Keep it concise and simple.",
  "Return JSON only."
].join("\n");

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  let userId: string | null = null;
  let result: "success" | "failure" = "failure";
  let errorCode: ApiErrorCode | null = null;
  let metrics: Record<string, number> = {};

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({
      error: {
        code: "INVALID_INPUT",
        message: "Method not allowed.",
        request_id: requestId
      }
    }, 405);
  }

  try {
    const authorization = request.headers.get("Authorization");

    if (!authorization) {
      throw new PublicError("Sign in to generate a briefing.", 401);
    }

    const supabaseUrl = readRequiredEnv("SUPABASE_URL");
    const supabaseAnonKey = readRequiredEnv("SUPABASE_ANON_KEY");

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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

    userId = userData.user.id;
    const relationshipContextEnabled = readOptionalBooleanEnv(
      "LIFE_GRAPH_BRIEFING_ENABLED",
      true
    );
    const { entities, memories, observations, relationshipFacts, relationshipPossibilities } =
      await loadBriefingContext(supabase, userId, relationshipContextEnabled);

    metrics = {
      entities_loaded: entities.length,
      memories_loaded: memories.length,
      observations_loaded: observations.length,
      relationship_facts_loaded: relationshipFacts.length,
      relationship_possibilities_loaded: relationshipPossibilities.length
    };

    if (
      entities.length === 0 &&
      memories.length === 0 &&
      observations.length === 0 &&
      relationshipFacts.length === 0 &&
      relationshipPossibilities.length === 0
    ) {
      throw new PublicError("There is not enough memory to generate a briefing yet.", 400);
    }

    const briefing = await generateBriefingWithOpenAi({
      apiKey: readOpenAiApiKey(),
      entities,
      memories,
      model: readRequiredEnv("OPENAI_MODEL"),
      observations,
      relationshipFacts,
      relationshipPossibilities
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

    result = "success";
    return jsonResponse({ briefing: insertedBriefing, prompt_version: promptVersion });
  } catch (error) {
    if (error instanceof PublicError) {
      errorCode = error.code;
      return jsonResponse({ error: { code: error.code, message: error.message, request_id: requestId } }, error.status);
    }

    console.error(
      "Unexpected briefing generation error.",
      error instanceof Error ? error.name : typeof error
    );

    errorCode = "INTERNAL_ERROR";
    return jsonResponse({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unable to generate a briefing right now.",
        request_id: requestId
      }
    }, 500);
  } finally {
    await logSafeOperation({
      operation: "generate_briefing",
      requestId,
      userId,
      result,
      durationMs: performance.now() - startedAt,
      errorCode,
      promptVersion,
      metrics
    });
  }
});

async function loadBriefingContext(
  supabase: LifeOsSupabaseClient,
  userId: string,
  relationshipContextEnabled: boolean
) {
  const relationshipQuery = relationshipContextEnabled
    ? supabase
        .from("relationships")
        .select(
          "id, source_entity_id, target_entity_id, relationship_type, status, explanation, start_date, end_date, sensitivity, is_visible"
        )
        .eq("user_id", userId)
        .eq("is_visible", true)
        .or("status.eq.confirmed,and(status.eq.supported,sensitivity.eq.normal),and(status.eq.suggested,sensitivity.eq.normal)")
        .order("updated_at", { ascending: false })
        .limit(25)
    : Promise.resolve({ data: [], error: null });

  const [
    entitiesResult,
    memoriesResult,
    observationsResult,
    contradictionsResult,
    relationshipsResult
  ] = await Promise.all([
    supabase
      .from("entities")
      .select("id, name, type, description, confidence, sensitivity, updated_at")
      .eq("user_id", userId)
      .eq("status", activeStatus)
      .in("confidence", ["high", "confirmed"])
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("memories")
      .select("id, entity_id, content, type, confidence, sensitivity, updated_at")
      .eq("user_id", userId)
      .eq("status", activeStatus)
      .in("confidence", ["high", "confirmed"])
      .order("updated_at", { ascending: false })
      .limit(30),
    supabase
      .from("observations")
      .select("id, content, type, confidence, sensitivity, status, created_at")
      .eq("user_id", userId)
      .in("status", recentObservationStatuses)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("memory_contradictions")
      .select("entity_id, memory_id")
      .eq("user_id", userId)
      .eq("resolution_status", "unresolved")
      .in("status", ["suggested", "active"]),
    relationshipQuery
  ]);

  if (
    entitiesResult.error ||
    memoriesResult.error ||
    observationsResult.error ||
    contradictionsResult.error ||
    relationshipsResult.error
  ) {
    throw new PublicError("Unable to load briefing context right now.", 500);
  }

  const contradictedEntityIds = new Set(
    (contradictionsResult.data ?? []).flatMap((contradiction) => contradiction.entity_id ? [contradiction.entity_id] : [])
  );
  const contradictedMemoryIds = new Set(
    (contradictionsResult.data ?? []).flatMap((contradiction) => contradiction.memory_id ? [contradiction.memory_id] : [])
  );
  const relationshipRows = parseRelationshipContextRows(relationshipsResult.data ?? []);
  const relationshipEntityIds = [...new Set(relationshipRows.flatMap((relationship) => [
    relationship.source_entity_id,
    relationship.target_entity_id
  ]))];
  const relationshipEntityNames = new Map<string, string>();

  if (relationshipEntityIds.length > 0) {
    const { data: relationshipEntities, error: relationshipEntitiesError } = await supabase
      .from("entities")
      .select("id, name")
      .eq("user_id", userId)
      .in("id", relationshipEntityIds)
      .not("status", "in", "(hidden,archived,deleted)");

    if (relationshipEntitiesError) {
      throw new PublicError("Unable to load briefing context right now.", 500);
    }

    for (const entity of relationshipEntities ?? []) {
      relationshipEntityNames.set(entity.id, entity.name);
    }
  }

  const relationships = relationshipRows.flatMap((relationship): ContextRelationship[] => {
    const sourceEntityName = relationshipEntityNames.get(relationship.source_entity_id);
    const targetEntityName = relationshipEntityNames.get(relationship.target_entity_id);

    if (!sourceEntityName || !targetEntityName) {
      return [];
    }

    return [{
      id: relationship.id,
      source_entity_name: sourceEntityName,
      target_entity_name: targetEntityName,
      relationship_type: relationship.relationship_type,
      status: relationship.status,
      explanation: relationship.explanation,
      start_date: relationship.start_date,
      end_date: relationship.end_date,
      sensitivity: relationship.sensitivity,
      is_visible: relationship.is_visible
    }];
  });

  return {
    entities: parseContextEntities(entitiesResult.data ?? []).filter(
      (entity) => !contradictedEntityIds.has(entity.id)
    ),
    memories: parseContextMemories(memoriesResult.data ?? []).filter(
      (memory) => !contradictedMemoryIds.has(memory.id)
    ),
    observations: parseContextObservations(observationsResult.data ?? []),
    relationshipFacts: relationships.filter((relationship) =>
      getBriefingRelationshipUsage({
        status: relationship.status,
        sensitivity: relationship.sensitivity,
        isVisible: relationship.is_visible
      }) === "fact"
    ),
    relationshipPossibilities: relationships
      .filter((relationship) => getBriefingRelationshipUsage({
        status: relationship.status,
        sensitivity: relationship.sensitivity,
        isVisible: relationship.is_visible
      }) === "possibility")
      .slice(0, 5)
  };
}

async function generateBriefingWithOpenAi({
  apiKey,
  entities,
  memories,
  model,
  observations,
  relationshipFacts,
  relationshipPossibilities
}: {
  apiKey: string;
  entities: ContextEntity[];
  memories: ContextMemory[];
  model: string;
  observations: ContextObservation[];
  relationshipFacts: ContextRelationship[];
  relationshipPossibilities: ContextRelationship[];
}) {
  let completion: unknown;
  try {
    completion = await requestOpenAiJson({
      apiKey,
      body: {
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
              })),
              relationship_facts: relationshipFacts,
              relationship_possibilities: relationshipPossibilities
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
      }
    });
  } catch (error) {
    if (error instanceof OpenAiRequestError && error.failure === "invalid_json") {
      throw new PublicError("Unable to generate a briefing right now.", 502, "AI_OUTPUT_INVALID");
    }
    throw new PublicError("Unable to generate a briefing right now.", 502, "AI_UNAVAILABLE");
  }

  try {
    const content = readOpenAiJsonContent(completion);
    const parsed: unknown = JSON.parse(content);
    return validateAiBriefingPayload(parsed);
  } catch {
    throw new PublicError("Unable to generate a briefing right now.", 502, "AI_OUTPUT_INVALID");
  }
}

function parseContextEntities(values: unknown[]): ContextEntity[] {
  return values.map((value) => {
    if (!isRecord(value)) {
      throw new PublicError("Unable to load briefing context right now.", 500);
    }

    return {
      id: readStoredString(value.id),
      name: readStoredString(value.name),
      type: readStoredString(value.type),
      description: readStoredNullableString(value.description),
      confidence: readStoredConfidence(value.confidence),
      sensitivity: readStoredSensitivity(value.sensitivity),
      updated_at: readStoredString(value.updated_at)
    };
  });
}

function parseContextMemories(values: unknown[]): ContextMemory[] {
  return values.map((value) => {
    if (!isRecord(value)) {
      throw new PublicError("Unable to load briefing context right now.", 500);
    }

    return {
      id: readStoredString(value.id),
      entity_id: readStoredNullableString(value.entity_id),
      content: readStoredString(value.content),
      type: readStoredString(value.type),
      confidence: readStoredConfidence(value.confidence),
      sensitivity: readStoredSensitivity(value.sensitivity),
      updated_at: readStoredString(value.updated_at)
    };
  });
}

function parseContextObservations(values: unknown[]): ContextObservation[] {
  return values.map((value) => {
    if (!isRecord(value)) {
      throw new PublicError("Unable to load briefing context right now.", 500);
    }

    return {
      id: readStoredString(value.id),
      content: readStoredString(value.content),
      type: readStoredString(value.type),
      confidence: readStoredConfidence(value.confidence),
      sensitivity: readStoredSensitivity(value.sensitivity),
      status: readStoredLifeOsStatus(value.status),
      created_at: readStoredString(value.created_at)
    };
  });
}

function parseRelationshipContextRows(values: unknown[]): StoredContextRelationship[] {
  return values.map((value) => {
    if (!isRecord(value)) {
      throw new PublicError("Unable to load briefing context right now.", 500);
    }

    return {
      id: readStoredString(value.id),
      source_entity_id: readStoredString(value.source_entity_id),
      target_entity_id: readStoredString(value.target_entity_id),
      relationship_type: readStoredString(value.relationship_type),
      status: readBriefingRelationshipStatus(value.status),
      explanation: readStoredNullableString(value.explanation),
      start_date: readStoredNullableString(value.start_date),
      end_date: readStoredNullableString(value.end_date),
      sensitivity: readStoredRelationshipSensitivity(value.sensitivity),
      is_visible: readStoredBoolean(value.is_visible)
    };
  });
}

function readStoredString(value: unknown) {
  if (typeof value !== "string") {
    throw new PublicError("Unable to load briefing context right now.", 500);
  }

  return value;
}

function readStoredNullableString(value: unknown): string | null {
  if (value === null) {
    return null;
  }

  return readStoredString(value);
}

function readStoredConfidence(value: unknown): Confidence {
  if (value === "low" || value === "medium" || value === "high" || value === "confirmed") {
    return value;
  }

  throw new PublicError("Unable to load briefing context right now.", 500);
}

function readStoredSensitivity(value: unknown): Sensitivity {
  if (value === "normal" || value === "sensitive") {
    return value;
  }

  throw new PublicError("Unable to load briefing context right now.", 500);
}

function readStoredLifeOsStatus(value: unknown): LifeOsStatus {
  if (
    value === "suggested" ||
    value === "active" ||
    value === "confirmed" ||
    value === "hidden" ||
    value === "archived" ||
    value === "deleted"
  ) {
    return value;
  }

  throw new PublicError("Unable to load briefing context right now.", 500);
}

function readBriefingRelationshipStatus(value: unknown): ContextRelationship["status"] {
  if (value === "suggested" || value === "supported" || value === "confirmed") {
    return value;
  }

  throw new PublicError("Unable to load briefing context right now.", 500);
}

function readStoredRelationshipSensitivity(value: unknown): RelationshipSensitivity {
  if (value === "normal" || value === "sensitive" || value === "highly_sensitive") {
    return value;
  }
  throw new PublicError("Unable to load briefing context right now.", 500);
}

function readStoredBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }
  throw new PublicError("Unable to load briefing context right now.", 500);
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

function readOptionalBooleanEnv(name: string, defaultValue: boolean) {
  const value = Deno.env.get(name);
  if (value === undefined || value === "") {
    return defaultValue;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  throw new PublicError("Briefing generation is not configured.", 500);
}

function readTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    throw new PublicError("Unable to generate a briefing right now.", 502);
  }

  return value.trim();
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
  code: ApiErrorCode;
  status: number;

  constructor(message: string, status: number, code = inferErrorCode(status)) {
    super(message);
    this.name = "PublicError";
    this.code = code;
    this.status = status;
  }
}

function inferErrorCode(status: number): ApiErrorCode {
  if (status === 401) return "AUTH_REQUIRED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 502) return "AI_UNAVAILABLE";
  if (status >= 500) return "INTERNAL_ERROR";
  return "INVALID_INPUT";
}
