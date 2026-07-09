import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.1";

type LifeOsSupabaseClient = ReturnType<typeof createClient<any>>;
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

    const entitiesToInsert = aiSuggestions.entities
      .filter((entity) => entity.confidence !== "low")
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
          confidence: entity.confidence,
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
        id: entity.id,
        name: entity.name,
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
        const matchingEntity = resolveMemoryEntity(memory, knownEntities, existingEntityByName, entityMatchBySuggestedName);
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
      duplicate_candidates: insertedDuplicateCandidates,
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

async function listExistingSuggestedMemoriesForObservations(
  supabase: LifeOsSupabaseClient,
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

class PublicError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "PublicError";
    this.status = status;
  }
}
