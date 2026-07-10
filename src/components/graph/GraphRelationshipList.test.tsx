import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { GraphRelationshipList } from "@/components/graph/GraphRelationshipList";
import type { GraphEdge, GraphNode } from "@/types/graph";

const nodes: GraphNode[] = [
  { id: "a", name: "Sarah", type: "person", description: null, status: "active", sensitivity: "normal", updated_at: "2026-07-10" },
  { id: "b", name: "Life OS", type: "project", description: null, status: "active", sensitivity: "normal", updated_at: "2026-07-10" }
];

const edge: GraphEdge = {
  id: "edge",
  source_entity_id: "a",
  target_entity_id: "b",
  relationship_type: "contextually_associated_with",
  status: "suggested",
  display_state: "suggested",
  sensitivity: "normal",
  is_directional: false,
  start_date: null,
  end_date: null,
  date_precision: "unknown",
  explanation: "Repeated context without a proven role.",
  updated_at: "2026-07-10"
};

describe("GraphRelationshipList", () => {
  it("clearly distinguishes a suggestion and remains the accessible fallback", () => {
    render(
      <MemoryRouter>
        <GraphRelationshipList edges={[edge]} focusNodeId="a" nodes={nodes} onRelationshipSelect={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getAllByText("Suggested")).toHaveLength(1);
    expect(screen.getByText(/Contextually associated with \(suggested\)/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Explore from this entity/ })).toHaveAttribute("href", "/graph/b");
  });

  it("renders a useful empty state", () => {
    render(
      <MemoryRouter>
        <GraphRelationshipList edges={[]} focusNodeId="a" nodes={nodes} onRelationshipSelect={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.getByText(/No visible relationships/)).toBeInTheDocument();
  });
});
