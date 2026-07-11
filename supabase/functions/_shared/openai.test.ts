import { describe, expect, it } from "vitest";
import {
  maximumOpenAiRequestBodyLength,
  maximumOpenAiResponseBodyLength,
  OpenAiRequestError,
  requestOpenAiJson
} from "./openai";

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

  it("rejects an oversized request before network access", async () => {
    let requested = false;

    await expect(requestOpenAiJson({
      apiKey: "test-key",
      body: { content: "x".repeat(maximumOpenAiRequestBodyLength + 1) },
      fetcher: async () => {
        requested = true;
        return new Response("{}", { status: 200 });
      }
    })).rejects.toMatchObject<Partial<OpenAiRequestError>>({ failure: "input_too_large" });

    expect(requested).toBe(false);
  });

  it("rejects an oversized response before parsing it", async () => {
    await expect(requestOpenAiJson({
      apiKey: "test-key",
      body: {},
      fetcher: async () => new Response(
        JSON.stringify({ content: "x".repeat(maximumOpenAiResponseBodyLength) }),
        { status: 200 }
      )
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
