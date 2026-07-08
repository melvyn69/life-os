import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type Capture = Database["public"]["Tables"]["captures"]["Row"];
type CaptureStatus = Capture["status"];

const INBOX_CANDIDATE_CAPTURE_STATUSES: CaptureStatus[] = ["active"];

type CreateCaptureInput = {
  content: string;
};

export class AuthRequiredError extends Error {
  constructor() {
    super("You must be signed in to use Life OS.");
    this.name = "AuthRequiredError";
  }
}

export async function getCurrentUserId() {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !sessionData.session) {
    throw new AuthRequiredError();
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw new AuthRequiredError();
  }

  if (!data.user) {
    throw new AuthRequiredError();
  }

  return data.user.id;
}

export async function createCapture({ content }: CreateCaptureInput) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    throw new Error("Capture content is required.");
  }

  const userId = await getCurrentUserId();

  const { data, error } = await supabase
    .from("captures")
    .insert({
      content: trimmedContent,
      source: "manual",
      // v0.1 persists only canonical statuses from docs/017.
      // An active capture is an Inbox candidate until a later analysis step handles it.
      status: "active",
      sensitivity: "normal",
      user_id: userId
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export function isInboxCandidateCapture(capture: Pick<Capture, "status">) {
  return INBOX_CANDIDATE_CAPTURE_STATUSES.includes(capture.status);
}

export async function listInboxCaptures() {
  const userId = await getCurrentUserId();

  // Active captures are raw inbox candidates. Once analysis succeeds, the Edge
  // Function archives the raw capture and creates suggested observations.
  const { data, error } = await supabase
    .from("captures")
    .select("*")
    .eq("user_id", userId)
    .in("status", INBOX_CANDIDATE_CAPTURE_STATUSES)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}
