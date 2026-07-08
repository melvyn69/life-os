import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.1";

type Confidence = "low" | "medium" | "high";
type Sensitivity = "normal" | "sensitive";
type EntityType =
  | "person"
  | "project"
  | "place"
  | "habit"
  | "interest"
  | "object"
  | "event"
  | "value"
  | "other";

type Observation = {
  id: string;
  content: string;
  type: string;
  confidence: Confidence | "confirmed";
  sensitivity: Sensitivity;
};

type ExistingEntity = {
  id: string;
  name: string;
  type: string;
  status: string;
};

type AiEntity = {
  name: string;
  type: EntityType;
  description: string;
  importance: number;
  confidence: Confidence;
};

type AiMemory = {
  entity_name: string;
  content: string;
  confidence: Confidence;
  sensitivity: Sensitivity;
  source_observation_id: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const promptVersion = "life-os-process-observations-v1";

const entityTypes = new Set<EntityType>([
  "person",
  "project",
  "place",
  "habit",
  "interest",
  "object",
  "event",
  "value",
  "other"
]);

const confidenceLevels = new Set<Confidence>(["low", "medium", "high"]);
const sensitivityLevels = new Set<Sensitivity>(["normal", "sensitive"]);

const suggestionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    entities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: {
            type: "string",
            description: "The clear name of the entity suggested by the observations."
          },
          type: {
            type: "string",
            enum: [...entityTypes]
          },
          description: {
            type: "string",
            description: "A short cautious description grounded only in the observations."
          },
          importance: {
            type: "number",
            description: "A simple 1 to 3 importance hint for review only."
          },
          confidence: {
            type: "string",
            enum: [...confidenceLevels]
          }
        },
        required: ["name", "type", "description", "importance", "confidence"]
      }
    },
    memories: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          entity_name: {
            type: "string",
            description: "The matching entity name when there is one, otherwise an empty string."
          },
          content: {
            type: "string",
            description: "A cautious memory candidate grounded only in the observations."
          },
          confidence: {
            type: "string",
            enum: [...confidenceLevels]
          },
          sensitivity: {
            type: "string",
            enum: [...sensitivityLevels]
          },
          source_observation_id: {
            type: "string",
            description: "One of the observation IDs supplied in the request context."
          }
        },
        required: ["entity_name", "content", "confidence", "sensitivity", "source_observation_id"]
      }
    }
  },
  required: ["entities", "memories"]
};

