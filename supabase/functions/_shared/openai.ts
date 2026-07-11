export type OpenAiRequestFailure = "input_too_large" | "invalid_json" | "timeout" | "unavailable";

export const maximumOpenAiCompletionTokens = 4_096;
export const maximumOpenAiRequestBodyLength = 100_000;
export const maximumOpenAiResponseBodyLength = 100_000;

export class OpenAiRequestError extends Error {
  readonly failure: OpenAiRequestFailure;

  constructor(failure: OpenAiRequestFailure) {
    super(`OpenAI request failed: ${failure}.`);
    this.name = "OpenAiRequestError";
    this.failure = failure;
  }
}

export async function requestOpenAiJson({
  apiKey,
  body,
  fetcher = fetch,
  timeoutMs = 30_000
}: {
  apiKey: string;
  body: unknown;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const serializedBody = JSON.stringify(body);

  if (
    typeof serializedBody !== "string" ||
    new TextEncoder().encode(serializedBody).byteLength > maximumOpenAiRequestBodyLength
  ) {
    clearTimeout(timeoutId);
    throw new OpenAiRequestError("input_too_large");
  }

  try {
    let response: Response;
    try {
      response = await fetcher("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: serializedBody
      });
    } catch {
      throw new OpenAiRequestError(controller.signal.aborted ? "timeout" : "unavailable");
    }

    if (!response.ok) {
      throw new OpenAiRequestError("unavailable");
    }

    return await readBoundedJsonResponse(response, controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readBoundedJsonResponse(response: Response, signal: AbortSignal): Promise<unknown> {
  const declaredLength = response.headers.get("content-length");
  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength);
    if (Number.isFinite(parsedLength) && parsedLength > maximumOpenAiResponseBodyLength) {
      throw new OpenAiRequestError("invalid_json");
    }
  }

  if (!response.body) {
    throw new OpenAiRequestError("invalid_json");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      totalLength += value.byteLength;
      if (totalLength > maximumOpenAiResponseBodyLength) {
        await reader.cancel();
        throw new OpenAiRequestError("invalid_json");
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof OpenAiRequestError) {
      throw error;
    }
    if (signal.aborted) {
      throw new OpenAiRequestError("timeout");
    }
    throw new OpenAiRequestError("invalid_json");
  }

  const body = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body));
    return parsed;
  } catch {
    throw new OpenAiRequestError("invalid_json");
  }
}
