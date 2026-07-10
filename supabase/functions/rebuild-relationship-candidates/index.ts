import {
  createClient,
  type SupabaseClient
} from "https://esm.sh/@supabase/supabase-js@2.110.1";
import type { Database } from "../_shared/database.ts";
import {
  isRecord,
  persistRelationshipSuggestions,
  readOpenAiJsonContent,
  relationshipSchema,
  validateAiRelationships
} from "../_shared/life-graph.ts";
import {
  ApiError,
  createErrorResponse,
  createJsonResponse,
  logSafeOperation,
  type ApiErrorCode
} from "../_shared/http.ts";
import { OpenAiRequestError, requestOpenAiJson } from "../_shared/openai.ts";

type LifeOsSupabaseClient = SupabaseClient<Database>;

type BackfillRequest = {
  cursor: string | null;
  limit: number;
  dry_run: boolean;
};

type BackfillCapture = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
};

type BackfillObservation = {
  id: string;
  content: string;
  confidence: string;
  sensitivity: string;
  type: string;
};

type BackfillEntity = {
  id: string;
  name: string;
  status: string;
  type: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const promptVersion = "life-os-rebuild-relationships-v1";
const maximumBatchSize = 50;
const maximumCaptureLength = 12_000;
const maximumObservationLength = 1_000;

const relationshipOnlySchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    relationships: relationshipSchema
  },
  required: ["relationships"]
};

const relationshipOnlyPrompt = [
  "You are the relationship extraction layer of a personal life companion.",
  "Use only the supplied canonical entities and observations.",
  "Suggest only canonical relationship types.",
  "Use contextually_associated_with for repeated context without a proven semantic role.",
  "Never infer employment, ownership, investment, family, romantic, medical, political, religious, sexual, emotional, or causal meaning from cooccurrence.",
  "Never resolve contradictions or confirm a relationship.",
  "Return no relationship when the evidence is insufficient or either entity reference is ambiguous.",
  "Every relationship must cite supplied observation IDs and use the exact supplied entity names.",
  "Return JSON only."
].join("\n");

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  let result: "success" | "failure" | "partial" = "failure";
  let metrics: Record<string, number> = {};
  let errorCode: ApiErrorCode | null = null;

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return createErrorResponse({
      corsHeaders,
      error: new ApiError("INVALID_INPUT", "Method not allowed.", 405),
      fallbackMessage: "Unable to rebuild relationship candidates.",
      requestId
    });
  }

  try {
    assertServiceRoleAuthorization(request);
    const input = await readBackfillRequest(request);
    const supabaseUrl = readRequiredEnv("SUPABASE_URL");
    const serviceRoleKey = readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const serviceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false
      }
    });
    const captures = await loadBackfillCaptures(serviceClient, input);
    const page = captures.slice(0, input.limit);
    const hasMore = captures.length > input.limit;
    let processed = 0;
    let failed = 0;
    let evidenceAdded = 0;
    let relationshipsCreated = 0;
    let relationshipsPromoted = 0;
    let relationshipsContradicted = 0;
    let relationshipsSkipped = 0;
    let relationshipValidationFailures = 0;

    if (!input.dry_run) {
      const apiKey = readRequiredEnv("OPENAI_API_KEY");
      const model = readRequiredEnv("OPENAI_MODEL");

      for (const capture of page) {
        try {
          const stats = await rebuildCaptureRelationships({
            apiKey,
            capture,
            model,
            serviceClient
          });

          processed += 1;
          evidenceAdded += stats.evidence_added;
          relationshipsCreated += stats.created;
          relationshipsPromoted += stats.promoted;
          relationshipsContradicted += stats.contradicted;
          relationshipsSkipped += stats.skipped;
        } catch (error) {
          failed += 1;
          if (error instanceof ApiError && error.code === "AI_OUTPUT_INVALID") {
            relationshipValidationFailures += 1;
          }
          console.warn(JSON.stringify({
            operation: "rebuild_relationship_capture",
            request_id: requestId,
            capture_id: capture.id,
            result: "failure",
            error_code: error instanceof ApiError ? error.code : "INTERNAL_ERROR"
          }));
        }
      }
    }

    const lastCapture = page.at(-1);
    const nextCursor = hasMore && lastCapture ? encodeCursor(lastCapture) : null;

    metrics = {
      captures_selected: page.length,
      captures_processed: processed,
      captures_failed: failed,
      relationship_candidates_generated: relationshipsCreated + relationshipsSkipped,
      relationships_created: relationshipsCreated,
      relationship_evidence_added: evidenceAdded,
      relationships_promoted: relationshipsPromoted,
      relationships_contradicted: relationshipsContradicted,
      ai_relationship_validation_failures: relationshipValidationFailures
    };
    result = failed > 0 ? "partial" : "success";

    return createJsonResponse({
      cursor: nextCursor,
      has_more: hasMore,
      dry_run: input.dry_run,
      stats: {
        captures_selected: page.length,
        captures_processed: input.dry_run ? 0 : processed,
        captures_failed: input.dry_run ? 0 : failed,
        relationships: {
          created: relationshipsCreated,
          evidence_added: evidenceAdded,
          promoted: relationshipsPromoted,
          contradicted: relationshipsContradicted,
          skipped: relationshipsSkipped
        }
      },
      prompt_version: promptVersion
    }, corsHeaders);
  } catch (error) {
    errorCode = error instanceof ApiError ? error.code : "INTERNAL_ERROR";
    metrics = { captures_selected: 0, captures_processed: 0, captures_failed: 0 };
    return createErrorResponse({
      corsHeaders,
      error,
      fallbackMessage: "Unable to rebuild relationship candidates.",
      requestId
    });
  } finally {
    await logSafeOperation({
      operation: "rebuild_relationship_candidates",
      requestId,
      userId: null,
      result,
      durationMs: performance.now() - startedAt,
      errorCode,
      promptVersion,
      metrics
    });
  }
});

