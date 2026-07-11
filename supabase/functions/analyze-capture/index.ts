import {
  createClient,
  type SupabaseClient
} from "https://esm.sh/@supabase/supabase-js@2.110.1";
import type { Database } from "../_shared/database.ts";
import { isRecord, readOpenAiJsonContent } from "../_shared/life-graph.ts";
import { logSafeOperation, type ApiErrorCode } from "../_shared/http.ts";
import {
  maximumOpenAiCompletionTokens,
  OpenAiRequestError,
  requestOpenAiJson
} from "../_shared/openai.ts";

type LifeOsSupabaseClient = SupabaseClient<Database>;
type Confidence = "low" | "medium" | "high";
type Sensitivity = "normal" | "sensitive";
type ObservationType = "fact" | "preference" | "event" | "emotion" | "goal" | "relationship" | "other";

type AiObservation = {
  content: string;
  type: ObservationType;
  confidence: Confidence;
  sensitivity: Sensitivity;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

const observationTypes = new Set<ObservationType>([
  "fact",
  "preference",
  "event",
  "emotion",
  "goal",
  "relationship",
  "other"
]);

const confidenceLevels = new Set<Confidence>(["low", "medium", "high"]);
const sensitivityLevels = new Set<Sensitivity>(["normal", "sensitive"]);
const promptVersion = "life-os-analyze-capture-v2";
const maximumCaptureLength = 12_000;

const observationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    observations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          content: {
            type: "string",
            description: "A cautious observation grounded only in the capture text."
          },
          type: {
            type: "string",
            enum: [...observationTypes]
          },
          confidence: {
            type: "string",
            enum: [...confidenceLevels]
          },
          sensitivity: {
            type: "string",
            enum: [...sensitivityLevels]
          }
        },
        required: ["content", "type", "confidence", "sensitivity"]
      }
    }
  },
  required: ["observations"]
};

const systemPrompt = [
  "You are the observation layer of a personal life companion.",
  "Extract only factual or strongly implied observations from the user's capture.",
  "Do not invent.",
  "Do not diagnose.",
  "Do not create entities.",
  "Do not create memories.",
  "Do not make sensitive assumptions.",
  "Prefer fewer observations over weak interpretation.",
  "Use sensitivity 'sensitive' for health, family, finances, religion, politics, sexuality, emotional vulnerability, conflict, identity, safety, reputation, or third-party private details.",
  "Return JSON only."
].join("\n");

Deno.serve(async (request) => {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  let userId: string | null = null;
  let result: "success" | "failure" = "failure";
  let observationCount = 0;
  let errorCode: ApiErrorCode | null = null;

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
    const captureId = await readCaptureId(request);
    const authorization = request.headers.get("Authorization");

    if (!authorization) {
      throw new PublicError("Sign in to analyze a capture.", 401);
    }

    const supabaseUrl = readEnv("SUPABASE_URL");
    const supabaseAnonKey = readEnv("SUPABASE_ANON_KEY");

    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization
        }
      }
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      throw new PublicError("Sign in to analyze a capture.", 401);
    }

    const user = userData.user;
    userId = user.id;

    const { data: capture, error: captureError } = await supabase
      .from("captures")
      .select("*")
      .eq("id", captureId)
      .eq("user_id", user.id)
      .single();

    if (captureError || !capture) {
      throw new PublicError("Capture not found.", 404);
    }

    if (capture.status === "deleted") {
      throw new PublicError("Deleted captures cannot be analyzed.", 400);
    }

    const { data: existingObservations, error: existingObservationsError } = await supabase
      .from("observations")
      .select("*")
      .eq("capture_id", capture.id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (existingObservationsError) {
      throw existingObservationsError;
    }

    if ((existingObservations?.length ?? 0) > 0) {
      await markCaptureAnalyzed(supabase, capture.id, user.id);
      observationCount = existingObservations?.length ?? 0;
      result = "success";
      return jsonResponse({ observations: existingObservations ?? [] });
    }

    if (capture.content.length > maximumCaptureLength) {
      throw new PublicError("Capture is too large to analyze safely.", 400, "INVALID_INPUT");
    }

    const aiObservations = await extractObservationsWithOpenAi({
      apiKey: readEnv("OPENAI_API_KEY"),
      captureContent: capture.content,
      model: readEnv("OPENAI_MODEL")
    });

    const observationsToInsert: Array<{
      capture_id: string;
      confidence: Confidence;
      content: string;
      sensitivity: Sensitivity;
      status: "suggested";
      type: ObservationType;
      user_id: string;
    }> = aiObservations.map((observation) => ({
      capture_id: capture.id,
      confidence: observation.confidence,
      content: observation.content,
      sensitivity: observation.sensitivity,
      status: "suggested",
      type: observation.type,
      user_id: user.id
    }));

    const insertedObservations = observationsToInsert.length > 0
      ? await insertObservations(supabase, observationsToInsert)
      : [];

    await markCaptureAnalyzed(supabase, capture.id, user.id);

    observationCount = insertedObservations.length;
    result = "success";
    return jsonResponse({ observations: insertedObservations });
  } catch (error) {
    if (error instanceof PublicError) {
      errorCode = error.code;
      return jsonResponse({ error: { code: error.code, message: error.message, request_id: requestId } }, error.status);
    }

    console.error(
      "Unexpected capture analysis error.",
      error instanceof Error ? error.name : typeof error
    );

    errorCode = "INTERNAL_ERROR";
    return jsonResponse({
      error: {
        code: "INTERNAL_ERROR",
        message: "Unable to analyze this capture right now.",
        request_id: requestId
      }
    }, 500);
  } finally {
    await logSafeOperation({
      operation: "analyze_capture",
      requestId,
      userId,
      result,
      durationMs: performance.now() - startedAt,
      errorCode,
      promptVersion,
      metrics: { observations_created_or_returned: observationCount }
    });
  }
});

