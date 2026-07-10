import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getFocusedGraph,
  resolveInitialGraphFocus,
  searchGraphEntities
} from "@/services/graph";
import type { GraphFiltersValue } from "@/types/graph";

const initialGraphCursor: string | null = null;

export function useFocusedGraph(entityId: string, filters: GraphFiltersValue) {
  return useInfiniteQuery({
    queryKey: ["graph", "focused", entityId, filters],
    queryFn: ({ pageParam }) => getFocusedGraph({
      entityId,
      cursor: pageParam,
      depth: filters.depth,
      includeHistorical: filters.includeHistorical,
      includeSuggestions: filters.includeSuggestions
    }),
    initialPageParam: initialGraphCursor,
    getNextPageParam: (lastPage) => lastPage.page_info.has_more
      ? lastPage.page_info.next_cursor
      : undefined,
    enabled: Boolean(entityId),
    staleTime: 15_000
  });
}

export function useInitialGraphFocus() {
  return useQuery({
    queryKey: ["graph", "initial-focus"],
    queryFn: resolveInitialGraphFocus,
    staleTime: 30_000
  });
}

export function useGraphEntitySearch(search: string, enabled = true) {
  return useQuery({
    queryKey: ["graph", "entity-search", search],
    queryFn: () => searchGraphEntities(search),
    enabled,
    staleTime: 30_000
  });
}