async function rebuildCaptureRelationships({
  apiKey,
  capture,
  model,
  serviceClient
}: {
  apiKey: string;
  capture: BackfillCapture;
  model: string;
  serviceClient: LifeOsSupabaseClient;
}) {
  const [observations, entities] = await Promise.all([
    loadCaptureObservations(serviceClient, capture),
    loadUserEntities(serviceClient, capture.user_id)
  ]);

  if (observations.length === 0 || entities.length < 2) {
    return { created: 0, evidence_added: 0, promoted: 0, contradicted: 0, skipped: 0 };
  }

  const relationships = await extractRelationships({
    apiKey,
    capture,
    entities,
    model,
    observations
  });

  return persistRelationshipSuggestions({
    relationships,
    serviceClient,
    userId: capture.user_id,
    entityIdsByName: buildUniqueEntityMap(entities)
  });
}

async function loadBackfillCaptures(
  serviceClient: LifeOsSupabaseClient,
  input: BackfillRequest
) {
  let query = serviceClient
    .from("captures")
    .select("id, content, created_at, user_id")
    .eq("status", "archived")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(input.limit + 1);

  if (input.cursor) {
    const cursor = decodeCursor(input.cursor);
    query = query.or(
      `created_at.gt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`
    );
  }

  const { data, error } = await query;
  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Unable to load the backfill batch.", 500);
  }

  return (data ?? []).map(parseBackfillCapture);
}

async function loadCaptureObservations(
  serviceClient: LifeOsSupabaseClient,
  capture: BackfillCapture
) {
  const { data, error } = await serviceClient
    .from("observations")
    .select("id, content, confidence, sensitivity, type")
    .eq("user_id", capture.user_id)
    .eq("capture_id", capture.id)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Unable to load capture observations.", 500);
  }

  return (data ?? []).map(parseBackfillObservation);
}

async function loadUserEntities(serviceClient: LifeOsSupabaseClient, userId: string) {
  const { data, error } = await serviceClient
    .from("entities")
    .select("id, name, status, type")
    .eq("user_id", userId)
    .in("status", ["suggested", "active", "confirmed"])
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new ApiError("INTERNAL_ERROR", "Unable to load canonical entities.", 500);
  }

  return (data ?? []).map(parseBackfillEntity);
}

async function extractRelationships({
  apiKey,
  capture,
  entities,
  model,
  observations
}: {
  apiKey: string;
  capture: BackfillCapture;
  entities: BackfillEntity[];
  model: string;
  observations: BackfillObservation[];
}) {
  let completion: unknown;
  try {
    completion = await requestOpenAiJson({
      apiKey,
      body: {
        model,
        messages: [
          { role: "system", content: relationshipOnlyPrompt },
          {
            role: "user",
            content: JSON.stringify({
              capture: { content: capture.content.slice(0, maximumCaptureLength) },
              entities,
              observations: observations.map((observation) => ({
                ...observation,
                content: observation.content.slice(0, maximumObservationLength)
              }))
            })
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "life_os_relationship_backfill",
            schema: relationshipOnlySchema,
            strict: true
          }
        }
      }
    });
  } catch (error) {
    if (error instanceof OpenAiRequestError && error.failure === "invalid_json") {
      throw new ApiError("AI_OUTPUT_INVALID", "Relationship extraction returned invalid output.", 502);
    }
    throw new ApiError("AI_UNAVAILABLE", "Relationship extraction is temporarily unavailable.", 502);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readOpenAiJsonContent(completion));
  } catch {
    throw new ApiError("AI_OUTPUT_INVALID", "Relationship extraction returned invalid output.", 502);
  }

  if (!isRecord(parsed)) {
    throw new ApiError("AI_OUTPUT_INVALID", "Relationship extraction returned invalid output.", 502);
  }

  try {
    return validateAiRelationships(
      parsed.relationships,
      new Set(observations.map((observation) => observation.id))
    );
  } catch {
    throw new ApiError("AI_OUTPUT_INVALID", "Relationship extraction returned invalid output.", 502);
  }
}

