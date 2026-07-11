import type { Database, Json } from "./database.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.110.1";

export type LifeOsSupabaseClient = SupabaseClient<Database>;

export type RelationshipType =
  | "participates_in"
  | "affiliated_with"
  | "located_at"
  | "temporally_associated_with"
  | "concerns"
  | "contributes_to"
  | "created"
  | "contextually_associated_with";

export type RelationshipSensitivity = "normal" | "sensitive" | "highly_sensitive";
export type RelationshipExplicitness = "implicit" | "explicit";
export type RelationshipEvidenceRelation = "supporting" | "contradicting" | "contextual";
export type DatePrecision = "unknown" | "approximate" | "exact";

export type AiRelationship = {
  source_entity_reference: string;
  target_entity_reference: string;
  relationship_type: RelationshipType;
  directional: boolean;
  explicitness: RelationshipExplicitness;
  evidence_relation: RelationshipEvidenceRelation;
  evidence_observation_ids: string[];
  temporal_context: {
    start_date: string | null;
    end_date: string | null;
    date_precision: DatePrecision;
  };
  sensitivity: RelationshipSensitivity;
  explanation: string;
  uncertainty: string | null;
};

export type RelationshipProcessingStats = {
  created: number;
  evidence_added: number;
  promoted: number;
  contradicted: number;
  skipped: number;
};

export type BriefingRelationshipUsage = "fact" | "possibility" | "excluded";

export function getBriefingRelationshipUsage({
  status,
  sensitivity,
  isVisible
}: {
  status: string;
  sensitivity: RelationshipSensitivity;
  isVisible: boolean;
}): BriefingRelationshipUsage {
  if (!isVisible) {
    return "excluded";
  }

  if (status === "confirmed") {
    return "fact";
  }

  if (status === "supported" && sensitivity === "normal") {
    return "fact";
  }

  if (status === "suggested" && sensitivity === "normal") {
    return "possibility";
  }

  return "excluded";
}

export const relationshipTypes: readonly RelationshipType[] = [
  "participates_in",
  "affiliated_with",
  "located_at",
  "temporally_associated_with",
  "concerns",
  "contributes_to",
  "created",
  "contextually_associated_with"
];

export const relationshipSensitivities: readonly RelationshipSensitivity[] = [
  "normal",
  "sensitive",
  "highly_sensitive"
];

export const relationshipSchema = {
  type: "array",
  maxItems: 8,
  items: {
    type: "object",
    additionalProperties: false,
    properties: {
      source_entity_reference: { type: "string" },
      target_entity_reference: { type: "string" },
      relationship_type: { type: "string", enum: relationshipTypes },
      directional: { type: "boolean" },
      explicitness: { type: "string", enum: ["implicit", "explicit"] },
      evidence_relation: {
        type: "string",
        enum: ["supporting", "contradicting", "contextual"]
      },
      evidence_observation_ids: {
        type: "array",
        minItems: 1,
        maxItems: 8,
        items: { type: "string" }
      },
      temporal_context: {
        type: "object",
        additionalProperties: false,
        properties: {
          start_date: { type: ["string", "null"] },
          end_date: { type: ["string", "null"] },
          date_precision: {
            type: "string",
            enum: ["unknown", "approximate", "exact"]
          }
        },
        required: ["start_date", "end_date", "date_precision"]
      },
      sensitivity: { type: "string", enum: relationshipSensitivities },
      explanation: { type: "string" },
      uncertainty: { type: ["string", "null"] }
    },
    required: [
      "source_entity_reference",
      "target_entity_reference",
      "relationship_type",
      "directional",
      "explicitness",
      "evidence_relation",
      "evidence_observation_ids",
      "temporal_context",
      "sensitivity",
      "explanation",
      "uncertainty"
    ]
  }
};

export function validateAiRelationships(
  value: unknown,
  observationIds: ReadonlySet<string>
): AiRelationship[] {
  if (!Array.isArray(value) || value.length > 8) {
    throw new Error("AI relationships must be an array with at most eight items.");
  }

  return value.map((relationship) => validateAiRelationship(relationship, observationIds));
}

