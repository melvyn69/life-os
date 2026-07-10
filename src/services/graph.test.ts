import { describe, expect, it } from "vitest";
import { parseFocusedGraph } from "@/services/graph";

const focusNode = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Sarah",
  type: "person",
  description: null,
  status: "active",
  sensitivity: "normal",
  updated_at: "2026-07-10T12:00:00Z"
};

const targetNode = {
  ...focusNode,
  id: "22222222-2222-4222-8222-222222222222",
  name: "Life OS",
  type: "project"
};

function buildGraphResponse() {
  return {
    focus_entity: focusNode,
    nodes: [focusNode, targetNode],
    edges: [{
      id: "33333333-3333-4333-8333-333333333333",
      source_entity_id: focusNode.id,
      target_entity_id: targetNode.id,
      relationship_type: "contributes_to",
      status: "supported",
      display_state: "supported",
      sensitivity: "normal",
      is_directional: true,
      start_date: null,
      end_date: null,
      date_precision: "unknown",
      explanation: "Supported by independent captures.",
      updated_at: "2026-07-10T12:00:00Z"
    }],
    page_info: { next_cursor: null, has_more: false },
    counts: { visible: 1, suggested: 0, contradicted: 0, historical: 0 }
  };
}

describe("focused graph response conversion", () => {
  it("converts a valid server response into frontend types", () => {
    const graph = parseFocusedGraph(buildGraphResponse());
    expect(graph.focus_entity.name).toBe("Sarah");
    expect(graph.edges[0]?.relationship_type).toBe("contributes_to");
    expect(graph.counts.visible).toBe(1);
  });

  it("rejects an unknown relationship status", () => {
    const response = buildGraphResponse();
    response.edges[0] = { ...response.edges[0], status: "active" };
    expect(() => parseFocusedGraph(response)).toThrow(/status is invalid/);
  });
});
