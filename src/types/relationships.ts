import type { Database, Json } from "@/types/database";

export type RelationshipType =
  | "participates_in"
  | "affiliated_with"
  | "located_at"
  | "temporally_associated_with"
  | "concerns"
  | "contributes_to"
  | "created"
  | "contextually_associated_with";

export type RelationshipStatus =
  | "suggested"
  | "supported"
  | "confirmed"
  | "corrected"
  | "rejected"
  | "contradicted"
  | "outdated"
  | "archived";

export type RelationshipDisplayState =
  | "suggested"
  | "supported"
  | "confirmed"
  | "needs_review"
  | "past"
  | "archived";

export type RelationshipSensitivity = "normal" | "sensitive" | "highly_sensitive";
export type RelationshipConfidence = "low" | "medium" | "high" | "confirmed";
export type RelationshipDatePrecision = "unknown" | "approximate" | "exact";
export type RelationshipReviewFilter =
  | "suggestions"
  | "contradictions"
  | "sensitive"
  | "rejected_with_new_evidence";

export type Relationship = Omit<
  Database["public"]["Tables"]["relationships"]["Row"],
  | "relationship_type"
  | "status"
  | "confidence"
  | "sensitivity"
  | "date_precision"
  | "user_id"
> & {
  relationship_type: RelationshipType;
  status: RelationshipStatus;
  confidence: RelationshipConfidence;
  sensitivity: RelationshipSensitivity;
  date_precision: RelationshipDatePrecision;
};

export type RelationshipEntity = {
  id: string;
  name: string;
  type: string;
};

export type RelationshipEvidence = {
  id: string;
  relationship_id: string;
  evidence_kind:
    | "capture"
    | "observation"
    | "memory"
    | "user_declaration"
    | "user_decision"
    | "deterministic";
  observation_id: string | null;
  memory_id: string | null;
  capture_id: string | null;
  source_fingerprint: string;
  relation_to_claim: "supporting" | "contradicting" | "contextual";
  source_strength: "weak" | "moderate" | "strong" | "explicit";
  source_sensitivity: RelationshipSensitivity;
  excerpt: string | null;
  observed_at: string | null;
  created_at: string;
};

export type RelationshipHistoryEntry = {
  id: string;
  relationship_id: string;
  action:
    | "created"
    | "evidence_added"
    | "promoted"
    | "confirmed"
    | "corrected"
    | "rejected"
    | "contradicted"
    | "contradiction_cleared"
    | "marked_outdated"
    | "visibility_changed"
    | "archived"
    | "restored"
    | "temporal_context_changed";
  before_state: Json | null;
  after_state: Json | null;
  actor_type: "user" | "ai" | "system" | "migration" | "service_role";
  actor_user_id: string | null;
  reason: string | null;
  evidence_ids: string[];
  created_at: string;
};

export type RelationshipActions = {
  can_confirm: boolean;
  can_reject: boolean;
  can_correct: boolean;
  can_mark_outdated: boolean;
  can_set_visibility: boolean;
  can_archive: boolean;
  can_restore: boolean;
};

export type RelationshipDetail = {
  relationship: Relationship;
  source_entity: RelationshipEntity;
  target_entity: RelationshipEntity;
  evidence_summary: {
    supporting: number;
    contradicting: number;
    contextual: number;
    independent_sources: number;
  };
  evidence: RelationshipEvidence[];
  history: RelationshipHistoryEntry[];
  contradictions: Array<{
    id: string;
    excerpt: string | null;
    observed_at: string | null;
    source_strength: RelationshipEvidence["source_strength"];
  }>;
  actions: RelationshipActions;
  page_info: {
    evidence_next_cursor: string | null;
    evidence_has_more: boolean;
    history_next_cursor: string | null;
    history_has_more: boolean;
  };
};

export type RelationshipReviewItem = {
  relationship: Relationship;
  source_entity: RelationshipEntity;
  target_entity: RelationshipEntity;
  evidence_count: number;
  latest_evidence_at: string | null;
};

export type EntityRelationshipItem = {
  relationship: Relationship;
  source_entity: RelationshipEntity;
  target_entity: RelationshipEntity;
};

export type RelationshipReviewPage = {
  items: RelationshipReviewItem[];
  page_info: {
    next_cursor: string | null;
    has_more: boolean;
  };
};

export type RelationshipCorrection = {
  relationshipId: string;
  relationshipType: RelationshipType;
  sourceEntityId: string;
  targetEntityId: string;
  startDate: string | null;
  endDate: string | null;
  datePrecision: RelationshipDatePrecision;
  reason: string | null;
};

export function getRelationshipDisplayState(
  status: RelationshipStatus
): RelationshipDisplayState {
  switch (status) {
    case "suggested":
      return "suggested";
    case "supported":
      return "supported";
    case "confirmed":
    case "corrected":
      return "confirmed";
    case "contradicted":
    case "rejected":
      return "needs_review";
    case "outdated":
      return "past";
    case "archived":
      return "archived";
  }
}

export function getRelationshipDisplayLabel(state: RelationshipDisplayState) {
  switch (state) {
    case "suggested":
      return "Suggested";
    case "supported":
      return "Supported";
    case "confirmed":
      return "Confirmed";
    case "needs_review":
      return "Needs review";
    case "past":
      return "Past";
    case "archived":
      return "Archived";
  }
}

export function getRelationshipTypeLabel(type: RelationshipType) {
  switch (type) {
    case "participates_in":
      return "Participates in";
    case "affiliated_with":
      return "Affiliated with";
    case "located_at":
      return "Located at";
    case "temporally_associated_with":
      return "Temporally associated with";
    case "concerns":
      return "Concerns";
    case "contributes_to":
      return "Contributes to";
    case "created":
      return "Created";
    case "contextually_associated_with":
      return "Contextually associated with";
  }
}
