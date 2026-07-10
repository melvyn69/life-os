import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.1";

type LifeOsSupabaseClient = ReturnType<typeof createClient<any>>;
type Confidence = "low" | "medium" | "high";
type StoredConfidence = Confidence | "confirmed";
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
  capture_id?: string | null;
  id: string;
  content: string;
  type: string;
  confidence: Confidence | "confirmed";
  sensitivity: Sensitivity;
  created_at?: string;
};

type ExistingEntity = {
  confidence: StoredConfidence;
  description: string | null;
  id: string;
  name: string;
  sensitivity: Sensitivity;
  type: string;
  status: string;
};

type ExistingMemory = {
  confidence: StoredConfidence;
  content: string;
  entity_id: string | null;
  id: string;
  observation_id: string | null;
  sensitivity: Sensitivity;
  status: string;
};

type EntityMatch = {
  entity: ExistingEntity;
  confidence: "high";
  reason: "exact_name" | "unique_person_name_part";
};

type DuplicateCandidateReason =
  | "nickname"
  | "first_name_last_initial"
  | "unique_first_name"
  | "similar_distinctive_name";

type DuplicateCandidate = {
  user_id: string;
  candidate_name: string | null;
  entity_id: string | null;
  duplicate_entity_id: string;
  reason: DuplicateCandidateReason;
  confidence: "medium" | "high";
  status: "suggested";
};

type ContradictionType = "date" | "location" | "organization" | "project_status" | "role";

type ContradictionFact = {
  raw: string;
  subject: string | null;
  type: ContradictionType;
  value: string;
};

type ContradictionEvidence = {
  content: string;
  entityId: string | null;
  observationId: string | null;
};

type MemoryContradiction = {
  user_id: string;
  observation_id: string | null;
  entity_id: string | null;
  memory_id: string | null;
  existing_record_type: "entity" | "memory";
  contradiction_type: ContradictionType;
  existing_content: string;
  new_content: string;
  reason: string;
  confidence: "medium" | "high";
  resolution_status: "unresolved";
  status: "suggested";
};

type EvidenceDirection = "supports" | "contradicts";

type MemoryEvidence = {
  user_id: string;
  observation_id: string;
  entity_id: string | null;
  memory_id: string | null;
  direction: EvidenceDirection;
  reason: string;
};

type ConfidenceChange = {
  evidence_observation_ids: string[];
  record_type: "entity" | "memory";
  record_id: string;
  previous_confidence: Confidence;
  confidence: Confidence;
  independent_source_count: number;
  reason: string;
};

type ConfidenceTarget = {
  confidence: StoredConfidence;
  id: string;
  sensitivity: Sensitivity;
  status: string;
};

