import { expect, test } from "@playwright/test";
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const apiUrl = requireEnvironment("API_URL");
const anonKey = requireEnvironment("ANON_KEY");
const serviceRoleKey = requireEnvironment("SERVICE_ROLE_KEY");
const serviceClient = createClient<Database>(apiUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const anonClient = createClient<Database>(apiUrl, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});
const storageKey = `sb-${new URL(apiUrl).hostname.split(".")[0]}-auth-token`;

let userId = "";
let session: Session;
let sourceEntityId = "";
let targetEntityId = "";

test.beforeAll(async () => {
  const email = `graph-e2e-${crypto.randomUUID()}@example.test`;
  const password = `Test-${crypto.randomUUID()}-Aa1!`;
  const { data: createdUser, error: createUserError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  expect(createUserError).toBeNull();
  expect(createdUser.user).not.toBeNull();
  userId = createdUser.user?.id ?? "";

  const { data: signIn, error: signInError } = await anonClient.auth.signInWithPassword({ email, password });
  expect(signInError).toBeNull();
  expect(signIn.session).not.toBeNull();
  if (!signIn.session) {
    throw new Error("The E2E user session was not created.");
  }
  session = signIn.session;

  sourceEntityId = crypto.randomUUID();
  targetEntityId = crypto.randomUUID();
  const captureId = crypto.randomUUID();
  const observationId = crypto.randomUUID();

  const { error: captureError } = await serviceClient.from("captures").insert({
    id: captureId,
    user_id: userId,
    content: "Sarah and Life OS appear in the same context without a proven role.",
    status: "archived",
    sensitivity: "normal",
    source: "text"
  });
  expect(captureError).toBeNull();

  const { error: observationError } = await serviceClient.from("observations").insert({
    id: observationId,
    user_id: userId,
    capture_id: captureId,
    content: "Sarah and Life OS are mentioned together.",
    type: "relationship",
    confidence: "low",
    sensitivity: "normal",
    status: "suggested"
  });
  expect(observationError).toBeNull();

  const { error: entitiesError } = await serviceClient.from("entities").insert([
    {
      id: sourceEntityId,
      user_id: userId,
      name: "Sarah",
      type: "person",
      confidence: "high",
      sensitivity: "normal",
      status: "active"
    },
    {
      id: targetEntityId,
      user_id: userId,
      name: "Life OS",
      type: "project",
      confidence: "high",
      sensitivity: "normal",
      status: "active"
    }
  ]);
  expect(entitiesError).toBeNull();

  const { error: relationshipError } = await serviceClient.rpc("ingest_relationship_candidate", {
    p_user_id: userId,
    p_source_entity_id: sourceEntityId,
    p_target_entity_id: targetEntityId,
    p_relationship_type: "contextually_associated_with",
    p_explicitness: "implicit",
    p_observation_ids: [observationId],
    p_relation_to_claim: "contextual",
    p_sensitivity: "normal",
    p_explanation: "Mentioned together without a proven semantic role."
  });
  expect(relationshipError).toBeNull();
});

test.afterAll(async () => {
  if (userId) {
    await serviceClient.auth.admin.deleteUser(userId);
  }
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(({ key, authSession }) => {
    window.localStorage.setItem(key, JSON.stringify(authSession));
  }, { key: storageKey, authSession: session });
});

test("review, confirm, explore, correct, and inspect immutable history on mobile", async ({ page }) => {
  await page.goto("/relationships/review");
  await expect(page.getByRole("main").getByRole("heading", { name: "Relationship Review" })).toBeVisible();
  await expect(page.getByText(/^(Sarah ↔ Life OS|Life OS ↔ Sarah)$/)).toBeVisible();
  await expect(page.getByText("Suggested", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: /(Sarah ↔ Life OS|Life OS ↔ Sarah)/ }).click();
  const relationshipDialog = page.getByRole("dialog");
  await expect(relationshipDialog).toBeVisible();
  await expect(relationshipDialog.getByText("Mentioned together without a proven semantic role.")).toBeVisible();
  await expect(relationshipDialog.getByText("contextual", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close relationship detail" }).click();

  await page.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(page.getByText("Nothing needs review")).toBeVisible();

  await page.goto(`/graph/${sourceEntityId}`);
  await expect(page.getByRole("main").getByRole("heading", { name: "Life Graph" })).toBeVisible();
  await expect(page.getByRole("button", { name: /contextually associated with, confirmed/ })).toBeVisible();
  await expect(page.getByText("Confirmed", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: /contextually associated with, confirmed/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Correct", exact: true }).click();
  await page.getByLabel("Type").selectOption("contributes_to");
  await page.getByLabel("Sarah → Life OS").check();
  await page.getByLabel("Reason (optional)").fill("The user clarified the relationship type.");
  await page.getByRole("button", { name: "Save correction" }).click();
  await expect(page.getByRole("heading", { name: "Contributes to" })).toBeVisible();

  await page.getByText("Detailed history").click();
  await expect(page.getByText("corrected", { exact: true })).toBeVisible();
  await expect(page.locator("ol").getByText("The user clarified the relationship type.")).toBeVisible();

  const { data: relationshipRows, error: relationshipError } = await authenticatedClient(session)
    .from("relationships")
    .select("status, confidence")
    .eq("source_entity_id", sourceEntityId)
    .eq("target_entity_id", targetEntityId)
    .single();
  expect(relationshipError).toBeNull();
  expect(relationshipRows).toEqual({ status: "confirmed", confidence: "confirmed" });
});

test("graph navigation has accessible alternatives and mobile touch targets", async ({ page }) => {
  await page.goto(`/graph/${sourceEntityId}`);
  await expect(page.getByRole("navigation", { name: "Primary navigation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Graph" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Relationships" })).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();

  const graphLinkBox = await page.getByRole("link", { name: "Graph" }).boundingBox();
  expect(graphLinkBox?.height ?? 0).toBeGreaterThanOrEqual(44);
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
});

test("existing routes remain available after route-level bundle splitting", async ({ page }) => {
  const routes = [
    { path: "/", heading: "Home" },
    { path: "/capture", heading: "Capture" },
    { path: "/inbox", heading: "Inbox" },
    { path: "/entities", heading: "Entities" },
    { path: "/memory", heading: "Memory" },
    { path: "/briefing", heading: "Briefing" },
    { path: "/settings", heading: "Settings" }
  ];

  for (const route of routes) {
    await page.goto(route.path, { waitUntil: "networkidle" });
    await expect(page.getByRole("main").getByRole("heading", { name: route.heading, exact: true })).toBeVisible();
  }
});

function authenticatedClient(authSession: Session): SupabaseClient<Database> {
  return createClient<Database>(apiUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${authSession.access_token}`
      }
    },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function requireEnvironment(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}.`);
  }
  return value;
}