const systemPrompt = [
  "You are the memory structuring layer of a personal life companion.",
  "From suggested observations, identify only clear entities and useful memory candidates.",
  "An entity can be a person, project, place, habit, interest, object, event, value, or other clear life element.",
  "Do not create entities from weak assumptions.",
  "Do not create sensitive memories unless explicitly stated in the observations.",
  "Do not diagnose, infer hidden motives, score the user, or make psychological conclusions.",
  "Do not invent facts, dates, names, identifiers, relationships, or sources.",
  "Use only observation IDs that were supplied in the user message.",
  "Prefer fewer, clearer suggestions over broad interpretation.",
  "All entities and memories are suggestions for user review, never active memory.",
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
    const captureId = await readCaptureId(request);
    const authorization = request.headers.get("Authorization");

    if (!authorization) {
      return jsonResponse({ error: "Missing authorization header." }, 401);
    }

    const supabaseUrl = readEnv("SUPABASE_URL");
    const supabaseAnonKey = readEnv("SUPABASE_ANON_KEY");
    const openAiKey = readEnv("OPENAI_API_KEY");
    const openAiModel = readEnv("OPENAI_MODEL");

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization
        }
      }
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    const user = userData.user;

    if (!user) {
      return jsonResponse({ error: "You must be signed in to process observations." }, 401);
    }

    const { data: capture, error: captureError } = await supabase
      .from("captures")
      .select("id, user_id, content, status")
      .eq("id", captureId)
      .eq("user_id", user.id)
      .single();

    if (captureError || !capture) {
      return jsonResponse({ error: "Capture not found." }, 404);
    }

    if (capture.status === "deleted") {
      return jsonResponse({ error: "Deleted captures cannot be processed." }, 400);
    }

    const { data: observations, error: observationsError } = await supabase
      .from("observations")
      .select("id, content, type, confidence, sensitivity")
      .eq("capture_id", capture.id)
      .eq("user_id", user.id)
      .eq("status", "suggested")
      .order("created_at", { ascending: true });

    if (observationsError) {
      throw observationsError;
    }

    const suggestedObservations = (observations ?? []) as Observation[];

    if (suggestedObservations.length === 0) {
      return jsonResponse({
        entities: [],
        memories: [],
        prompt_version: promptVersion
      });
    }

    const { data: existingEntities, error: entitiesError } = await supabase
      .from("entities")
      .select("id, name, type, status")
      .eq("user_id", user.id)
      .in("status", ["suggested", "active", "confirmed"]);

    if (entitiesError) {
      throw entitiesError;
    }

    const aiSuggestions = await suggestEntitiesAndMemoriesWithOpenAi({
      apiKey: openAiKey,
      captureContent: capture.content,
      existingEntities: (existingEntities ?? []) as ExistingEntity[],
      model: openAiModel,
      observations: suggestedObservations
    });

    const observationIds = new Set(suggestedObservations.map((observation) => observation.id));
    const observationById = new Map(
      suggestedObservations.map((observation) => [observation.id, observation])
    );
    const existingEntityByName = new Map(
      ((existingEntities ?? []) as ExistingEntity[]).map((entity) => [
        normalizeName(entity.name),
        entity
      ])
    );

    const entitiesToInsert = aiSuggestions.entities
      .filter((entity) => entity.confidence !== "low")
      .filter((entity) => !existingEntityByName.has(normalizeName(entity.name)))
      .map((entity) => ({
        confidence: entity.confidence,
        description: entity.description,
        name: entity.name,
        sensitivity: hasSensitiveObservation(suggestedObservations) ? "sensitive" as const : "normal" as const,
        status: "suggested" as const,
        type: entity.type,
        user_id: user.id
      }));

    const insertedEntities = entitiesToInsert.length > 0
      ? await insertEntities(supabase, entitiesToInsert)
      : [];

    for (const entity of insertedEntities) {
      existingEntityByName.set(normalizeName(entity.name), {
        id: entity.id,
        name: entity.name,
        status: entity.status,
        type: entity.type
      });
    }

    const existingMemories = await listExistingSuggestedMemoriesForObservations(
      supabase,
      user.id,
      [...observationIds]
    );
    const existingMemoryKeys = new Set(
      existingMemories.map((memory) => buildMemoryKey(memory.observation_id, memory.content))
    );

    const memoriesToInsert = aiSuggestions.memories
      .filter((memory) => observationIds.has(memory.source_observation_id))
      .filter((memory) => !existingMemoryKeys.has(buildMemoryKey(memory.source_observation_id, memory.content)))
      .map((memory) => {
        const matchingEntity = existingEntityByName.get(normalizeName(memory.entity_name));
        const sourceObservation = observationById.get(memory.source_observation_id);

        return {
          confidence: memory.confidence,
          content: memory.content,
          entity_id: matchingEntity?.id ?? null,
          observation_id: memory.source_observation_id,
          sensitivity: memory.sensitivity === "sensitive" || sourceObservation?.sensitivity === "sensitive"
            ? "sensitive" as const
            : "normal" as const,
          status: "suggested" as const,
          type: "fact",
          user_id: user.id
        };
      });

    const insertedMemories = memoriesToInsert.length > 0
      ? await insertMemories(supabase, memoriesToInsert)
      : [];

    return jsonResponse({
      entities: insertedEntities,
      memories: insertedMemories,
      prompt_version: promptVersion
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process observations.";
    return jsonResponse({ error: message }, 400);
  }
});