type AiEntity = {
  name: string;
  type: EntityType;
  description: string;
  importance: number;
  confidence: Confidence;
  source_observation_ids: string[];
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

const promptVersion = "life-os-process-observations-v4";

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
const ignoredReferenceStarts = new Set(["a", "an", "i", "need", "notebook", "remember", "the"]);
const genericNameTokens = new Set([
  "app",
  "company",
  "group",
  "idea",
  "inc",
  "life",
  "new",
  "notes",
  "old",
  "plan",
  "project",
  "team",
  "the",
  "work"
]);

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
          },
          source_observation_ids: {
            type: "array",
            items: {
              type: "string"
            },
            minItems: 1,
            maxItems: 8,
            description: "Observation IDs that directly support this entity suggestion."
          }
        },
        required: ["name", "type", "description", "importance", "confidence", "source_observation_ids"]
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
  "Every entity suggestion must list the observation IDs that directly support it.",
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
      throw new PublicError("Sign in to suggest memory.", 401);
    }

    const supabaseUrl = readEnv("SUPABASE_URL");
    const supabaseAnonKey = readEnv("SUPABASE_ANON_KEY");
    const openAiKey = readEnv("OPENAI_API_KEY");
    const openAiModel = readEnv("OPENAI_MODEL");

    const supabase = createClient<any>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization
        }
      }
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new PublicError("Sign in to suggest memory.", 401);
    }

    const user = userData.user;

    const { data: capture, error: captureError } = await supabase
      .from("captures")
      .select("id, user_id, content, status")
      .eq("id", captureId)
      .eq("user_id", user.id)
      .single();

    if (captureError || !capture) {
      throw new PublicError("Capture not found.", 404);
    }

    if (capture.status === "deleted") {
      throw new PublicError("Deleted captures cannot be processed.", 400);
    }

    const { data: observations, error: observationsError } = await supabase
      .from("observations")
      .select("id, capture_id, content, type, confidence, sensitivity, created_at")
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
      .select("id, name, type, description, confidence, sensitivity, status")
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
    const knownEntities = (existingEntities ?? []) as ExistingEntity[];
    const existingEntityIds = new Set(knownEntities.map((entity) => entity.id));
    const existingEntityByName = new Map(
      knownEntities.map((entity) => [
        normalizeName(entity.name),
        entity
      ])
    );
    const entityMatchBySuggestedName = new Map<string, EntityMatch>();
    const entityNamesToInsert = new Set<string>();

    const suggestedEntities = aiSuggestions.entities.filter((entity) => entity.confidence !== "low");
    const entitiesToInsert = suggestedEntities
      .flatMap((entity) => {
        const normalizedEntityName = normalizeName(entity.name);
        const match = findExistingEntityMatch(entity, knownEntities);

        if (match) {
          entityMatchBySuggestedName.set(normalizedEntityName, match);
          existingEntityByName.set(normalizedEntityName, match.entity);
          return [];
        }

        if (entityNamesToInsert.has(normalizedEntityName)) {
          return [];
        }

        entityNamesToInsert.add(normalizedEntityName);

        return [{
          confidence: "low" as const,
          description: entity.description,
          name: entity.name,
          sensitivity: hasSensitiveObservation(suggestedObservations) ? "sensitive" as const : "normal" as const,
          status: "suggested" as const,
          type: entity.type,
          user_id: user.id
        }];
      });

    const insertedEntities = entitiesToInsert.length > 0
      ? await insertEntities(supabase, entitiesToInsert)
      : [];

    for (const entity of insertedEntities) {
      const insertedEntity = {
        confidence: entity.confidence,
        description: entity.description,
        id: entity.id,
        name: entity.name,
        sensitivity: entity.sensitivity,
        status: entity.status,
        type: entity.type
      };

      existingEntityByName.set(normalizeName(entity.name), {
        ...insertedEntity
      });
      knownEntities.push(insertedEntity);
    }

    const duplicateCandidates = [
      ...buildDuplicateCandidates({
        allEntities: knownEntities,
        candidateEntities: knownEntities.filter((entity) => !existingEntityIds.has(entity.id)),
        userId: user.id
      }),
      ...buildReferenceDuplicateCandidates({
        existingEntities: knownEntities.filter((entity) => existingEntityIds.has(entity.id)),
        observations: suggestedObservations,
        userId: user.id
      })
    ];
    const insertedDuplicateCandidates = duplicateCandidates.length > 0
      ? await insertDuplicateCandidates(supabase, user.id, duplicateCandidates)
      : [];

    const existingMemories = await listExistingMemories(supabase, user.id);
    const existingMemoryKeys = new Set(
      existingMemories.map((memory) => buildMemoryKey(memory.observation_id, memory.content))
    );
    const matchedMemoryEvidence: MemoryEvidence[] = [];

    const memoriesToInsert = aiSuggestions.memories
      .filter((memory) => observationIds.has(memory.source_observation_id))
      .filter((memory) => !existingMemoryKeys.has(buildMemoryKey(memory.source_observation_id, memory.content)))
      .flatMap((memory) => {
        const matchingEntity = resolveMemoryEntity(memory, knownEntities, existingEntityByName, entityMatchBySuggestedName);
        const sourceObservation = observationById.get(memory.source_observation_id);
        const existingMemory = findExistingMemoryMatch(
          memory.content,
          matchingEntity?.id ?? null,
          existingMemories
        );

        if (existingMemory) {
          matchedMemoryEvidence.push({
            direction: "supports",
            entity_id: null,
            memory_id: existingMemory.id,
            observation_id: memory.source_observation_id,
            reason: "The source observation repeats this existing memory candidate.",
            user_id: user.id
          });
          return [];
        }

        return [{
          confidence: "low" as const,
          content: memory.content,
          entity_id: matchingEntity?.id ?? null,
          observation_id: memory.source_observation_id,
          sensitivity: memory.sensitivity === "sensitive" || sourceObservation?.sensitivity === "sensitive"
            ? "sensitive" as const
            : "normal" as const,
          status: "suggested" as const,
          type: "fact",
          user_id: user.id
        }];
      });

    const existingConfirmedMemories = await listExistingConfirmedMemories(supabase, user.id);
    const contradictionEvidence = buildContradictionEvidence({
      knownEntities,
      memoriesToInsert,
      observations: suggestedObservations
    });
    const contradictionCandidates = buildMemoryContradictions({
      evidence: contradictionEvidence,
      existingEntities: knownEntities,
      existingMemories: existingConfirmedMemories,
      userId: user.id
    });
    const insertedContradictions = contradictionCandidates.length > 0
      ? await insertMemoryContradictions(supabase, user.id, contradictionCandidates)
      : [];

    const insertedMemories = memoriesToInsert.length > 0
      ? await insertMemories(supabase, memoriesToInsert)
      : [];
    const evidenceCandidates = [
      ...buildSupportingEntityEvidence({
        entities: suggestedEntities,
        entityByName: existingEntityByName,
        entityMatchBySuggestedName,
        userId: user.id
      }),
      ...buildExactEntityReferenceEvidence({
        entities: knownEntities,
        observations: suggestedObservations,
        userId: user.id
      }),
      ...buildExactMemoryReferenceEvidence({
        memories: existingMemories,
        observations: suggestedObservations,
        userId: user.id
      }),
      ...matchedMemoryEvidence,
      ...buildSupportingMemoryEvidence(insertedMemories, user.id),
      ...buildContradictingEvidence(insertedContradictions, user.id)
    ];
    const insertedEvidence = evidenceCandidates.length > 0
      ? await insertMemoryEvidence(supabase, user.id, evidenceCandidates)
      : [];
    const confidenceChanges = insertedEvidence.length > 0
      ? await evolveConfidenceFromEvidence(supabase, user.id, insertedEvidence)
      : [];

    return jsonResponse({
      confidence_changes: confidenceChanges,
      contradictions: insertedContradictions,
      duplicate_candidates: insertedDuplicateCandidates,
      evidence: insertedEvidence,
      entities: insertedEntities,
      memories: insertedMemories,
      prompt_version: promptVersion
    });
  } catch (error) {
    if (error instanceof PublicError) {
      return jsonResponse({ error: error.message }, error.status);
    }

    console.error(
      "Unexpected observation processing error.",
      error instanceof Error ? error.name : typeof error
    );

    return jsonResponse({ error: "Unable to suggest memory right now." }, 500);
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
    throw new Error("OpenAI request failed.");
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

function getIndependentEvidenceObservations(observations: Array<Pick<Observation, "capture_id" | "confidence" | "content" | "created_at" | "id" | "sensitivity" | "type">>) {
  const observationsBySource = new Map<string, Pick<Observation, "capture_id" | "confidence" | "content" | "created_at" | "id" | "sensitivity" | "type">>();

  for (const observation of observations) {
    const sourceKey = observation.capture_id
      ? `capture:${observation.capture_id}`
      : `observation:${observation.id}`;

    if (!observationsBySource.has(sourceKey)) {
      observationsBySource.set(sourceKey, observation);
    }
  }

  return [...observationsBySource.values()]
    .sort((left, right) => (left.created_at ?? "").localeCompare(right.created_at ?? ""));
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
    entities: entities.map((entity) => validateAiEntity(entity, observationIds)),
    memories: memories.map((memory) => validateAiMemory(memory, observationIds))
  };
}

