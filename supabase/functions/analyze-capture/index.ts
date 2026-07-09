import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.1";

type LifeOsSupabaseClient = ReturnType<typeof createClient<any>>;
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
      throw new PublicError("Sign in to analyze a capture.", 401);
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
      throw new PublicError("Sign in to analyze a capture.", 401);
    }

    const user = userData.user;

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
      return jsonResponse({ observations: existingObservations ?? [] });
    }

    const aiObservations = await extractObservationsWithOpenAi({
      apiKey: openAiKey,
      captureContent: capture.content,
      model: openAiModel
    });

    const observationsToInsert = aiObservations.map((observation) => ({
      capture_id: capture.id,
      confidence: observation.confidence,
      content: observation.content,
      sensitivity: observation.sensitivity,
      status: "suggested" as const,
      type: observation.type,
      user_id: user.id
    }));

    const insertedObservations = observationsToInsert.length > 0
      ? await insertObservations(supabase, observationsToInsert)
      : [];

    await markCaptureAnalyzed(supabase, capture.id, user.id);

    return jsonResponse({ observations: insertedObservations });
  } catch (error) {
    if (error instanceof PublicError) {
      return jsonResponse({ error: error.message }, error.status);
    }

    console.error(
      "Unexpected capture analysis error.",
      error instanceof Error ? error.name : typeof error
    );

    return jsonResponse({ error: "Unable to analyze this capture right now." }, 500);
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

  return validateAiObservationPayload(parsed);
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

  if (!observationTypes.has(type as ObservationType)) {
    throw new Error("AI response observation type is invalid.");
  }

  return type as ObservationType;
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
