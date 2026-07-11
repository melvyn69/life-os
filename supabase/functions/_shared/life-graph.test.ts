import { describe, expect, it } from "vitest";
import { getBriefingRelationshipUsage, validateAiRelationships } from "./life-graph";

const observationId = "11111111-1111-4111-8111-111111111111";

function buildRelationship(overrides: Record<string, unknown> = {}) {
  return {
    source_entity_reference: "Sarah",
    target_entity_reference: "Life OS",
    relationship_type: "contributes_to",
    directional: true,
    explicitness: "explicit",
    evidence_relation: "supporting",
    evidence_observation_ids: [observationId],
    temporal_context: {
      start_date: null,
      end_date: null,
      date_precision: "unknown"
    },
    sensitivity: "normal",
    explanation: "Sarah explicitly helps build Life OS.",
    uncertainty: null,
    ...overrides
  };
}

describe("Life Graph AI relationship validation", () => {
  it("accepts every canonical relationship type", () => {
    const types = [
      "participates_in",
      "affiliated_with",
      "located_at",
      "temporally_associated_with",
      "concerns",
      "contributes_to",
      "created"
    ];

    for (const relationshipType of types) {
      const result = validateAiRelationships(
        [buildRelationship({ relationship_type: relationshipType })],
        new Set([observationId])
      );
      expect(result[0]?.relationship_type).toBe(relationshipType);
    }
  });

  it("requires non-directional contextual associations", () => {
    expect(() => validateAiRelationships([
      buildRelationship({
        relationship_type: "contextually_associated_with",
        directional: true
      })
    ], new Set([observationId]))).toThrow(/non-directional/);

    expect(validateAiRelationships([
      buildRelationship({
        relationship_type: "contextually_associated_with",
        directional: false,
        explicitness: "implicit"
      })
    ], new Set([observationId]))[0]?.directional).toBe(false);
  });

  it("rejects non-canonical types and invalid semantic direction", () => {
    expect(() => validateAiRelationships([
      buildRelationship({ relationship_type: "cofounder" })
    ], new Set([observationId]))).toThrow(/type is invalid/);

    expect(() => validateAiRelationships([
      buildRelationship({ directional: false })
    ], new Set([observationId]))).toThrow(/must be directional/);
  });

  it("prevents co-occurrence or unproven causality from becoming a semantic claim", () => {
    expect(() => validateAiRelationships([
      buildRelationship({
        relationship_type: "contributes_to",
        explicitness: "implicit",
        evidence_relation: "contextual"
      })
    ], new Set([observationId]))).toThrow(/Context-only evidence/);

    const contextual = validateAiRelationships([
      buildRelationship({
        relationship_type: "contextually_associated_with",
        directional: false,
        explicitness: "implicit",
        evidence_relation: "contextual"
      })
    ], new Set([observationId]));
    expect(contextual[0]?.relationship_type).toBe("contextually_associated_with");
  });

  it("rejects invalid temporal ranges and unknown evidence", () => {
    expect(() => validateAiRelationships([
      buildRelationship({
        temporal_context: {
          start_date: "2026-07-10",
          end_date: "2026-07-09",
          date_precision: "exact"
        }
      })
    ], new Set([observationId]))).toThrow(/temporal range/);

    expect(() => validateAiRelationships([
      buildRelationship({ evidence_observation_ids: [crypto.randomUUID()] })
    ], new Set([observationId]))).toThrow(/invalid observation ID/);

    expect(() => validateAiRelationships([
      buildRelationship({
        temporal_context: {
          start_date: "2026-02-30",
          end_date: null,
          date_precision: "exact"
        }
      })
    ], new Set([observationId]))).toThrow(/ISO date/);
  });

  it("accepts the maximum canonical sensitivity without changing it", () => {
    const result = validateAiRelationships([
      buildRelationship({ sensitivity: "highly_sensitive" })
    ], new Set([observationId]));

    expect(result[0]?.sensitivity).toBe("highly_sensitive");
  });
});

describe("Briefing relationship selection", () => {
  it("uses only canonically authorized facts and possibilities", () => {
    expect(getBriefingRelationshipUsage({ status: "confirmed", sensitivity: "sensitive", isVisible: true })).toBe("fact");
    expect(getBriefingRelationshipUsage({ status: "supported", sensitivity: "normal", isVisible: true })).toBe("fact");
    expect(getBriefingRelationshipUsage({ status: "suggested", sensitivity: "normal", isVisible: true })).toBe("possibility");
    expect(getBriefingRelationshipUsage({ status: "suggested", sensitivity: "sensitive", isVisible: true })).toBe("excluded");
    expect(getBriefingRelationshipUsage({ status: "contradicted", sensitivity: "normal", isVisible: true })).toBe("excluded");
    expect(getBriefingRelationshipUsage({ status: "confirmed", sensitivity: "normal", isVisible: false })).toBe("excluded");
  });
});