function validateAiEntity(value: unknown, observationIds: Set<string>): AiEntity {
  if (!isRecord(value)) {
    throw new Error("AI entity must be an object.");
  }

  const name = readString(value.name, "name").trim();
  const type = readEntityType(value.type);
  const description = readString(value.description, "description").trim();
  const importance = readImportance(value.importance);
  const confidence = readConfidence(value.confidence);
  const sourceObservationIds = readObservationIds(
    value.source_observation_ids,
    observationIds,
    "entity source observation IDs"
  );

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
    confidence,
    source_observation_ids: sourceObservationIds
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
  supabase: LifeOsSupabaseClient,
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
  supabase: LifeOsSupabaseClient,
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

async function listExistingMemories(
  supabase: LifeOsSupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("memories")
    .select("id, entity_id, observation_id, content, confidence, sensitivity, status")
    .eq("user_id", userId)
    .in("status", ["suggested", "active", "confirmed"]);

  if (error) {
    throw error;
  }

  return (data ?? []) as ExistingMemory[];
}

async function listExistingConfirmedMemories(
  supabase: LifeOsSupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("memories")
    .select("id, entity_id, observation_id, content, confidence, status")
    .eq("user_id", userId)
    .in("status", ["active", "confirmed"])
    .in("confidence", ["high", "confirmed"]);

  if (error) {
    throw error;
  }

  return (data ?? []) as ExistingMemory[];
}

async function insertMemoryContradictions(
  supabase: LifeOsSupabaseClient,
  userId: string,
  contradictions: MemoryContradiction[]
) {
  const { data: existingContradictions, error: existingContradictionsError } = await supabase
    .from("memory_contradictions")
    .select("observation_id, entity_id, memory_id, contradiction_type, existing_content, new_content")
    .eq("user_id", userId)
    .eq("resolution_status", "unresolved")
    .in("status", ["suggested", "active", "confirmed"]);

  if (existingContradictionsError) {
    throw existingContradictionsError;
  }

  const existingContradictionKeys = new Set(
    (existingContradictions ?? []).map((contradiction) =>
      buildContradictionKey(contradiction as Pick<
        MemoryContradiction,
        "contradiction_type" | "entity_id" | "existing_content" | "memory_id" | "new_content" | "observation_id"
      >)
    )
  );
  const contradictionsToInsert = contradictions.filter((contradiction) => {
    const contradictionKey = buildContradictionKey(contradiction);

    if (existingContradictionKeys.has(contradictionKey)) {
      return false;
    }

    existingContradictionKeys.add(contradictionKey);
    return true;
  });

  if (contradictionsToInsert.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("memory_contradictions")
    .insert(contradictionsToInsert)
    .select();

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function insertMemoryEvidence(
  supabase: LifeOsSupabaseClient,
  userId: string,
  evidence: MemoryEvidence[]
) {
  const observationIds = [...new Set(evidence.map((item) => item.observation_id))];
  const { data: existingEvidence, error: existingEvidenceError } = await supabase
    .from("memory_evidence")
    .select("observation_id, entity_id, memory_id, direction")
    .eq("user_id", userId)
    .in("observation_id", observationIds);

  if (existingEvidenceError) {
    throw existingEvidenceError;
  }

  const evidenceKeys = new Set(
    (existingEvidence ?? []).map((item) =>
      buildMemoryEvidenceKey(item as Pick<MemoryEvidence, "direction" | "entity_id" | "memory_id" | "observation_id">)
    )
  );
  const evidenceToInsert = evidence.filter((item) => {
    const evidenceKey = buildMemoryEvidenceKey(item);

    if (evidenceKeys.has(evidenceKey)) {
      return false;
    }

    evidenceKeys.add(evidenceKey);
    return true;
  });

  if (evidenceToInsert.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("memory_evidence")
    .insert(evidenceToInsert)
    .select();

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function evolveConfidenceFromEvidence(
  supabase: LifeOsSupabaseClient,
  userId: string,
  evidence: MemoryEvidence[]
) {
  const entityIds = [...new Set(
    evidence
      .filter((item) => item.direction === "supports" && item.entity_id !== null)
      .map((item) => item.entity_id as string)
  )];
  const memoryIds = [...new Set(
    evidence
      .filter((item) => item.direction === "supports" && item.memory_id !== null)
      .map((item) => item.memory_id as string)
  )];

  return [
    ...await evolveTargetConfidence({ recordType: "entity", supabase, targetIds: entityIds, userId }),
    ...await evolveTargetConfidence({ recordType: "memory", supabase, targetIds: memoryIds, userId })
  ];
}

async function evolveTargetConfidence({
  recordType,
  supabase,
  targetIds,
  userId
}: {
  recordType: "entity" | "memory";
  supabase: LifeOsSupabaseClient;
  targetIds: string[];
  userId: string;
}) {
  if (targetIds.length === 0) {
    return [];
  }

  const table = recordType === "entity" ? "entities" : "memories";
  const targetColumn = recordType === "entity" ? "entity_id" : "memory_id";
  const targets = recordType === "entity"
    ? await listConfidenceEntityTargets(supabase, userId, targetIds)
    : await listConfidenceMemoryTargets(supabase, userId, targetIds);

  const changes: ConfidenceChange[] = [];

  for (const target of targets) {
    const confidence = target.confidence;

    if (confidence === "confirmed" || confidence === "high" || target.sensitivity === "sensitive") {
      continue;
    }

    const { data: contradictionEvidence, error: contradictionEvidenceError } = await supabase
      .from("memory_evidence")
      .select("id")
      .eq("user_id", userId)
      .eq(targetColumn, target.id)
      .eq("direction", "contradicts")
      .limit(1);

    if (contradictionEvidenceError) {
      throw contradictionEvidenceError;
    }

    if ((contradictionEvidence ?? []).length > 0) {
      continue;
    }

    const { data: unresolvedContradictions, error: unresolvedContradictionsError } = await supabase
      .from("memory_contradictions")
      .select("id")
      .eq("user_id", userId)
      .eq(targetColumn, target.id)
      .eq("resolution_status", "unresolved")
      .limit(1);

    if (unresolvedContradictionsError) {
      throw unresolvedContradictionsError;
    }

    if ((unresolvedContradictions ?? []).length > 0) {
      continue;
    }

    const { data: supportingEvidence, error: supportingEvidenceError } = await supabase
      .from("memory_evidence")
      .select("observation_id")
      .eq("user_id", userId)
      .eq(targetColumn, target.id)
      .eq("direction", "supports");

    if (supportingEvidenceError) {
      throw supportingEvidenceError;
    }

    const observationIds = [...new Set(
      (supportingEvidence ?? []).map((item) => item.observation_id as string)
    )];

    if (observationIds.length === 0) {
      continue;
    }

    const { data: observations, error: observationsError } = await supabase
      .from("observations")
      .select("id, capture_id, content, type, confidence, sensitivity, created_at")
      .eq("user_id", userId)
      .in("id", observationIds);

    if (observationsError) {
      throw observationsError;
    }

    const independentObservations = getIndependentEvidenceObservations(observations ?? []);

    if (independentObservations.some((observation) => observation.sensitivity === "sensitive")) {
      continue;
    }

    const nextConfidence = getDeterministicConfidencePromotion(confidence, independentObservations.length);

    if (!nextConfidence) {
      continue;
    }

    const { data: updatedTarget, error: updateError } = await supabase
      .from(table)
      .update({
        confidence: nextConfidence,
        updated_at: new Date().toISOString()
      })
      .eq("id", target.id)
      .eq("user_id", userId)
      .eq("confidence", confidence)
      .in("status", ["suggested", "active"])
      .select("id, confidence");

    if (updateError) {
      throw updateError;
    }

    if ((updatedTarget ?? []).length === 0) {
      continue;
    }

    changes.push({
      confidence: nextConfidence,
      evidence_observation_ids: independentObservations.map((observation) => observation.id),
      independent_source_count: independentObservations.length,
      previous_confidence: confidence,
      record_id: target.id,
      record_type: recordType,
      reason: buildConfidencePromotionReason(confidence, nextConfidence, independentObservations.length)
    });
  }

  return changes;
}

function getDeterministicConfidencePromotion(
  confidence: Confidence,
  independentSourceCount: number
): Confidence | null {
  if (confidence === "low" && independentSourceCount >= 2) {
    return "medium";
  }

  if (confidence === "medium" && independentSourceCount >= 3) {
    return "high";
  }

  return null;
}

function buildConfidencePromotionReason(
  previousConfidence: Confidence,
  confidence: Confidence,
  independentSourceCount: number
) {
  return `${independentSourceCount} independent normal-sensitivity captures support a ${previousConfidence}-to-${confidence} promotion without unresolved contradiction.`;
}

async function listConfidenceEntityTargets(
  supabase: LifeOsSupabaseClient,
  userId: string,
  targetIds: string[]
) {
  const { data, error } = await supabase
    .from("entities")
    .select("id, name, description, type, confidence, sensitivity, status")
    .eq("user_id", userId)
    .in("id", targetIds)
    .in("status", ["suggested", "active"]);

  if (error) {
    throw error;
  }

  return (data ?? []) as ConfidenceTarget[];
}

async function listConfidenceMemoryTargets(
  supabase: LifeOsSupabaseClient,
  userId: string,
  targetIds: string[]
) {
  const { data, error } = await supabase
    .from("memories")
    .select("id, content, type, confidence, sensitivity, status")
    .eq("user_id", userId)
    .in("id", targetIds)
    .in("status", ["suggested", "active"]);

  if (error) {
    throw error;
  }

  return (data ?? []) as ConfidenceTarget[];
}

function buildSupportingEntityEvidence({
  entities,
  entityByName,
  entityMatchBySuggestedName,
  userId
}: {
  entities: AiEntity[];
  entityByName: Map<string, ExistingEntity>;
  entityMatchBySuggestedName: Map<string, EntityMatch>;
  userId: string;
}) {
  const evidenceByKey = new Map<string, MemoryEvidence>();

  for (const entity of entities) {
    const normalizedEntityName = normalizeName(entity.name);
    const match = entityMatchBySuggestedName.get(normalizedEntityName);
    const targetEntity = match?.entity ?? entityByName.get(normalizedEntityName);

    if (!targetEntity) {
      continue;
    }

    const reason = match
      ? match.reason === "exact_name"
        ? "The source observation refers to the entity by its exact name."
        : "The source observation refers to the only matching person name."
      : "The source observation directly supports this suggested entity.";

    for (const observationId of entity.source_observation_ids) {
      const evidence: MemoryEvidence = {
        direction: "supports",
        entity_id: targetEntity.id,
        memory_id: null,
        observation_id: observationId,
        reason,
        user_id: userId
      };

      evidenceByKey.set(buildMemoryEvidenceKey(evidence), evidence);
    }
  }

  return [...evidenceByKey.values()];
}

function buildExactEntityReferenceEvidence({
  entities,
  observations,
  userId
}: {
  entities: ExistingEntity[];
  observations: Observation[];
  userId: string;
}) {
  const evidenceByKey = new Map<string, MemoryEvidence>();

  for (const entity of entities) {
    if (!hasConservativeExactEntityReference(entity, observations)) {
      continue;
    }

    for (const observation of observations) {
      if (!hasExactEntityReference(entity.name, observation.content)) {
        continue;
      }

      const evidence: MemoryEvidence = {
        direction: "supports",
        entity_id: entity.id,
        memory_id: null,
        observation_id: observation.id,
        reason: "The source observation refers to the entity by its full exact name.",
        user_id: userId
      };

      evidenceByKey.set(buildMemoryEvidenceKey(evidence), evidence);
    }
  }

  return [...evidenceByKey.values()];
}

function hasConservativeExactEntityReference(entity: ExistingEntity, observations: Observation[]) {
  const nameParts = getNormalizedNameParts(entity.name);

  return nameParts.length >= 2 && observations.some((observation) =>
    hasExactEntityReference(entity.name, observation.content)
  );
}

function hasExactEntityReference(entityName: string, content: string) {
  const normalizedName = entityName.trim();

  if (!normalizedName) {
    return false;
  }

  const pattern = new RegExp(
    `(?:^|[^\\p{L}\\p{N}])${escapeRegExp(normalizedName)}(?:$|[^\\p{L}\\p{N}])`,
    "iu"
  );

  return pattern.test(content);
}

function buildExactMemoryReferenceEvidence({
  memories,
  observations,
  userId
}: {
  memories: ExistingMemory[];
  observations: Observation[];
  userId: string;
}) {
  const evidenceByKey = new Map<string, MemoryEvidence>();

  for (const memory of memories) {
    for (const observation of observations) {
      if (normalizeFactValue(memory.content) !== normalizeFactValue(observation.content)) {
        continue;
      }

      const evidence: MemoryEvidence = {
        direction: "supports",
        entity_id: null,
        memory_id: memory.id,
        observation_id: observation.id,
        reason: "The source observation exactly repeats this existing memory.",
        user_id: userId
      };

      evidenceByKey.set(buildMemoryEvidenceKey(evidence), evidence);
    }
  }

  return [...evidenceByKey.values()];
}

function buildSupportingMemoryEvidence(
  memories: Array<{ id: string; observation_id: string | null }>,
  userId: string
) {
  return memories.flatMap((memory): MemoryEvidence[] => {
    if (!memory.observation_id) {
      return [];
    }

    return [{
      direction: "supports",
      entity_id: null,
      memory_id: memory.id,
      observation_id: memory.observation_id,
      reason: "The source observation directly supports this suggested memory.",
      user_id: userId
    }];
  });
}

function buildContradictingEvidence(contradictions: MemoryContradiction[], userId: string) {
  return contradictions.flatMap((contradiction): MemoryEvidence[] => {
    if (!contradiction.observation_id) {
      return [];
    }

    const memoryId = contradiction.memory_id;
    const entityId = memoryId ? null : contradiction.entity_id;

    if (!entityId && !memoryId) {
      return [];
    }

    return [{
      direction: "contradicts",
      entity_id: entityId,
      memory_id: memoryId,
      observation_id: contradiction.observation_id,
      reason: contradiction.reason,
      user_id: userId
    }];
  });
}

async function insertDuplicateCandidates(
  supabase: LifeOsSupabaseClient,
  userId: string,
  candidates: DuplicateCandidate[]
) {
  const { data: existingCandidates, error: existingCandidatesError } = await supabase
    .from("entity_duplicate_candidates")
    .select("entity_id, candidate_name, duplicate_entity_id")
    .eq("user_id", userId)
    .in("status", ["suggested", "active", "confirmed"]);

  if (existingCandidatesError) {
    throw existingCandidatesError;
  }

  const existingCandidateKeys = new Set(
    (existingCandidates ?? []).map((candidate) =>
      buildDuplicateCandidateKey(candidate as Pick<DuplicateCandidate, "candidate_name" | "duplicate_entity_id" | "entity_id">)
    )
  );
  const candidatesToInsert = candidates.filter((candidate) => {
    const candidateKey = buildDuplicateCandidateKey(candidate);

    if (existingCandidateKeys.has(candidateKey)) {
      return false;
    }

    existingCandidateKeys.add(candidateKey);
    return true;
  });

  if (candidatesToInsert.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("entity_duplicate_candidates")
    .insert(candidatesToInsert)
    .select();

  if (error) {
    throw error;
  }

  return data ?? [];
}

function buildDuplicateCandidates({
  allEntities,
  candidateEntities,
  userId
}: {
  allEntities: ExistingEntity[];
  candidateEntities: ExistingEntity[];
  userId: string;
}) {
  const candidatesByPair = new Map<string, DuplicateCandidate>();

  for (const candidateEntity of candidateEntities) {
    for (const comparisonEntity of allEntities) {
      if (candidateEntity.id === comparisonEntity.id) {
        continue;
      }

      const duplicateSignal = findDuplicateSignal(candidateEntity, comparisonEntity);

      if (!duplicateSignal) {
        continue;
      }

      if (
        candidateEntity.type === "person" &&
        countCompatiblePersonDuplicateTargets(candidateEntity, allEntities) !== 1
      ) {
        continue;
      }

      const [entityId, duplicateEntityId] = sortEntityPair(candidateEntity.id, comparisonEntity.id);
      const pairKey = `${entityId}:${duplicateEntityId}`;
      const existingCandidate = candidatesByPair.get(pairKey);

      if (existingCandidate && compareDuplicateConfidence(existingCandidate.confidence, duplicateSignal.confidence) >= 0) {
        continue;
      }

      candidatesByPair.set(pairKey, {
        candidate_name: null,
        confidence: duplicateSignal.confidence,
        duplicate_entity_id: duplicateEntityId,
        entity_id: entityId,
        reason: duplicateSignal.reason,
        status: "suggested",
        user_id: userId
      });
    }
  }

  return [...candidatesByPair.values()];
}

function buildReferenceDuplicateCandidates({
  existingEntities,
  observations,
  userId
}: {
  existingEntities: ExistingEntity[];
  observations: Observation[];
  userId: string;
}) {
  const candidatesByKey = new Map<string, DuplicateCandidate>();
  const existingPeople = existingEntities.filter((entity) => entity.type === "person");
  const existingNamedThings = existingEntities.filter((entity) => entity.type !== "person");

  for (const candidateName of extractPossiblePersonReferences(observations)) {
    const compatiblePeople = existingPeople
      .map((entity) => ({
        entity,
        signal: findPersonDuplicateSignal(candidateName, entity.name)
      }))
      .filter((match): match is {
        entity: ExistingEntity;
        signal: Pick<DuplicateCandidate, "confidence" | "reason">;
      } => match.signal !== null);

    if (compatiblePeople.length !== 1) {
      continue;
    }

    const compatiblePerson = compatiblePeople[0];
    const candidate: DuplicateCandidate = {
      candidate_name: candidateName,
      confidence: compatiblePerson.signal.confidence,
      duplicate_entity_id: compatiblePerson.entity.id,
      entity_id: null,
      reason: compatiblePerson.signal.reason,
      status: "suggested",
      user_id: userId
    };

    candidatesByKey.set(buildDuplicateCandidateKey(candidate), candidate);
  }

  for (const candidateName of extractPossibleNamedThingReferences(observations, existingNamedThings)) {
    const compatibleNamedThings = existingNamedThings
      .map((entity) => ({
        entity,
        signal: findNamedThingDuplicateSignal(candidateName, entity.name)
      }))
      .filter((match): match is {
        entity: ExistingEntity;
        signal: Pick<DuplicateCandidate, "confidence" | "reason">;
      } => match.signal !== null)
      .filter((match) => isSafeNamedThingReference(candidateName, match.entity.name));

    if (compatibleNamedThings.length !== 1) {
      continue;
    }

    const compatibleNamedThing = compatibleNamedThings[0];
    const candidate: DuplicateCandidate = {
      candidate_name: candidateName,
      confidence: compatibleNamedThing.signal.confidence,
      duplicate_entity_id: compatibleNamedThing.entity.id,
      entity_id: null,
      reason: compatibleNamedThing.signal.reason,
      status: "suggested",
      user_id: userId
    };

    candidatesByKey.set(buildDuplicateCandidateKey(candidate), candidate);
  }

  return [...candidatesByKey.values()];
}

function extractPossiblePersonReferences(observations: Observation[]) {
  const references = new Set<string>();
  const referencePattern = /\b[A-Z][a-z]+(?:\s+[A-Z]\.)?/g;

  for (const observation of observations) {
    for (const match of observation.content.matchAll(referencePattern)) {
      const reference = match[0].trim();

      if (ignoredReferenceStarts.has(normalizeName(reference))) {
        continue;
      }

      references.add(reference);
    }
  }

  return [...references];
}

function extractPossibleNamedThingReferences(observations: Observation[], existingEntities: ExistingEntity[]) {
  const references = new Set<string>();
  const distinctiveTokens = new Set(existingEntities.flatMap((entity) => getDistinctiveNameTokens(entity.name)));

  if (distinctiveTokens.size === 0) {
    return [];
  }

  for (const observation of observations) {
    const words = observation.content
      .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
      .split(/\s+/)
      .map((word) => word.trim())
      .filter(Boolean);

    for (let start = 0; start < words.length; start += 1) {
      for (let length = 2; length <= 4 && start + length <= words.length; length += 1) {
        const phrase = stripLeadingNameArticles(words.slice(start, start + length).join(" "));
        const normalizedPhraseParts = getNormalizedNameParts(phrase);

        if (!normalizedPhraseParts.some((part) => distinctiveTokens.has(part))) {
          continue;
        }

        if (!normalizedPhraseParts.every((part) => distinctiveTokens.has(part) || genericNameTokens.has(part))) {
          continue;
        }

        references.add(phrase);
      }
    }
  }

  return pruneContainedNameReferences([...references]);
}

function findDuplicateSignal(
  candidateEntity: ExistingEntity,
  comparisonEntity: ExistingEntity
): Pick<DuplicateCandidate, "confidence" | "reason"> | null {
  if (candidateEntity.type !== comparisonEntity.type) {
    return null;
  }

  if (candidateEntity.type === "person") {
    return findPersonDuplicateSignal(candidateEntity.name, comparisonEntity.name);
  }

  return findNamedThingDuplicateSignal(candidateEntity.name, comparisonEntity.name);
}

function findPersonDuplicateSignal(
  candidateName: string,
  comparisonName: string
): Pick<DuplicateCandidate, "confidence" | "reason"> | null {
  const candidateParts = getNormalizedNameParts(candidateName);
  const comparisonParts = getNormalizedNameParts(comparisonName);

  if (candidateParts.length === 0 || comparisonParts.length === 0) {
    return null;
  }

  if (areKnownNicknameVariants(candidateParts[0], comparisonParts[0])) {
    return {
      confidence: "medium",
      reason: "nickname"
    };
  }

  if (hasFirstNameAndLastInitialMatch(candidateParts, comparisonParts)) {
    return {
      confidence: "high",
      reason: "first_name_last_initial"
    };
  }

  if (candidateParts.length === 1 && comparisonParts.length > 1 && candidateParts[0] === comparisonParts[0]) {
    return {
      confidence: "medium",
      reason: "unique_first_name"
    };
  }

  if (comparisonParts.length === 1 && candidateParts.length > 1 && candidateParts[0] === comparisonParts[0]) {
    return {
      confidence: "medium",
      reason: "unique_first_name"
    };
  }

  return null;
}

function findNamedThingDuplicateSignal(
  candidateName: string,
  comparisonName: string
): Pick<DuplicateCandidate, "confidence" | "reason"> | null {
  const candidateTokens = getDistinctiveNameTokens(candidateName);
  const comparisonTokens = getDistinctiveNameTokens(comparisonName);

  if (candidateTokens.length === 0 || comparisonTokens.length === 0) {
    return null;
  }

  const smallerTokenSet = candidateTokens.length <= comparisonTokens.length
    ? candidateTokens
    : comparisonTokens;
  const largerTokenSet = candidateTokens.length <= comparisonTokens.length
    ? comparisonTokens
    : candidateTokens;

  if (smallerTokenSet.every((token) => largerTokenSet.includes(token))) {
    return {
      confidence: "medium",
      reason: "similar_distinctive_name"
    };
  }

  return null;
}

function isSafeNamedThingReference(candidateName: string, comparisonName: string) {
  const candidateParts = getNormalizedNameParts(candidateName);
  const comparisonParts = getNormalizedNameParts(comparisonName);

  if (candidateParts.length === 0 || comparisonParts.length === 0) {
    return false;
  }

  if (normalizeName(candidateName) === normalizeName(comparisonName)) {
    return false;
  }

  return candidateParts.every((part) => comparisonParts.includes(part) || genericNameTokens.has(part));
}

function stripLeadingNameArticles(value: string) {
  return value.replace(/^(?:a|an|the)\s+/i, "").trim();
}

function pruneContainedNameReferences(references: string[]) {
  return references.filter((reference) => {
    const normalizedReference = normalizeName(reference);

    return !references.some((otherReference) => {
      if (otherReference === reference) {
        return false;
      }

      const normalizedOtherReference = normalizeName(otherReference);
      return normalizedOtherReference.length > normalizedReference.length &&
        normalizedOtherReference.includes(normalizedReference);
    });
  });
}

function countCompatiblePersonDuplicateTargets(candidateEntity: ExistingEntity, allEntities: ExistingEntity[]) {
  return allEntities.filter((comparisonEntity) =>
    candidateEntity.id !== comparisonEntity.id &&
    comparisonEntity.type === "person" &&
    findPersonDuplicateSignal(candidateEntity.name, comparisonEntity.name) !== null
  ).length;
}

function buildContradictionEvidence({
  knownEntities,
  memoriesToInsert,
  observations
}: {
  knownEntities: ExistingEntity[];
  memoriesToInsert: Array<{
    content: string;
    entity_id: string | null;
    observation_id: string;
  }>;
  observations: Observation[];
}) {
  const evidenceByKey = new Map<string, ContradictionEvidence>();

  for (const memory of memoriesToInsert) {
    addContradictionEvidence(evidenceByKey, {
      content: memory.content,
      entityId: memory.entity_id,
      observationId: memory.observation_id
    });
  }

  for (const observation of observations) {
    if (!isStrongEnoughForContradiction(observation.confidence)) {
      continue;
    }

    const referencedEntity = findSingleReferencedEntity(observation.content, knownEntities);

    if (!referencedEntity) {
      continue;
    }

    addContradictionEvidence(evidenceByKey, {
      content: observation.content,
      entityId: referencedEntity.id,
      observationId: observation.id
    });
  }

  return [...evidenceByKey.values()];
}

function addContradictionEvidence(
  evidenceByKey: Map<string, ContradictionEvidence>,
  evidence: ContradictionEvidence
) {
  if (!extractContradictionFacts(evidence.content).length) {
    return;
  }

  evidenceByKey.set(`${evidence.observationId ?? "none"}:${evidence.entityId ?? "none"}:${normalizeFactValue(evidence.content)}`, evidence);
}

function buildMemoryContradictions({
  evidence,
  existingEntities,
  existingMemories,
  userId
}: {
  evidence: ContradictionEvidence[];
  existingEntities: ExistingEntity[];
  existingMemories: ExistingMemory[];
  userId: string;
}) {
  const contradictionsByKey = new Map<string, MemoryContradiction>();
  const confirmedEntities = existingEntities
    .filter((entity) => ["active", "confirmed"].includes(entity.status))
    .filter((entity) => isStrongEnoughForContradiction(entity.confidence))
    .filter((entity) => typeof entity.description === "string" && entity.description.trim().length > 0);

  for (const newEvidence of evidence) {
    const newFacts = extractContradictionFacts(newEvidence.content);

    if (newFacts.length === 0) {
      continue;
    }

    for (const existingMemory of existingMemories) {
      if (!isComparableContradictionTarget(newEvidence, existingMemory.entity_id)) {
        continue;
      }

      addContradictionsForExistingContent({
        contradictionsByKey,
        existingContent: existingMemory.content,
        existingEntityId: existingMemory.entity_id,
        existingMemoryId: existingMemory.id,
        existingRecordType: "memory",
        newEvidence,
        newFacts,
        userId
      });
    }

    for (const existingEntity of confirmedEntities) {
      if (!isComparableContradictionTarget(newEvidence, existingEntity.id)) {
        continue;
      }

      addContradictionsForExistingContent({
        contradictionsByKey,
        existingContent: existingEntity.description ?? "",
        existingEntityId: existingEntity.id,
        existingMemoryId: null,
        existingRecordType: "entity",
        newEvidence,
        newFacts,
        userId
      });
    }
  }

  return [...contradictionsByKey.values()];
}

function addContradictionsForExistingContent({
  contradictionsByKey,
  existingContent,
  existingEntityId,
  existingMemoryId,
  existingRecordType,
  newEvidence,
  newFacts,
  userId
}: {
  contradictionsByKey: Map<string, MemoryContradiction>;
  existingContent: string;
  existingEntityId: string | null;
  existingMemoryId: string | null;
  existingRecordType: "entity" | "memory";
  newEvidence: ContradictionEvidence;
  newFacts: ContradictionFact[];
  userId: string;
}) {
  const existingFacts = extractContradictionFacts(existingContent);

  for (const newFact of newFacts) {
    for (const existingFact of existingFacts) {
      if (!factsContradict(existingFact, newFact)) {
        continue;
      }

      const contradiction: MemoryContradiction = {
        confidence: newFact.type === "project_status" || newFact.type === "role" ? "high" : "medium",
        contradiction_type: newFact.type,
        entity_id: existingEntityId,
        existing_content: existingContent,
        existing_record_type: existingRecordType,
        memory_id: existingMemoryId,
        new_content: newEvidence.content,
        observation_id: newEvidence.observationId,
        reason: buildContradictionReason(existingFact, newFact),
        resolution_status: "unresolved",
        status: "suggested",
        user_id: userId
      };

      contradictionsByKey.set(buildContradictionKey(contradiction), contradiction);
    }
  }
}

function isComparableContradictionTarget(evidence: ContradictionEvidence, existingEntityId: string | null) {
  return evidence.entityId !== null && existingEntityId !== null && evidence.entityId === existingEntityId;
}

function factsContradict(existingFact: ContradictionFact, newFact: ContradictionFact) {
  if (existingFact.type !== newFact.type) {
    return false;
  }

  if (!subjectsAreCompatible(existingFact.subject, newFact.subject)) {
    return false;
  }

  if (normalizeFactValue(existingFact.value) === normalizeFactValue(newFact.value)) {
    return false;
  }

  if (valuesLookLikeAddedDetail(existingFact.value, newFact.value)) {
    return false;
  }

  if (existingFact.type === "role") {
    return rolesConflict(existingFact.value, newFact.value);
  }

  if (existingFact.type === "project_status") {
    return projectStatusesConflict(existingFact.value, newFact.value);
  }

  return true;
}

function extractContradictionFacts(content: string) {
  const facts: ContradictionFact[] = [];
  const clauses = content
    .split(/[.;\n]+/)
    .map((clause) => clause.trim())
    .filter(Boolean);

  for (const clause of clauses) {
    facts.push(...extractOrganizationFacts(clause));
    facts.push(...extractRoleFacts(clause));
    facts.push(...extractDateFacts(clause));
    facts.push(...extractProjectStatusFacts(clause));
    facts.push(...extractLocationFacts(clause));
  }

  return facts;
}

function extractOrganizationFacts(clause: string): ContradictionFact[] {
  const facts: ContradictionFact[] = [];
  const organizationPatterns = [
    /\b(?<subject>[A-Z][\p{L}'-]+(?:\s+[A-Z][\p{L}'-]+){0,2})\s+(?:works|is working)\s+(?:at|for)\s+(?<value>[^,.;]+)\b/gu
  ];

  for (const pattern of organizationPatterns) {
    for (const match of clause.matchAll(pattern)) {
      const value = cleanExtractedValue(match.groups?.value ?? "");

      if (value) {
        facts.push({
          raw: match[0],
          subject: match.groups?.subject ?? null,
          type: "organization",
          value
        });
      }
    }
  }

  return facts;
}

function extractRoleFacts(clause: string): ContradictionFact[] {
  const facts: ContradictionFact[] = [];
  const pattern = /\b(?<subject>[A-Z][\p{L}'-]+(?:\s+[A-Z][\p{L}'-]+){0,2})\s+(?:is|becomes|became)\s+(?:a|an|the|our|my)?\s*(?<value>client|supplier|vendor|customer|partner|colleague|friend|manager|employee|contractor)\b/gu;

  for (const match of clause.matchAll(pattern)) {
    facts.push({
      raw: match[0],
      subject: match.groups?.subject ?? null,
      type: "role",
      value: match.groups?.value ?? ""
    });
  }

  return facts;
}

function extractDateFacts(clause: string): ContradictionFact[] {
  if (!/\b(meeting|call|appointment|deadline|event|trip|session|workshop|presentation)\b/i.test(clause)) {
    return [];
  }

  const facts: ContradictionFact[] = [];
  const pattern = /\b(?:is|on|for|scheduled for|planned for|moved to|rescheduled to)\s+(?<value>monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{4}-\d{2}-\d{2})\b/giu;

  for (const match of clause.matchAll(pattern)) {
    facts.push({
      raw: match[0],
      subject: extractLeadingSubject(clause, match.index ?? 0),
      type: "date",
      value: match.groups?.value ?? ""
    });
  }

  return facts;
}

function extractProjectStatusFacts(clause: string): ContradictionFact[] {
  const facts: ContradictionFact[] = [];
  const pattern = /\b(?<subject>[A-Z][\p{L}\p{N}'-]+(?:\s+[A-Z][\p{L}\p{N}'-]+){0,4}|project)\s+(?:is|was|became|becomes|looks)\s+(?<value>active|completed|complete|cancelled|canceled|paused|blocked|done)\b/gu;

  for (const match of clause.matchAll(pattern)) {
    facts.push({
      raw: match[0],
      subject: match.groups?.subject ?? null,
      type: "project_status",
      value: canonicalProjectStatus(match.groups?.value ?? "")
    });
  }

  return facts;
}

function extractLocationFacts(clause: string): ContradictionFact[] {
  const facts: ContradictionFact[] = [];
  const pattern = /\b(?<subject>[A-Z][\p{L}'-]+(?:\s+[A-Z][\p{L}'-]+){0,2})\s+(?:lives in|is based in|is located in|is from)\s+(?<value>[^,.;]+)\b/gu;

  for (const match of clause.matchAll(pattern)) {
    const value = cleanExtractedValue(match.groups?.value ?? "");

    if (value) {
      facts.push({
        raw: match[0],
        subject: match.groups?.subject ?? null,
        type: "location",
        value
      });
    }
  }

  return facts;
}

function findSingleReferencedEntity(content: string, entities: ExistingEntity[]) {
  const matchingEntities = entities
    .filter((entity) => ["active", "confirmed"].includes(entity.status))
    .filter((entity) => isStrongEnoughForContradiction(entity.confidence))
    .filter((entity) => contentReferencesEntity(content, entity, entities));

  return matchingEntities.length === 1 ? matchingEntities[0] : null;
}

function contentReferencesEntity(content: string, entity: ExistingEntity, allEntities: ExistingEntity[]) {
  const normalizedContent = normalizeFactValue(content);
  const normalizedName = normalizeFactValue(entity.name);

  if (!normalizedName) {
    return false;
  }

  if (normalizedContent.includes(normalizedName)) {
    return true;
  }

  if (entity.type !== "person") {
    return false;
  }

  const nameParts = getNormalizedNameParts(entity.name);

  if (nameParts.length === 0) {
    return false;
  }

  const firstName = nameParts[0];
  const firstNamePattern = new RegExp(`\\b${escapeRegExp(firstName)}\\b`, "i");

  return firstNamePattern.test(normalizedContent) &&
    entitiesWithFirstName(firstName, allEntities).length === 1;
}

function entitiesWithFirstName(firstName: string, entities: ExistingEntity[]) {
  return entities.filter((entity) =>
    entity.type === "person" &&
    getNormalizedNameParts(entity.name)[0] === firstName
  );
}

function isStrongEnoughForContradiction(confidence: StoredConfidence) {
  return confidence === "high" || confidence === "confirmed";
}

function subjectsAreCompatible(left: string | null, right: string | null) {
  if (!left || !right) {
    return true;
  }

  const normalizedLeft = normalizeFactValue(left);
  const normalizedRight = normalizeFactValue(right);

  return normalizedLeft === normalizedRight ||
    normalizedLeft.includes(normalizedRight) ||
    normalizedRight.includes(normalizedLeft);
}

function valuesLookLikeAddedDetail(left: string, right: string) {
  const leftTokens = getFactTokens(left);
  const rightTokens = getFactTokens(right);

  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return false;
  }

  return leftTokens.every((token) => rightTokens.includes(token)) ||
    rightTokens.every((token) => leftTokens.includes(token));
}

function rolesConflict(left: string, right: string) {
  const normalizedLeft = normalizeRole(left);
  const normalizedRight = normalizeRole(right);

  if (normalizedLeft === normalizedRight) {
    return false;
  }

  const mutuallyExclusiveRoles = new Set([
    "client:supplier",
    "client:vendor",
    "customer:supplier",
    "customer:vendor",
    "employee:manager"
  ]);
  const pairKey = [normalizedLeft, normalizedRight].sort().join(":");

  return mutuallyExclusiveRoles.has(pairKey);
}

function projectStatusesConflict(left: string, right: string) {
  const normalizedLeft = canonicalProjectStatus(left);
  const normalizedRight = canonicalProjectStatus(right);

  if (normalizedLeft === normalizedRight) {
    return false;
  }

  const terminalStatuses = new Set(["cancelled", "completed"]);

  return normalizedLeft === "active" && terminalStatuses.has(normalizedRight) ||
    normalizedRight === "active" && terminalStatuses.has(normalizedLeft) ||
    normalizedLeft === "cancelled" && normalizedRight === "completed" ||
    normalizedRight === "cancelled" && normalizedLeft === "completed";
}

function buildContradictionReason(existingFact: ContradictionFact, newFact: ContradictionFact) {
  return `${existingFact.type} conflict: existing "${existingFact.value}" vs new "${newFact.value}".`;
}

function resolveMemoryEntity(
  memory: AiMemory,
  existingEntities: ExistingEntity[],
  existingEntityByName: Map<string, ExistingEntity>,
  entityMatchBySuggestedName: Map<string, EntityMatch>
) {
  const normalizedEntityName = normalizeName(memory.entity_name);

  if (!normalizedEntityName) {
    return null;
  }

  const existingEntity = existingEntityByName.get(normalizedEntityName);

  if (existingEntity) {
    return existingEntity;
  }

  const suggestedEntityMatch = entityMatchBySuggestedName.get(normalizedEntityName);

  if (suggestedEntityMatch) {
    return suggestedEntityMatch.entity;
  }

  if (memory.confidence !== "high") {
    return null;
  }

  const match = findExistingEntityMatch(
    {
      confidence: memory.confidence,
      description: "",
      importance: 1,
      name: memory.entity_name,
      source_observation_ids: [memory.source_observation_id],
      type: "person"
    },
    existingEntities
  );

  return match?.entity ?? null;
}

function findExistingEntityMatch(entity: AiEntity, existingEntities: ExistingEntity[]): EntityMatch | null {
  const normalizedName = normalizeName(entity.name);

  if (!normalizedName) {
    return null;
  }

  const exactMatch = existingEntities.find((existingEntity) =>
    normalizeName(existingEntity.name) === normalizedName
  );

  if (exactMatch) {
    return {
      confidence: "high",
      entity: exactMatch,
      reason: "exact_name"
    };
  }

  if (entity.confidence !== "high" || entity.type !== "person") {
    return null;
  }

  const suggestedNameParts = getNormalizedNameParts(entity.name);

  if (suggestedNameParts.length !== 1) {
    return null;
  }

  const matchingPeople = existingEntities.filter((existingEntity) =>
    existingEntity.type === "person" &&
    getNormalizedNameParts(existingEntity.name)[0] === suggestedNameParts[0]
  );

  if (matchingPeople.length !== 1) {
    return null;
  }

  return {
    confidence: "high",
    entity: matchingPeople[0],
    reason: "unique_person_name_part"
  };
}

async function readCaptureId(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new PublicError("Invalid request.", 400);
  }

  if (!isRecord(body)) {
    throw new PublicError("Invalid request.", 400);
  }

  const captureId = readString(body.capture_id, "capture_id").trim();

  if (!captureId) {
    throw new PublicError("Capture is required.", 400);
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

function readObservationIds(value: unknown, observationIds: Set<string>, field: string) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 8) {
    throw new Error(`AI response field ${field} must contain between one and eight IDs.`);
  }

  const sourceObservationIds = value.map((item) => readString(item, field).trim());

  if (sourceObservationIds.some((id) => !id) || new Set(sourceObservationIds).size !== sourceObservationIds.length) {
    throw new Error(`AI response field ${field} must contain unique IDs.`);
  }

  if (sourceObservationIds.some((id) => !observationIds.has(id))) {
    throw new Error(`AI response field ${field} contains an invalid observation ID.`);
  }

  return sourceObservationIds;
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

function getNormalizedNameParts(value: string) {
  return normalizeName(value)
    .replace(/\./g, " ")
    .split(/[\s'-]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function getDistinctiveNameTokens(value: string) {
  return [...new Set(
    getNormalizedNameParts(value)
      .filter((part) => part.length >= 4)
      .filter((part) => !genericNameTokens.has(part))
  )];
}

function hasFirstNameAndLastInitialMatch(candidateParts: string[], comparisonParts: string[]) {
  if (candidateParts.length !== 2 || comparisonParts.length < 2) {
    return false;
  }

  if (candidateParts[0] !== comparisonParts[0]) {
    return false;
  }

  return candidateParts[1].length === 1 && comparisonParts[1].startsWith(candidateParts[1]);
}

function areKnownNicknameVariants(left: string, right: string) {
  if (left === right) {
    return false;
  }

  const nicknameGroups = [
    ["tom", "thomas"],
    ["alex", "alexander", "alexandre", "alexandra"],
    ["ben", "benjamin"],
    ["cam", "camille"],
    ["chris", "christopher", "christophe", "christine"],
    ["dan", "daniel", "danielle"],
    ["em", "emma", "emily", "emilie"],
    ["max", "maxime", "maximilien"],
    ["mike", "michael", "michel"],
    ["nick", "nicolas", "nicholas"],
    ["sam", "samuel", "samantha"],
    ["will", "william"]
  ];

  return nicknameGroups.some((group) => group.includes(left) && group.includes(right));
}

function sortEntityPair(leftEntityId: string, rightEntityId: string) {
  return leftEntityId < rightEntityId
    ? [leftEntityId, rightEntityId]
    : [rightEntityId, leftEntityId];
}

function buildDuplicateCandidateKey(
  candidate: Pick<DuplicateCandidate, "candidate_name" | "duplicate_entity_id" | "entity_id">
) {
  return candidate.entity_id
    ? `entity:${candidate.entity_id}:${candidate.duplicate_entity_id}`
    : `reference:${normalizeName(candidate.candidate_name ?? "")}:${candidate.duplicate_entity_id}`;
}

function compareDuplicateConfidence(left: DuplicateCandidate["confidence"], right: DuplicateCandidate["confidence"]) {
  const confidenceScore = {
    medium: 1,
    high: 2
  };

  return confidenceScore[left] - confidenceScore[right];
}

function buildContradictionKey(
  contradiction: Pick<
    MemoryContradiction,
    "contradiction_type" | "entity_id" | "existing_content" | "memory_id" | "new_content" | "observation_id"
  >
) {
  return [
    contradiction.observation_id ?? "none",
    contradiction.entity_id ?? "none",
    contradiction.memory_id ?? "none",
    contradiction.contradiction_type,
    normalizeFactValue(contradiction.existing_content),
    normalizeFactValue(contradiction.new_content)
  ].join(":");
}

function buildMemoryKey(observationId: string | null, content: string) {
  return `${observationId ?? "none"}:${content.trim().toLocaleLowerCase()}`;
}

function findExistingMemoryMatch(
  content: string,
  entityId: string | null,
  memories: ExistingMemory[]
) {
  const targetKey = buildMemoryIdentityKey(content, entityId);

  return memories.find((memory) =>
    buildMemoryIdentityKey(memory.content, memory.entity_id) === targetKey
  );
}

function buildMemoryIdentityKey(content: string, entityId: string | null) {
  return `${entityId ?? "none"}:${normalizeFactValue(content)}`;
}

function buildMemoryEvidenceKey(
  evidence: Pick<MemoryEvidence, "direction" | "entity_id" | "memory_id" | "observation_id">
) {
  return [
    evidence.observation_id,
    evidence.entity_id ?? "none",
    evidence.memory_id ?? "none",
    evidence.direction
  ].join(":");
}

function cleanExtractedValue(value: string) {
  return value
    .replace(/\b(?:today|tomorrow|yesterday|now|currently|recently)$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractLeadingSubject(clause: string, matchIndex: number) {
  const leadingText = clause.slice(0, matchIndex).trim();
  const subjectMatch = leadingText.match(/\b([A-Z][\p{L}\p{N}'-]+(?:\s+[A-Z][\p{L}\p{N}'-]+){0,4}|meeting|call|appointment|deadline|event|trip|session|workshop|presentation)\b/iu);

  return subjectMatch?.[1] ?? null;
}

function canonicalProjectStatus(value: string) {
  const normalizedValue = normalizeFactValue(value);

  if (normalizedValue === "complete" || normalizedValue === "done") {
    return "completed";
  }

  if (normalizedValue === "canceled") {
    return "cancelled";
  }

  return normalizedValue;
}

function normalizeRole(value: string) {
  const normalizedValue = normalizeFactValue(value);

  if (normalizedValue === "vendor") {
    return "supplier";
  }

  if (normalizedValue === "customer") {
    return "client";
  }

  return normalizedValue;
}

function normalizeFactValue(value: string) {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s/-]/gu, "")
    .replace(/\s+/g, " ");
}

function getFactTokens(value: string) {
  return normalizeFactValue(value)
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

class PublicError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PublicError";
    this.status = status;
  }
}
