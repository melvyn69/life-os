import { getRelationshipTypeLabel } from "@/types/relationships";
import type { GraphEdge } from "@/types/graph";

export function GraphRelationshipLabel({ edge }: { edge: GraphEdge }) {
  return (
    <span>
      {getRelationshipTypeLabel(edge.relationship_type)}
      {edge.display_state === "suggested" ? " (suggested)" : ""}
    </span>
  );
}
