export type OpenAiRequestFailure = "invalid_json" | "timeout" | "unavailable";

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
        body: JSON.stringify(body)
      });
    } catch {
      throw new OpenAiRequestError(controller.signal.aborted ? "timeout" : "unavailable");
    }

    if (!response.ok) {
      throw new OpenAiRequestError("unavailable");
    }

    try {
      const value: unknown = await response.json();
      return value;
    } catch {
      throw new OpenAiRequestError("invalid_json");
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