async function extractObservationsWithOpenAi({
  apiKey,
  captureContent,
  model
}: {
  apiKey: string;
  captureContent: string;
  model: string;
}) {
  let completion: unknown;
  try {
    completion = await requestOpenAiJson({
      apiKey,
      body: {
        model,
        max_completion_tokens: maximumOpenAiCompletionTokens,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Capture:\n${captureContent}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "life_os_capture_observations",
            schema: observationSchema,
            strict: true
          }
        }
      }
    });
  } catch (error) {
    if (error instanceof OpenAiRequestError && error.failure === "input_too_large") {
      throw new PublicError("Capture is too large to analyze safely.", 400, "INVALID_INPUT");
    }
    if (error instanceof OpenAiRequestError && error.failure === "invalid_json") {
      throw new PublicError("Unable to analyze this capture right now.", 502, "AI_OUTPUT_INVALID");
    }
    throw new PublicError("Unable to analyze this capture right now.", 502, "AI_UNAVAILABLE");
  }

  try {
    const content = readOpenAiJsonContent(completion);
    const parsed: unknown = JSON.parse(content);
    return validateAiObservationPayload(parsed);
  } catch {
    throw new PublicError("Unable to analyze this capture right now.", 502, "AI_OUTPUT_INVALID");
  }
}

function validateAiObservationPayload(payload: unknown) {
  if (!isRecord(payload)) {
    throw new Error("AI response must be an object.");
  }

  const observations = payload.observations;

  if (!Array.isArray(observations)) {
    throw new Error("AI response observations must be an array.");
  }

  if (observations.length > 6) {
    throw new Error("AI response returned too many observations.");
  }

  return observations.map(validateAiObservation);
}

function validateAiObservation(value: unknown): AiObservation {
  if (!isRecord(value)) {
    throw new Error("AI observation must be an object.");
  }

  const content = readString(value.content, "content").trim();
  const type = readObservationType(value.type);
  const confidence = readConfidence(value.confidence);
  const sensitivity = readSensitivity(value.sensitivity);

  if (!content) {
    throw new Error("AI observation content is required.");
  }

  if (content.length > 700) {
    throw new Error("AI observation content is too long.");
  }

  return {
    content,
    type,
    confidence,
    sensitivity
  };
}

async function insertObservations(
  supabase: LifeOsSupabaseClient,
  observations: Array<{
    capture_id: string;
    confidence: Confidence;
    content: string;
    sensitivity: Sensitivity;
    status: "suggested";
    type: ObservationType;
    user_id: string;
  }>
) {
  const { data, error } = await supabase.from("observations").insert(observations).select();

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function markCaptureAnalyzed(
  supabase: LifeOsSupabaseClient,
  captureId: string,
  userId: string
) {
  const { error } = await supabase
    .from("captures")
    .update({
      // docs/017 keeps persisted statuses canonical; archived means the raw capture
      // has moved out of the active awaiting-analysis inbox after successful analysis.
      status: "archived",
      updated_at: new Date().toISOString()
    })
    .eq("id", captureId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
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

function readObservationType(value: unknown): ObservationType {
  const type = readString(value, "type");

  switch (type) {
    case "fact":
    case "preference":
    case "event":
    case "emotion":
    case "goal":
    case "relationship":
    case "other":
      return type;
    default:
      throw new Error("AI response observation type is invalid.");
  }
}

function readConfidence(value: unknown): Confidence {
  const confidence = readString(value, "confidence");

  if (confidence === "low" || confidence === "medium" || confidence === "high") {
    return confidence;
  }

  throw new Error("AI response confidence is invalid.");
}

function readSensitivity(value: unknown): Sensitivity {
  const sensitivity = readString(value, "sensitivity");

  if (sensitivity === "normal" || sensitivity === "sensitive") {
    return sensitivity;
  }

  throw new Error("AI response sensitivity is invalid.");
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
