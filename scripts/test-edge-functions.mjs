import assert from "node:assert/strict";
import { createHmac, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const apiUrl = requireEnvironment("API_URL");
const anonKey = requireEnvironment("ANON_KEY");
const serviceRoleKey = requireEnvironment("SERVICE_ROLE_KEY");
const jwtSecret = requireEnvironment("JWT_SECRET");
const serviceClient = createClient(apiUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const anonClient = createClient(apiUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const email = `edge-${randomUUID()}@example.test`;
const password = `Test-${randomUUID()}-Aa1!`;
let userId = null;

try {
  const { data: createdUser, error: createUserError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  assert.equal(createUserError, null);
  assert.ok(createdUser.user);
  userId = createdUser.user.id;

  const { data: signIn, error: signInError } = await anonClient.auth.signInWithPassword({ email, password });
  assert.equal(signInError, null);
  assert.ok(signIn.session?.access_token);
  const accessToken = signIn.session.access_token;

  const captureId = randomUUID();
  const { error: captureError } = await serviceClient.from("captures").insert({
    id: captureId,
    user_id: userId,
    content: "Already processed edge-function fixture.",
    status: "archived",
    sensitivity: "normal",
    source: "text"
  });
  assert.equal(captureError, null);

  const { error: observationError } = await serviceClient.from("observations").insert({
    user_id: userId,
    capture_id: captureId,
    content: "Archived observation fixture.",
    type: "other",
    confidence: "low",
    sensitivity: "normal",
    status: "archived"
  });
  assert.equal(observationError, null);

  const historicalCaptures = Array.from({ length: 51 }, (_, index) => ({
    user_id: userId,
    content: `Historical capture fixture ${index + 1}.`,
    status: "archived",
    sensitivity: "normal",
    source: "text",
    created_at: new Date(Date.UTC(2025, 0, 1, 0, 0, index)).toISOString()
  }));
  const { error: historicalError } = await serviceClient.from("captures").insert(historicalCaptures);
  assert.equal(historicalError, null);

  const anonymousProcess = await invokeFunction("process-observations", {
    capture_id: captureId
  }, anonKey, anonKey);
  assert.equal(anonymousProcess.response.status, 401, JSON.stringify(anonymousProcess.body));
  assert.equal(readErrorCode(anonymousProcess.body), "AUTH_REQUIRED");

  const analyzed = await invokeFunction("analyze-capture", {
    capture_id: captureId
  }, accessToken, anonKey);
  assert.equal(analyzed.response.status, 200);
  assert.ok(isRecord(analyzed.body) && Array.isArray(analyzed.body.observations));
  assert.equal(analyzed.body.observations.length, 1);

  const processed = await invokeFunction("process-observations", {
    capture_id: captureId
  }, accessToken, anonKey);
  assert.equal(processed.response.status, 200);
  assert.ok(isRecord(processed.body) && isRecord(processed.body.relationships));
  assert.deepEqual(processed.body.relationships, {
    created: 0,
    evidence_added: 0,
    promoted: 0,
    contradicted: 0,
    skipped: 0
  });

  const briefing = await invokeFunction("generate-briefing", {}, accessToken, anonKey);
  assert.equal(briefing.response.status, 400);
  assert.equal(readErrorCode(briefing.body), "INVALID_INPUT");

  const forbiddenBackfill = await invokeFunction("rebuild-relationship-candidates", {
    cursor: null,
    limit: 50,
    dry_run: true
  }, anonKey, anonKey);
  assert.equal(forbiddenBackfill.response.status, 403);
  assert.equal(readErrorCode(forbiddenBackfill.body), "FORBIDDEN");

  const invalidBackfill = await invokeFunction("rebuild-relationship-candidates", {
    cursor: null,
    limit: 51,
    dry_run: true
  }, serviceRoleKey, serviceRoleKey);
  assert.equal(invalidBackfill.response.status, 400);
  assert.equal(readErrorCode(invalidBackfill.body), "INVALID_INPUT");

  const firstPage = await invokeFunction("rebuild-relationship-candidates", {
    cursor: null,
    limit: 50,
    dry_run: true
  }, serviceRoleKey, serviceRoleKey);
  assert.equal(firstPage.response.status, 200);
  const firstPageBody = readBackfillBody(firstPage.body);
  assert.equal(firstPageBody.stats.captures_selected, 50);
  assert.equal(firstPageBody.has_more, true);
  assert.equal(typeof firstPageBody.cursor, "string");
  assert.equal(firstPageBody.stats.captures_processed, 0);

  const secondPage = await invokeFunction("rebuild-relationship-candidates", {
    cursor: firstPageBody.cursor,
    limit: 50,
    dry_run: true
  }, serviceRoleKey, serviceRoleKey);
  assert.equal(secondPage.response.status, 200);
  const secondPageBody = readBackfillBody(secondPage.body);
  assert.ok(secondPageBody.stats.captures_selected >= 2);
  assert.equal(secondPageBody.has_more, false);
  assert.equal(secondPageBody.stats.captures_processed, 0);

  const expiredToken = createExpiredToken(userId, jwtSecret);
  const expiredRequest = await invokeFunction("analyze-capture", {
    capture_id: captureId
  }, expiredToken, anonKey);
  assert.equal(expiredRequest.response.status, 401);

  const { count: relationshipCount, error: relationshipCountError } = await serviceClient
    .from("relationships")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  assert.equal(relationshipCountError, null);
  assert.equal(relationshipCount, 0);

  console.log("Edge Function integration tests passed (auth, stable errors, dry-run, pagination, cursor resume, idempotence, processed capture).");
} finally {
  if (userId) {
    await serviceClient.auth.admin.deleteUser(userId);
  }
}

async function invokeFunction(name, body, authorization, apiKey) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(`${apiUrl}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authorization}`,
        apikey: apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    let responseBody;
    try {
      responseBody = await response.json();
    } catch {
      responseBody = null;
    }
    if (response.status !== 503 || attempt === 4) {
      return { response, body: responseBody };
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("The Edge Function did not return a response.");
}

function readErrorCode(value) {
  assert.ok(isRecord(value));
  assert.ok(isRecord(value.error));
  assert.equal(typeof value.error.code, "string");
  return value.error.code;
}

function readBackfillBody(value) {
  assert.ok(isRecord(value));
  assert.ok(isRecord(value.stats));
  assert.equal(typeof value.stats.captures_selected, "number");
  assert.equal(typeof value.stats.captures_processed, "number");
  assert.equal(typeof value.has_more, "boolean");
  assert.ok(value.cursor === null || typeof value.cursor === "string");
  return value;
}

function createExpiredToken(userIdValue, secret) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    aud: "authenticated",
    exp: 1,
    iat: 1,
    role: "authenticated",
    sub: userIdValue
  });
  const signature = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireEnvironment(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}
