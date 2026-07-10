import { GraphRelationshipLabel } from "@/components/graph/GraphRelationshipLabel";
import { ExploreFromEntityButton } from "@/components/relationships/ExploreFromEntityButton";
import { RelationshipStatusBadge } from "@/components/relationships/RelationshipStatusBadge";
import type { GraphEdge, GraphNode } from "@/types/graph";

export function GraphRelationshipList({
  edges,
  nodes,
  focusNodeId,
  onRelationshipSelect
}: {
  edges: GraphEdge[];
  nodes: GraphNode[];
  focusNodeId: string;
  onRelationshipSelect: (relationshipId: string) => void;
}) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  return (
    <section aria-labelledby="graph-relationships-heading" className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground" id="graph-relationships-heading">
        Relationships
      </h3>
      {edges.length === 0 ? (
        <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          No visible relationships match these filters.
        </p>
      ) : (
        <ul className="space-y-3">
          {edges.map((edge) => {
            const source = nodesById.get(edge.source_entity_id);
            const target = nodesById.get(edge.target_entity_id);
            const otherEntity = edge.source_entity_id === focusNodeId ? target : source;
            return (
              <li className="rounded-lg border border-border bg-card p-4 shadow-sm" key={edge.id}>
                <button
                  className="min-h-11 w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => onRelationshipSelect(edge.id)}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold">
                      {source?.name ?? "Unavailable"} {edge.is_directional ? "→" : "↔"} {target?.name ?? "Unavailable"}
                    </span>
                    <RelationshipStatusBadge status={edge.display_state} />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground"><GraphRelationshipLabel edge={edge} /></p>
                  {edge.explanation ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{edge.explanation}</p> : null}
                </button>
                {otherEntity ? (
                  <div className="mt-3 border-t border-border pt-3">
                    <ExploreFromEntityButton entityId={otherEntity.id} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
