import { describe, expect, it } from "vitest";
import { OpenAiRequestError, requestOpenAiJson } from "./openai";

describe("OpenAI transport boundary", () => {
  it("returns parsed JSON for a successful response", async () => {
    const value = await requestOpenAiJson({
      apiKey: "test-key",
      body: { model: "test-model" },
      fetcher: async () => new Response(JSON.stringify({ choices: [] }), { status: 200 })
    });

    expect(value).toEqual({ choices: [] });
  });

  it("classifies provider errors without exposing the response body", async () => {
    await expect(requestOpenAiJson({
      apiKey: "test-key",
      body: {},
      fetcher: async () => new Response("provider-secret", { status: 503 })
    })).rejects.toMatchObject<Partial<OpenAiRequestError>>({ failure: "unavailable" });
  });

  it("classifies malformed response JSON", async () => {
    await expect(requestOpenAiJson({
      apiKey: "test-key",
      body: {},
      fetcher: async () => new Response("not-json", { status: 200 })
    })).rejects.toMatchObject<Partial<OpenAiRequestError>>({ failure: "invalid_json" });
  });

  it("aborts a request that exceeds the bounded timeout", async () => {
    const fetcher: typeof fetch = (_input, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => {
        reject(new DOMException("Aborted", "AbortError"));
      }, { once: true });
    });

    await expect(requestOpenAiJson({
      apiKey: "test-key",
      body: {},
      fetcher,
      timeoutMs: 5
    })).rejects.toMatchObject<Partial<OpenAiRequestError>>({ failure: "timeout" });
  });
});