export async function persistRelationshipSuggestions({
  relationships,
  serviceClient,
  userId,
  entityIdsByName
}: {
  relationships: AiRelationship[];
  serviceClient: LifeOsSupabaseClient;
  userId: string;
  entityIdsByName: ReadonlyMap<string, string>;
}): Promise<RelationshipProcessingStats> {
  const stats: RelationshipProcessingStats = {
    created: 0,
    evidence_added: 0,
    promoted: 0,
    contradicted: 0,
    skipped: 0
  };

  for (const relationship of relationships) {
    const sourceEntityId = entityIdsByName.get(normalizeEntityReference(
      relationship.source_entity_reference
    ));
    const targetEntityId = entityIdsByName.get(normalizeEntityReference(
      relationship.target_entity_reference
    ));

    if (!sourceEntityId || !targetEntityId || sourceEntityId === targetEntityId) {
      stats.skipped += 1;
      continue;
    }

    const { data, error } = await serviceClient.rpc("ingest_relationship_candidate", {
      p_date_precision: relationship.temporal_context.date_precision,
      p_end_date: relationship.temporal_context.end_date ?? undefined,
      p_explanation: relationship.explanation,
      p_explicitness: relationship.explicitness,
      p_observation_ids: relationship.evidence_observation_ids,
      p_relation_to_claim: relationship.evidence_relation,
      p_relationship_type: relationship.relationship_type,
      p_sensitivity: relationship.sensitivity,
      p_source_entity_id: sourceEntityId,
      p_start_date: relationship.temporal_context.start_date ?? undefined,
      p_target_entity_id: targetEntityId,
      p_user_id: userId
    });

    if (error) {
      throw error;
    }

    const result = readIngestResult(data);
    stats.created += result.created;
    stats.evidence_added += result.evidence_added;
    stats.promoted += result.promoted;
    stats.contradicted += result.contradicted;
    stats.skipped += result.skipped;
  }

  return stats;
}

export function normalizeEntityReference(value: string) {
  return value.trim().toLowerCase();
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readOpenAiJsonContent(value: unknown): string {
  if (!isRecord(value) || !Array.isArray(value.choices) || value.choices.length === 0) {
    throw new Error("OpenAI returned no completion choice.");
  }

  const firstChoice = value.choices[0];
  if (!isRecord(firstChoice) || !isRecord(firstChoice.message)) {
    throw new Error("OpenAI returned an invalid completion message.");
  }

  if (typeof firstChoice.message.content !== "string") {
    throw new Error("OpenAI returned no JSON content.");
  }

  return firstChoice.message.content;
}

function validateAiRelationship(
  value: unknown,
  observationIds: ReadonlySet<string>
): AiRelationship {
  if (!isRecord(value)) {
    throw new Error("AI relationship must be an object.");
  }

  const sourceEntityReference = readBoundedString(
    value.source_entity_reference,
    "source_entity_reference",
    120
  );
  const targetEntityReference = readBoundedString(
    value.target_entity_reference,
    "target_entity_reference",
    120
  );
  const relationshipType = readRelationshipType(value.relationship_type);
  const directional = readBoolean(value.directional, "directional");
  const explicitness = readExplicitness(value.explicitness);
  const evidenceRelation = readEvidenceRelation(value.evidence_relation);
  const evidenceObservationIds = readObservationIds(
    value.evidence_observation_ids,
    observationIds
  );
  const temporalContext = readTemporalContext(value.temporal_context);
  const sensitivity = readRelationshipSensitivity(value.sensitivity);
  const explanation = readBoundedString(value.explanation, "explanation", 500);
  const uncertainty = readNullableBoundedString(value.uncertainty, "uncertainty", 500);

  if (relationshipType === "contextually_associated_with" && directional) {
    throw new Error("A contextual association must be non-directional.");
  }

  if (relationshipType !== "contextually_associated_with" && !directional) {
    throw new Error("A semantic relationship must be directional.");
  }

  if (
    evidenceRelation === "contextual" &&
    relationshipType !== "contextually_associated_with"
  ) {
    throw new Error("Context-only evidence cannot support a semantic relationship type.");
  }

  if (
    temporalContext.start_date !== null &&
    temporalContext.end_date !== null &&
    temporalContext.end_date < temporalContext.start_date
  ) {
    throw new Error("AI relationship temporal range is invalid.");
  }

  return {
    source_entity_reference: sourceEntityReference,
    target_entity_reference: targetEntityReference,
    relationship_type: relationshipType,
    directional,
    explicitness,
    evidence_relation: evidenceRelation,
    evidence_observation_ids: evidenceObservationIds,
    temporal_context: temporalContext,
    sensitivity,
    explanation,
    uncertainty
  };
}

function readRelationshipType(value: unknown): RelationshipType {
  if (typeof value !== "string") {
    throw new Error("AI relationship type must be a string.");
  }

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
      throw new Error("AI relationship type is invalid.");
  }
}

