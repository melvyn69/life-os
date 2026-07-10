import { supabase } from "@/lib/supabase";
import {
  isRecord,
  readBoolean,
  readNullableString,
  readNumber,
  readString,
  readStringArray
} from "@/lib/runtime";
import { getCurrentUserId } from "@/services/captures";
import type { Json } from "@/types/database";
import type {
  Relationship,
  RelationshipActions,
  RelationshipConfidence,
  RelationshipCorrection,
  RelationshipDatePrecision,
  RelationshipDetail,
  RelationshipDisplayState,
  RelationshipEntity,
  RelationshipEvidence,
  RelationshipHistoryEntry,
  EntityRelationshipItem,
  RelationshipReviewFilter,
  RelationshipReviewItem,
  RelationshipReviewPage,
  RelationshipSensitivity,
  RelationshipStatus,
  RelationshipType
} from "@/types/relationships";

export class RelationshipServiceError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(getRelationshipErrorMessage(code));
    this.name = "RelationshipServiceError";
    this.code = code;
  }
}

export async function getRelationshipDetail(
  relationshipId: string,
  evidenceCursor: string | null = null,
  historyCursor: string | null = null,
  limit = 20
) {
  const { data, error } = await supabase.rpc("get_relationship_detail", {
    p_relationship_id: relationshipId,
    p_evidence_cursor: evidenceCursor ?? undefined,
    p_history_cursor: historyCursor ?? undefined,
    p_limit: limit
  });

  if (error) {
    throwRelationshipError(error.message);
  }

  return parseRelationshipDetail(data);
}

export async function getRelationshipReviewQueue(
  filter: RelationshipReviewFilter,
  cursor: string | null = null,
  limit = 20
) {
  const { data, error } = await supabase.rpc("get_relationship_review_queue", {
    p_filter: filter,
    p_cursor: cursor ?? undefined,
    p_limit: limit
  });

  if (error) {
    throwRelationshipError(error.message);
  }

  return parseRelationshipReviewPage(data);
}

export async function confirmRelationship(relationshipId: string) {
  return mutateRelationship("confirm_relationship", { p_relationship_id: relationshipId });
}

export async function rejectRelationship({
  relationshipId,
  reason
}: {
  relationshipId: string;
  reason: string | null;
}) {
  return mutateRelationship("reject_relationship", {
    p_relationship_id: relationshipId,
    p_reason: reason ?? undefined
  });
}

export async function correctRelationship(correction: RelationshipCorrection) {
  return mutateRelationship("correct_relationship", {
    p_relationship_id: correction.relationshipId,
    p_relationship_type: correction.relationshipType,
    p_source_entity_id: correction.sourceEntityId,
    p_target_entity_id: correction.targetEntityId,
    p_start_date: correction.startDate ?? undefined,
    p_end_date: correction.endDate ?? undefined,
    p_date_precision: correction.datePrecision,
    p_reason: correction.reason ?? undefined
  });
}

export async function markRelationshipOutdated({
  relationshipId,
  endDate,
  datePrecision
}: {
  relationshipId: string;
  endDate: string | null;
  datePrecision: RelationshipDatePrecision;
}) {
  return mutateRelationship("mark_relationship_outdated", {
    p_relationship_id: relationshipId,
    p_end_date: endDate ?? undefined,
    p_date_precision: datePrecision
  });
}

export async function setRelationshipVisibility({
  relationshipId,
  isVisible
}: {
  relationshipId: string;
  isVisible: boolean;
}) {
  return mutateRelationship("set_relationship_visibility", {
    p_relationship_id: relationshipId,
    p_is_visible: isVisible
  });
}

export async function archiveRelationship(relationshipId: string) {
  return mutateRelationship("archive_relationship", { p_relationship_id: relationshipId });
}

export async function restoreRelationship(relationshipId: string) {
  return mutateRelationship("restore_relationship", { p_relationship_id: relationshipId });
}

