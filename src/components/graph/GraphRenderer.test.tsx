import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GraphRenderer } from "@/components/graph/GraphRenderer";
import type { GraphEdge, GraphNode } from "@/types/graph";

const nodes: GraphNode[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Sarah",
    type: "person",
    description: null,
    status: "active",
    sensitivity: "normal",
    updated_at: "2026-07-10T12:00:00Z"
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Life OS",
    type: "project",
    description: null,
    status: "active",
    sensitivity: "normal",
    updated_at: "2026-07-10T12:00:00Z"
  }
];

const edges: GraphEdge[] = [{
  id: "33333333-3333-4333-8333-333333333333",
  source_entity_id: nodes[0]?.id ?? "",
  target_entity_id: nodes[1]?.id ?? "",
  relationship_type: "contributes_to",
  status: "suggested",
  display_state: "suggested",
  sensitivity: "normal",
  is_directional: true,
  start_date: null,
  end_date: null,
  date_precision: "unknown",
  explanation: "A tentative relationship.",
  updated_at: "2026-07-10T12:00:00Z"
}];

describe("GraphRenderer", () => {
  it("renders nodes and exposes keyboard-operable relationships", () => {
    const onEdgeSelect = vi.fn();
    render(
      <GraphRenderer
        edges={edges}
        focusNodeId={nodes[0]?.id ?? ""}
        nodes={nodes}
        onEdgeSelect={onEdgeSelect}
        onExpandNode={vi.fn()}
        onNodeSelect={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: /Sarah, person, graph focus/ })).toBeInTheDocument();
    const edge = screen.getByRole("button", { name: /contributes to, suggested/ });
    fireEvent.keyDown(edge, { key: "Enter" });
    expect(onEdgeSelect).toHaveBeenCalledWith(edges[0]?.id);
  });

  it("provides a touch and keyboard alternative to expand a node", () => {
    const onExpandNode = vi.fn();
    render(
      <GraphRenderer
        edges={edges}
        focusNodeId={nodes[0]?.id ?? ""}
        nodes={nodes}
        onEdgeSelect={vi.fn()}
        onExpandNode={onExpandNode}
        onNodeSelect={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Explore from Life OS" }));
    expect(onExpandNode).toHaveBeenCalledWith(nodes[1]?.id);
  });
});