function readRelationshipSensitivity(value: unknown): RelationshipSensitivity {
  if (value === "normal" || value === "sensitive" || value === "highly_sensitive") {
    return value;
  }

  throw new Error("AI relationship sensitivity is invalid.");
}

function readExplicitness(value: unknown): RelationshipExplicitness {
  if (value === "implicit" || value === "explicit") {
    return value;
  }

  throw new Error("AI relationship explicitness is invalid.");
}

function readEvidenceRelation(value: unknown): RelationshipEvidenceRelation {
  if (value === "supporting" || value === "contradicting" || value === "contextual") {
    return value;
  }

  throw new Error("AI evidence relation is invalid.");
}

function readTemporalContext(value: unknown): AiRelationship["temporal_context"] {
  if (!isRecord(value)) {
    throw new Error("AI temporal context must be an object.");
  }

  const startDate = readNullableDate(value.start_date, "start_date");
  const endDate = readNullableDate(value.end_date, "end_date");
  const datePrecision = readDatePrecision(value.date_precision);

  return {
    start_date: startDate,
    end_date: endDate,
    date_precision: datePrecision
  };
}

function readDatePrecision(value: unknown): DatePrecision {
  if (value === "unknown" || value === "approximate" || value === "exact") {
    return value;
  }

  throw new Error("AI date precision is invalid.");
}

function readObservationIds(value: unknown, observationIds: ReadonlySet<string>): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 8) {
    throw new Error("AI relationship evidence must contain between one and eight observations.");
  }

  const ids = value.map((item) => readBoundedString(item, "evidence_observation_id", 64));

  if (new Set(ids).size !== ids.length || ids.some((id) => !observationIds.has(id))) {
    throw new Error("AI relationship evidence contains an invalid observation ID.");
  }

  return ids;
}

function readBoolean(value: unknown, field: string) {
  if (typeof value !== "boolean") {
    throw new Error(`AI field ${field} must be a boolean.`);
  }

  return value;
}

function readNullableDate(value: unknown, field: string): string | null {
  if (value === null) {
    return null;
  }

  const date = readBoundedString(value, field, 10);
  if (!isRealIsoDate(date)) {
    throw new Error(`AI field ${field} must be an ISO date.`);
  }

  return date;
}

function isRealIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || month < 1 || month > 12 || day < 1) {
    return false;
  }

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = [31, isLeapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= (daysInMonth[month - 1] ?? 0);
}

function readNullableBoundedString(
  value: unknown,
  field: string,
  maximumLength: number
): string | null {
  if (value === null) {
    return null;
  }

  return readBoundedString(value, field, maximumLength);
}

function readBoundedString(value: unknown, field: string, maximumLength: number) {
  if (typeof value !== "string") {
    throw new Error(`AI field ${field} must be a string.`);
  }

  const text = value.trim();
  if (!text || text.length > maximumLength) {
    throw new Error(`AI field ${field} is empty or too long.`);
  }

  return text;
}

function readIngestResult(value: Json): RelationshipProcessingStats {
  if (!isRecord(value)) {
    throw new Error("Relationship ingestion returned an invalid result.");
  }

  return {
    created: readNonNegativeInteger(value.created, "created"),
    evidence_added: readNonNegativeInteger(value.evidence_added, "evidence_added"),
    promoted: readNonNegativeInteger(value.promoted, "promoted"),
    contradicted: readNonNegativeInteger(value.contradicted, "contradicted"),
    skipped: readNonNegativeInteger(value.skipped, "skipped")
  };
}

function readNonNegativeInteger(value: unknown, field: string) {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`Relationship ingestion field ${field} is invalid.`);
  }

  return value;
}
