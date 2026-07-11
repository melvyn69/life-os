import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraphErrorState, GraphLoadingState } from "@/components/graph/GraphStates";
import { AuthRequiredState } from "@/components/common/AuthRequiredState";
import { GraphFilters } from "@/components/graph/GraphFilters";
import { GraphLegend } from "@/components/graph/GraphLegend";
import { GraphNodeCard } from "@/components/graph/GraphNodeCard";
import { GraphRelationshipList } from "@/components/graph/GraphRelationshipList";
import { GraphRenderer } from "@/components/graph/GraphRenderer";
import { RelationshipDetailSheet } from "@/components/relationships/RelationshipDetailSheet";
import { useFocusedGraph } from "@/hooks/useFocusedGraph";
import { isAuthRequiredError } from "@/lib/errors";
import type { FocusedGraphPage, GraphEdge, GraphFiltersValue, GraphNode } from "@/types/graph";

const defaultFilters: GraphFiltersValue = {
  includeSuggestions: true,
  includeHistorical: false,
  depth: 1
};

export function FocusedGraph({ entityId }: { entityId: string }) {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedNodeId, setSelectedNodeId] = useState<string>();
  const [selectedEdgeId, setSelectedEdgeId] = useState<string>();
  const query = useFocusedGraph(entityId, filters);
  const graph = useMemo(() => mergeGraphPages(query.data?.pages ?? []), [query.data?.pages]);
  const selectedNode = graph?.nodes.find((node) => node.id === selectedNodeId);

  if (query.isLoading) {
    return <GraphLoadingState />;
  }

  if (query.isError || !graph) {
    if (isAuthRequiredError(query.error)) {
      return <AuthRequiredState />;
    }
    return <GraphErrorState permissionDenied={!isAuthRequiredError(query.error) && isPermissionError(query.error)} />;
  }

  return (
    <div className="space-y-5">
      <GraphFilters onChange={setFilters} value={filters} />
      {query.isFetching && !query.isFetchingNextPage ? (
        <p aria-live="polite" className="text-xs text-muted-foreground">Refreshing graph…</p>
      ) : null}
      <GraphRenderer
        edges={graph.edges}
        focusNodeId={graph.focus_entity.id}
        nodes={graph.nodes}
        onEdgeSelect={setSelectedEdgeId}
        onExpandNode={(nodeId) => navigate(`/graph/${nodeId}`)}
        onNodeSelect={setSelectedNodeId}
        selectedEdgeId={selectedEdgeId}
        selectedNodeId={selectedNodeId}
      />
      {selectedNode ? <GraphNodeCard node={selectedNode} /> : null}
      <GraphLegend />
      <GraphRelationshipList
        edges={graph.edges}
        focusNodeId={graph.focus_entity.id}
        nodes={graph.nodes}
        onRelationshipSelect={setSelectedEdgeId}
      />
      {query.hasNextPage ? (
        <button
          className="min-h-11 w-full rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold disabled:opacity-60"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
          type="button"
        >
          {query.isFetchingNextPage ? "Loading…" : "Load more relationships"}
        </button>
      ) : null}
      {selectedEdgeId ? (
        <RelationshipDetailSheet
          onClose={() => setSelectedEdgeId(undefined)}
          relationshipId={selectedEdgeId}
        />
      ) : null}
    </div>
  );
}

function mergeGraphPages(pages: FocusedGraphPage[]): FocusedGraphPage | null {
  const firstPage = pages[0];
  const lastPage = pages.at(-1);
  if (!firstPage || !lastPage) {
    return null;
  }

  const nodesById = new Map<string, GraphNode>();
  const edgesById = new Map<string, GraphEdge>();
  for (const page of pages) {
    for (const node of page.nodes) {
      nodesById.set(node.id, node);
    }
    for (const edge of page.edges) {
      edgesById.set(edge.id, edge);
    }
  }

  return {
    ...firstPage,
    nodes: [...nodesById.values()],
    edges: [...edgesById.values()],
    page_info: lastPage.page_info,
    counts: lastPage.counts
  };
}

function isPermissionError(error: unknown) {
  return error instanceof Error && /forbidden|permission|not found/i.test(error.message);
}