async function suggestEntitiesAndMemoriesWithOpenAi({
  apiKey,
  captureContent,
  existingEntities,
  model,
  observations
}: {
  apiKey: string;
  captureContent: string;
  existingEntities: ExistingEntity[];
  model: string;
  observations: Observation[];
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
            capture: {
              content: captureContent
            },
            existing_entities: existingEntities.map((entity) => ({
              id: entity.id,
              name: entity.name,
              status: entity.status,
              type: entity.type
            })),
            observations: observations.map((observation) => ({
              id: observation.id,
              content: observation.content,
              confidence: observation.confidence,
              sensitivity: observation.sensitivity,
              type: observation.type
            }))
          })
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "life_os_entity_memory_suggestions",
          schema: suggestionSchema,
          strict: true
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI request failed: ${errorText}`);
  }

  const completion = await response.json();
  const content = completion?.choices?.[0]?.message?.content;

  if (typeof content !== "string") {
    throw new Error("OpenAI returned no JSON content.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned malformed JSON.");
  }

  return validateAiSuggestionPayload(parsed, new Set(observations.map((observation) => observation.id)));
}

function validateAiSuggestionPayload(payload: unknown, observationIds: Set<string>) {
  if (!isRecord(payload)) {
    throw new Error("AI response must be an object.");
  }

  const entities = payload.entities;
  const memories = payload.memories;

  if (!Array.isArray(entities)) {
    throw new Error("AI response entities must be an array.");
  }

  if (!Array.isArray(memories)) {
    throw new Error("AI response memories must be an array.");
  }

  if (entities.length > 8) {
    throw new Error("AI response returned too many entities.");
  }

  if (memories.length > 8) {
    throw new Error("AI response returned too many memories.");
  }

  return {
    entities: entities.map(validateAiEntity),
    memories: memories.map((memory) => validateAiMemory(memory, observationIds))
  };
}

function validateAiEntity(value: unknown): AiEntity {
  if (!isRecord(value)) {
    throw new Error("AI entity must be an object.");
  }

  const name = readString(value.name, "name").trim();
  const type = readEntityType(value.type);
  const description = readString(value.description, "description").trim();
  const importance = readImportance(value.importance);
  const confidence = readConfidence(value.confidence);

  if (!name) {
    throw new Error("AI entity name is required.");
  }

  if (name.length > 120) {
    throw new Error("AI entity name is too long.");
  }

  if (description.length > 500) {
    throw new Error("AI entity description is too long.");
  }

  return {
    name,
    type,
    description,
    importance,
    confidence
  };
}

function validateAiMemory(value: unknown, observationIds: Set<string>): AiMemory {
  if (!isRecord(value)) {
    throw new Error("AI memory must be an object.");
  }

  const entityName = readString(value.entity_name, "entity_name").trim();
  const content = readString(value.content, "content").trim();
  const confidence = readConfidence(value.confidence);
  const sensitivity = readSensitivity(value.sensitivity);
  const sourceObservationId = readString(value.source_observation_id, "source_observation_id").trim();

  if (!content) {
    throw new Error("AI memory content is required.");
  }

  if (content.length > 700) {
    throw new Error("AI memory content is too long.");
  }

  if (!observationIds.has(sourceObservationId)) {
    throw new Error("AI memory source observation is invalid.");
  }

  return {
    entity_name: entityName,
    content,
    confidence,
    sensitivity,
    source_observation_id: sourceObservationId
  };
}

async function insertEntities(
  supabase: ReturnType<typeof createClient>,
  entities: Array<{
    confidence: Confidence;
    description: string;
    name: string;
    sensitivity: Sensitivity;
    status: "suggested";
    type: EntityType;
    user_id: string;
  }>
) {
  const { data, error } = await supabase.from("entities").insert(entities).select();

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function insertMemories(
  supabase: ReturnType<typeof createClient>,
  memories: Array<{
    confidence: Confidence;
    content: string;
    entity_id: string | null;
    observation_id: string;
    sensitivity: Sensitivity;
    status: "suggested";
    type: string;
    user_id: string;
  }>
) {
  const { data, error } = await supabase.from("memories").insert(memories).select();

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function listExistingSuggestedMemoriesForObservations(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  observationIds: string[]
) {
  if (observationIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("memories")
    .select("observation_id, content")
    .eq("user_id", userId)
    .in("observation_id", observationIds)
    .in("status", ["suggested", "active", "confirmed"]);

  if (error) {
    throw error;
  }

  return (data ?? []) as Array<{ observation_id: string | null; content: string }>;
}

async function readCaptureId(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new Error("Request body must be JSON.");
  }

  if (!isRecord(body)) {
    throw new Error("Request body must be an object.");
  }

  const captureId = readString(body.capture_id, "capture_id").trim();

  if (!captureId) {
    throw new Error("capture_id is required.");
  }

  return captureId;
}

function readEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`Missing ${name}.`);
  }

  return value;
}

function readString(value: unknown, field: string) {
  if (typeof value !== "string") {
    throw new Error(`AI response field ${field} must be a string.`);
  }

  return value;
}

function readImportance(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("AI response importance must be a number.");
  }

  if (value < 1 || value > 3) {
    throw new Error("AI response importance must be between 1 and 3.");
  }

  return value;
}

function readEntityType(value: unknown): EntityType {
  const type = readString(value, "type");

  if (!entityTypes.has(type as EntityType)) {
    throw new Error("AI response entity type is invalid.");
  }

  return type as EntityType;
}

function readConfidence(value: unknown): Confidence {
  const confidence = readString(value, "confidence");

  if (!confidenceLevels.has(confidence as Confidence)) {
    throw new Error("AI response confidence is invalid.");
  }

  return confidence as Confidence;
}

function readSensitivity(value: unknown): Sensitivity {
  const sensitivity = readString(value, "sensitivity");

  if (!sensitivityLevels.has(sensitivity as Sensitivity)) {
    throw new Error("AI response sensitivity is invalid.");
  }

  return sensitivity as Sensitivity;
}

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase();
}

function buildMemoryKey(observationId: string | null, content: string) {
  return `${observationId ?? "none"}:${content.trim().toLocaleLowerCase()}`;
}

function hasSensitiveObservation(observations: Observation[]) {
  return observations.some((observation) => observation.sensitivity === "sensitive");
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
