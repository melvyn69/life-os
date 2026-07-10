export type ApiErrorCode =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INVALID_INPUT"
  | "INVALID_RELATIONSHIP_TYPE"
  | "INVALID_DIRECTION"
  | "INVALID_TEMPORAL_RANGE"
  | "ENTITY_OWNERSHIP_MISMATCH"
  | "RELATIONSHIP_CONFLICT"
  | "RELATIONSHIP_ARCHIVED"
  | "UNRESOLVED_CONTRADICTION"
  | "DUPLICATE_RELATIONSHIP"
  | "REJECTED_CANDIDATE"
  | "RATE_LIMITED"
  | "AI_OUTPUT_INVALID"
  | "AI_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export function createJsonResponse(
  body: unknown,
  corsHeaders: Readonly<Record<string, string>>,
  status = 200
) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    },
    status
  });
}

export function createErrorResponse({
  corsHeaders,
  error,
  fallbackMessage,
  requestId
}: {
  corsHeaders: Readonly<Record<string, string>>;
  error: unknown;
  fallbackMessage: string;
  requestId: string;
}) {
  if (error instanceof ApiError) {
    return createJsonResponse({
      error: {
        code: error.code,
        message: error.message,
        request_id: requestId
      }
    }, corsHeaders, error.status);
  }

  return createJsonResponse({
    error: {
      code: "INTERNAL_ERROR",
      message: fallbackMessage,
      request_id: requestId
    }
  }, corsHeaders, 500);
}

export async function pseudonymizeUserId(userId: string | null) {
  if (!userId) {
    return null;
  }

  const bytes = new TextEncoder().encode(userId);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .slice(0, 8)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function logSafeOperation({
  operation,
  requestId,
  userId,
  relationshipId = null,
  result,
  durationMs,
  evidenceCount = 0,
  errorCode = null,
  promptVersion = null,
  metrics = {}
}: {
  operation: string;
  requestId: string;
  userId: string | null;
  relationshipId?: string | null;
  result: "success" | "failure" | "partial";
  durationMs: number;
  evidenceCount?: number;
  errorCode?: ApiErrorCode | null;
  promptVersion?: string | null;
  metrics?: Readonly<Record<string, number>>;
}) {
  console.info(JSON.stringify({
    operation,
    request_id: requestId,
    user_ref: await pseudonymizeUserId(userId),
    relationship_id: relationshipId,
    result,
    duration_ms: Math.max(0, Math.round(durationMs)),
    evidence_count: Math.max(0, evidenceCount),
    error_code: errorCode,
    prompt_version: promptVersion,
    metrics
  }));
}