export async function listEntityRelationships(entityId: string) {
  const userId = await getCurrentUserId();
  const { data, error } = await supabase
    .from("relationships")
    .select("*")
    .eq("user_id", userId)
    .or(`source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (error) {
    throwRelationshipError(error.message);
  }

  const relationships = (data ?? []).map(parseRelationship);
  const entityIds = [...new Set(relationships.flatMap((relationship) => [
    relationship.source_entity_id,
    relationship.target_entity_id
  ]))];

  if (entityIds.length === 0) {
    return [];
  }

  const { data: entities, error: entitiesError } = await supabase
    .from("entities")
    .select("id, name, type")
    .eq("user_id", userId)
    .in("id", entityIds);

  if (entitiesError) {
    throwRelationshipError(entitiesError.message);
  }

  const entitiesById = new Map((entities ?? []).map((entity) => [entity.id, entity]));

  return relationships.flatMap((relationship): EntityRelationshipItem[] => {
    const sourceEntity = entitiesById.get(relationship.source_entity_id);
    const targetEntity = entitiesById.get(relationship.target_entity_id);
    if (!sourceEntity || !targetEntity) {
      return [];
    }
    return [{
      relationship,
      source_entity: sourceEntity,
      target_entity: targetEntity
    }];
  });
}

export function parseRelationshipDetail(value: unknown): RelationshipDetail {
  if (!isRecord(value) || !isRecord(value.evidence_summary) || !isRecord(value.actions)) {
    throw new Error("The relationship detail response is invalid.");
  }
  if (!Array.isArray(value.evidence) || !Array.isArray(value.history) || !Array.isArray(value.contradictions)) {
    throw new Error("The relationship detail response is invalid.");
  }
  if (!isRecord(value.page_info)) {
    throw new Error("The relationship detail response is invalid.");
  }

  return {
    relationship: parseRelationship(value.relationship),
    source_entity: parseRelationshipEntity(value.source_entity),
    target_entity: parseRelationshipEntity(value.target_entity),
    evidence_summary: {
      supporting: readNumber(value.evidence_summary.supporting, "supporting evidence count"),
      contradicting: readNumber(value.evidence_summary.contradicting, "contradicting evidence count"),
      contextual: readNumber(value.evidence_summary.contextual, "contextual evidence count"),
      independent_sources: readNumber(value.evidence_summary.independent_sources, "independent source count")
    },
    evidence: value.evidence.map(parseRelationshipEvidence),
    history: value.history.map(parseRelationshipHistory),
    contradictions: value.contradictions.map((contradiction) => {
      if (!isRecord(contradiction)) {
        throw new Error("The relationship contradiction is invalid.");
      }
      return {
        id: readString(contradiction.id, "contradiction id"),
        excerpt: readNullableString(contradiction.excerpt, "contradiction excerpt"),
        observed_at: readNullableString(contradiction.observed_at, "contradiction date"),
        source_strength: readEvidenceStrength(contradiction.source_strength)
      };
    }),
    actions: parseRelationshipActions(value.actions),
    page_info: {
      evidence_next_cursor: readNullableString(value.page_info.evidence_next_cursor, "evidence cursor"),
      evidence_has_more: readBoolean(value.page_info.evidence_has_more, "more evidence"),
      history_next_cursor: readNullableString(value.page_info.history_next_cursor, "history cursor"),
      history_has_more: readBoolean(value.page_info.history_has_more, "more history")
    }
  };
}

export function parseRelationshipReviewPage(value: unknown): RelationshipReviewPage {
  if (!isRecord(value) || !Array.isArray(value.items) || !isRecord(value.page_info)) {
    throw new Error("The relationship review response is invalid.");
  }

  return {
    items: value.items.map(parseRelationshipReviewItem),
    page_info: {
      next_cursor: readNullableString(value.page_info.next_cursor, "review cursor"),
      has_more: readBoolean(value.page_info.has_more, "more review items")
    }
  };
}

export function parseRelationship(value: unknown): Relationship {
  if (!isRecord(value)) {
    throw new Error("The relationship response is invalid.");
  }

  return {
    id: readString(value.id, "relationship id"),
    source_entity_id: readString(value.source_entity_id, "relationship source"),
    target_entity_id: readString(value.target_entity_id, "relationship target"),
    relationship_type: readRelationshipType(value.relationship_type),
    status: readRelationshipStatus(value.status),
    confidence: readRelationshipConfidence(value.confidence),
    sensitivity: readRelationshipSensitivity(value.sensitivity),
    is_directional: readBoolean(value.is_directional, "relationship direction"),
    is_visible: readBoolean(value.is_visible, "relationship visibility"),
    start_date: readNullableString(value.start_date, "relationship start date"),
    end_date: readNullableString(value.end_date, "relationship end date"),
    date_precision: readRelationshipDatePrecision(value.date_precision),
    explanation: readNullableString(value.explanation, "relationship explanation"),
    first_observed_at: readNullableString(value.first_observed_at, "first observation date"),
    last_observed_at: readNullableString(value.last_observed_at, "last observation date"),
    last_confirmed_at: readNullableString(value.last_confirmed_at, "last confirmation date"),
    archived_at: readNullableString(value.archived_at, "archive date"),
    evidence_set_hash: readNullableString(value.evidence_set_hash, "evidence set hash"),
    candidate_fingerprint: readString(value.candidate_fingerprint, "relationship fingerprint"),
    created_by: readString(value.created_by, "relationship creator"),
    created_at: readString(value.created_at, "relationship creation date"),
    updated_at: readString(value.updated_at, "relationship update date")
  };
}

export function readRelationshipType(value: unknown): RelationshipType {
  switch (value) {
    case "participates_in":
    case "affiliated_with":
    case "located_at":
    case "temporally_associated_with":
    case "concerns":
    case "contributes_to":
    case "created":
    case "contextually_associated_with":
      return value;
    default:
      throw new Error("The relationship type is invalid.");
  }
}

export function readRelationshipStatus(value: unknown): RelationshipStatus {
  switch (value) {
    case "suggested":
    case "supported":
    case "confirmed":
    case "corrected":
    case "rejected":
    case "contradicted":
    case "outdated":
    case "archived":
      return value;
    default:
      throw new Error("The relationship status is invalid.");
  }
}

export function readRelationshipDisplayState(value: unknown): RelationshipDisplayState {
  switch (value) {
    case "suggested":
    case "supported":
    case "confirmed":
    case "needs_review":
    case "past":
    case "archived":
      return value;
    default:
      throw new Error("The relationship display state is invalid.");
  }
}

export function readRelationshipSensitivity(value: unknown): RelationshipSensitivity {
  if (value === "normal" || value === "sensitive" || value === "highly_sensitive") {
    return value;
  }
  throw new Error("The relationship sensitivity is invalid.");
}

export function readRelationshipDatePrecision(value: unknown): RelationshipDatePrecision {
  if (value === "unknown" || value === "approximate" || value === "exact") {
    return value;
  }
  throw new Error("The relationship date precision is invalid.");
}

function readRelationshipConfidence(value: unknown): RelationshipConfidence {
  if (value === "low" || value === "medium" || value === "high" || value === "confirmed") {
    return value;
  }
  throw new Error("The relationship confidence is invalid.");
}

function parseRelationshipReviewItem(value: unknown): RelationshipReviewItem {
  if (!isRecord(value)) {
    throw new Error("The relationship review item is invalid.");
  }
  return {
    relationship: parseRelationship(value.relationship),
    source_entity: parseRelationshipEntity(value.source_entity),
    target_entity: parseRelationshipEntity(value.target_entity),
    evidence_count: readNumber(value.evidence_count, "relationship evidence count"),
    latest_evidence_at: readNullableString(value.latest_evidence_at, "latest evidence date")
  };
}

function parseRelationshipEntity(value: unknown): RelationshipEntity {
  if (!isRecord(value)) {
    throw new Error("The relationship entity is invalid.");
  }
  return {
    id: readString(value.id, "relationship entity id"),
    name: readString(value.name, "relationship entity name"),
    type: readString(value.type, "relationship entity type")
  };
}

function parseRelationshipEvidence(value: unknown): RelationshipEvidence {
  if (!isRecord(value)) {
    throw new Error("The relationship evidence is invalid.");
  }
  return {
    id: readString(value.id, "evidence id"),
    relationship_id: readString(value.relationship_id, "evidence relationship"),
    evidence_kind: readEvidenceKind(value.evidence_kind),
    observation_id: readNullableString(value.observation_id, "evidence observation"),
    memory_id: readNullableString(value.memory_id, "evidence memory"),
    capture_id: readNullableString(value.capture_id, "evidence capture"),
    source_fingerprint: readString(value.source_fingerprint, "evidence fingerprint"),
    relation_to_claim: readEvidenceRelation(value.relation_to_claim),
    source_strength: readEvidenceStrength(value.source_strength),
    source_sensitivity: readRelationshipSensitivity(value.source_sensitivity),
    excerpt: readNullableString(value.excerpt, "evidence excerpt"),
    observed_at: readNullableString(value.observed_at, "evidence observation date"),
    created_at: readString(value.created_at, "evidence creation date")
  };
}

function parseRelationshipHistory(value: unknown): RelationshipHistoryEntry {
  if (!isRecord(value)) {
    throw new Error("The relationship history entry is invalid.");
  }
  return {
    id: readString(value.id, "history id"),
    relationship_id: readString(value.relationship_id, "history relationship"),
    action: readHistoryAction(value.action),
    before_state: readNullableJson(value.before_state),
    after_state: readNullableJson(value.after_state),
    actor_type: readHistoryActor(value.actor_type),
    actor_user_id: readNullableString(value.actor_user_id, "history actor"),
    reason: readNullableString(value.reason, "history reason"),
    evidence_ids: readStringArray(value.evidence_ids, "history evidence ids"),
    created_at: readString(value.created_at, "history creation date")
  };
}

function parseRelationshipActions(value: Record<string, unknown>): RelationshipActions {
  return {
    can_confirm: readBoolean(value.can_confirm, "confirm action"),
    can_reject: readBoolean(value.can_reject, "reject action"),
    can_correct: readBoolean(value.can_correct, "correct action"),
    can_mark_outdated: readBoolean(value.can_mark_outdated, "outdated action"),
    can_set_visibility: readBoolean(value.can_set_visibility, "visibility action"),
    can_archive: readBoolean(value.can_archive, "archive action"),
    can_restore: readBoolean(value.can_restore, "restore action")
  };
}

function readEvidenceKind(value: unknown): RelationshipEvidence["evidence_kind"] {
  switch (value) {
    case "capture":
    case "observation":
    case "memory":
    case "user_declaration":
    case "user_decision":
    case "deterministic":
      return value;
    default:
      throw new Error("The evidence kind is invalid.");
  }
}

function readEvidenceRelation(value: unknown): RelationshipEvidence["relation_to_claim"] {
  if (value === "supporting" || value === "contradicting" || value === "contextual") {
    return value;
  }
  throw new Error("The evidence relation is invalid.");
}

function readEvidenceStrength(value: unknown): RelationshipEvidence["source_strength"] {
  if (value === "weak" || value === "moderate" || value === "strong" || value === "explicit") {
    return value;
  }
  throw new Error("The evidence strength is invalid.");
}

function readHistoryAction(value: unknown): RelationshipHistoryEntry["action"] {
  switch (value) {
    case "created":
    case "evidence_added":
    case "promoted":
    case "confirmed":
    case "corrected":
    case "rejected":
    case "contradicted":
    case "contradiction_cleared":
    case "marked_outdated":
    case "visibility_changed":
    case "archived":
    case "restored":
    case "temporal_context_changed":
      return value;
    default:
      throw new Error("The history action is invalid.");
  }
}

function readHistoryActor(value: unknown): RelationshipHistoryEntry["actor_type"] {
  if (value === "user" || value === "ai" || value === "system" || value === "migration" || value === "service_role") {
    return value;
  }
  throw new Error("The history actor is invalid.");
}

function readNullableJson(value: unknown): Json | null {
  if (value === null) {
    return null;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(readJson);
  }
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, readJson(item)]));
  }
  throw new Error("The history state is invalid.");
}

function readJson(value: unknown): Json {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(readJson);
  }
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, readJson(item)]));
  }
  throw new Error("The history state is invalid.");
}

async function mutateRelationship<
  Name extends
    | "confirm_relationship"
    | "reject_relationship"
    | "correct_relationship"
    | "mark_relationship_outdated"
    | "set_relationship_visibility"
    | "archive_relationship"
    | "restore_relationship"
>(name: Name, parameters: DatabaseFunctionParameters<Name>) {
  const { data, error } = await supabase.rpc(name, parameters);
  if (error) {
    throwRelationshipError(error.message);
  }
  return parseRelationship(data);
}

type DatabaseFunctions = import("@/types/database").Database["public"]["Functions"];
type DatabaseFunctionParameters<Name extends keyof DatabaseFunctions> = DatabaseFunctions[Name]["Args"];

function throwRelationshipError(message: string): never {
  const stableCode = message.split(/[\s:]/)[0] ?? "INTERNAL_ERROR";
  throw new RelationshipServiceError(stableCode);
}

function getRelationshipErrorMessage(code: string) {
  switch (code) {
    case "AUTH_REQUIRED":
      return "Sign in to continue.";
    case "FORBIDDEN":
    case "ENTITY_OWNERSHIP_MISMATCH":
      return "You do not have permission to access this relationship.";
    case "NOT_FOUND":
      return "This relationship is no longer available.";
    case "RELATIONSHIP_ARCHIVED":
      return "Restore this relationship before changing it.";
    case "UNRESOLVED_CONTRADICTION":
      return "Review the unresolved contradiction before archiving this relationship.";
    case "DUPLICATE_RELATIONSHIP":
    case "RELATIONSHIP_CONFLICT":
      return "That correction conflicts with an existing relationship.";
    case "INVALID_INPUT":
    case "INVALID_DIRECTION":
    case "INVALID_RELATIONSHIP_TYPE":
    case "INVALID_TEMPORAL_RANGE":
      return "Check the relationship details and try again.";
    default:
      return "Unable to update this relationship right now.";
  }
}