async function readBackfillRequest(request: Request): Promise<BackfillRequest> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError("INVALID_INPUT", "Invalid request body.", 400);
  }

  if (!isRecord(body)) {
    throw new ApiError("INVALID_INPUT", "Invalid request body.", 400);
  }

  const cursor = body.cursor;
  const limit = body.limit;
  const dryRun = body.dry_run;

  if (cursor !== null && typeof cursor !== "string") {
    throw new ApiError("INVALID_INPUT", "Cursor must be a string or null.", 400);
  }

  if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 1 || limit > maximumBatchSize) {
    throw new ApiError("INVALID_INPUT", "Limit must be between 1 and 50.", 400);
  }

  if (typeof dryRun !== "boolean") {
    throw new ApiError("INVALID_INPUT", "dry_run must be a boolean.", 400);
  }

  if (cursor) {
    decodeCursor(cursor);
  }

  return { cursor, limit, dry_run: dryRun };
}

function assertServiceRoleAuthorization(request: Request) {
  const authorization = request.headers.get("Authorization");
  const serviceRoleKey = readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (authorization !== `Bearer ${serviceRoleKey}`) {
    throw new ApiError("FORBIDDEN", "This operation requires service-role authorization.", 403);
  }
}

function readRequiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new ApiError("INTERNAL_ERROR", "Relationship backfill is not configured.", 500);
  }
  return value;
}

function buildUniqueEntityMap(entities: BackfillEntity[]) {
  const entityIds = new Map<string, string>();
  const ambiguous = new Set<string>();

  for (const entity of entities) {
    const key = entity.name.trim().toLocaleLowerCase();
    if (entityIds.has(key)) {
      entityIds.delete(key);
      ambiguous.add(key);
    } else if (!ambiguous.has(key)) {
      entityIds.set(key, entity.id);
    }
  }

  return entityIds;
}

function encodeCursor(capture: Pick<BackfillCapture, "created_at" | "id">) {
  return btoa(JSON.stringify({ created_at: capture.created_at, id: capture.id }));
}

function decodeCursor(value: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(atob(value));
  } catch {
    throw new ApiError("INVALID_INPUT", "Cursor is invalid.", 400);
  }

  if (!isRecord(parsed) || typeof parsed.created_at !== "string" || typeof parsed.id !== "string") {
    throw new ApiError("INVALID_INPUT", "Cursor is invalid.", 400);
  }

  if (!/^\d{4}-\d{2}-\d{2}T/.test(parsed.created_at) || !/^[0-9a-f-]{36}$/i.test(parsed.id)) {
    throw new ApiError("INVALID_INPUT", "Cursor is invalid.", 400);
  }

  return { createdAt: parsed.created_at, id: parsed.id };
}

function parseBackfillCapture(value: unknown): BackfillCapture {
  if (!isRecord(value)) {
    throw new ApiError("INTERNAL_ERROR", "Stored capture is invalid.", 500);
  }
  return {
    id: readStoredString(value.id),
    content: readStoredString(value.content),
    created_at: readStoredString(value.created_at),
    user_id: readStoredString(value.user_id)
  };
}

function parseBackfillObservation(value: unknown): BackfillObservation {
  if (!isRecord(value)) {
    throw new ApiError("INTERNAL_ERROR", "Stored observation is invalid.", 500);
  }
  return {
    id: readStoredString(value.id),
    content: readStoredString(value.content),
    confidence: readStoredString(value.confidence),
    sensitivity: readStoredString(value.sensitivity),
    type: readStoredString(value.type)
  };
}

function parseBackfillEntity(value: unknown): BackfillEntity {
  if (!isRecord(value)) {
    throw new ApiError("INTERNAL_ERROR", "Stored entity is invalid.", 500);
  }
  return {
    id: readStoredString(value.id),
    name: readStoredString(value.name),
    status: readStoredString(value.status),
    type: readStoredString(value.type)
  };
}

function readStoredString(value: unknown) {
  if (typeof value !== "string") {
    throw new ApiError("INTERNAL_ERROR", "Stored backfill data is invalid.", 500);
  }
  return value;
}
