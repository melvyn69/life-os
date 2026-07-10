import { ExploreFromEntityButton } from "@/components/relationships/ExploreFromEntityButton";
import type { GraphNode } from "@/types/graph";

export function GraphNodeCard({ node }: { node: GraphNode }) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold">{node.name}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{node.type}</p>
        </div>
        <ExploreFromEntityButton entityId={node.id} />
      </div>
      {node.description ? (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{node.description}</p>
      ) : null}
    </article>
  );
}
