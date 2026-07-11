import { supabase } from "@/lib/supabase";
import {
  isRecord,
  readBoolean,
  readNullableString,
  readNumber,
  readString
} from "@/lib/runtime";
import { getCurrentUserId } from "@/services/captures";
import type { FocusedGraphPage, GraphEdge, GraphNode } from "@/types/graph";
import {
  readRelationshipDatePrecision,
  readRelationshipDisplayState,
  readRelationshipSensitivity,
  readRelationshipStatus,
  readRelationshipType
} from "@/services/relationships";

const graphFocusStorageKey = "life-os:last-graph-focus";

export type FocusedGraphRequest = {
  entityId: string;
  depth: 1 | 2;
  cursor: string | null;
  limit?: number;
  includeSuggestions: boolean;
  includeHistorical: boolean;
};

export async function getFocusedGraph({
  entityId,
  depth,
  cursor,
  limit = 12,
  includeSuggestions,
  includeHistorical
}: FocusedGraphRequest) {
  const { data, error } = await supabase.rpc("get_focused_graph", {
    p_focus_entity_id: entityId,
    p_depth: depth,
    p_cursor: cursor ?? undefined,
    p_limit: limit,
    p_include_suggestions: includeSuggestions,
    p_include_historical: includeHistorical
  });

  if (error) {
    throw error;
  }

  const graph = parseFocusedGraph(data);
  storeGraphFocusId(graph.focus_entity.id);
  return graph;
}

export async function resolveInitialGraphFocus() {
  const userId = await getCurrentUserId();
  const storedFocusId = readStoredGraphFocusId();

  if (storedFocusId) {
    const { data: storedEntity, error: storedError } = await supabase
      .from("entities")
      .select("id")
      .eq("id", storedFocusId)
      .eq("user_id", userId)
      .not("status", "in", "(hidden,archived,deleted)")
      .maybeSingle();

    if (storedError) {
      throw storedError;
    }

    if (storedEntity) {
      return storedEntity.id;
    }
  }

  const { data, error } = await supabase
    .from("entities")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["confirmed", "active", "suggested"])
    .order("updated_at", { ascending: false })
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.id ?? null;
}

export async function searchGraphEntities(search: string) {
  const userId = await getCurrentUserId();
  const term = search.trim();
  let query = supabase
    .from("entities")
    .select("id, name, type")
    .eq("user_id", userId)
    .not("status", "in", "(hidden,archived,deleted)")
    .order("updated_at", { ascending: false })
    .limit(20);

  if (term) {
    query = query.ilike("name", `%${escapeSearchPattern(term)}%`);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return data;
}

export function parseFocusedGraph(value: unknown): FocusedGraphPage {
  if (!isRecord(value) || !Array.isArray(value.nodes) || !Array.isArray(value.edges)) {
    throw new Error("The focused graph response is invalid.");
  }

  if (!isRecord(value.page_info) || !isRecord(value.counts)) {
    throw new Error("The focused graph response is invalid.");
  }

  const nextCursor = readNullableString(value.page_info.next_cursor, "graph next cursor");
  const hasMore = readBoolean(value.page_info.has_more, "graph has more");
  if (hasMore && nextCursor === null) {
    throw new Error("The focused graph pagination response is invalid.");
  }

  return {
    focus_entity: parseGraphNode(value.focus_entity),
    nodes: value.nodes.map(parseGraphNode),
    edges: value.edges.map(parseGraphEdge),
    page_info: {
      next_cursor: nextCursor,
      has_more: hasMore
    },
    counts: {
      visible: readNumber(value.counts.visible, "visible graph count"),
      suggested: readNumber(value.counts.suggested, "suggested graph count"),
      contradicted: readNumber(value.counts.contradicted, "contradicted graph count"),
      historical: readNumber(value.counts.historical, "historical graph count")
    }
  };
}

function parseGraphNode(value: unknown): GraphNode {
  if (!isRecord(value)) {
    throw new Error("The graph node is invalid.");
  }

  return {
    id: readString(value.id, "graph node id"),
    name: readString(value.name, "graph node name"),
    type: readString(value.type, "graph node type"),
    description: readNullableString(value.description, "graph node description"),
    status: readString(value.status, "graph node status"),
    sensitivity: readString(value.sensitivity, "graph node sensitivity"),
    updated_at: readString(value.updated_at, "graph node update time")
  };
}

function parseGraphEdge(value: unknown): GraphEdge {
  if (!isRecord(value)) {
    throw new Error("The graph edge is invalid.");
  }

  return {
    id: readString(value.id, "graph edge id"),
    source_entity_id: readString(value.source_entity_id, "graph edge source"),
    target_entity_id: readString(value.target_entity_id, "graph edge target"),
    relationship_type: readRelationshipType(value.relationship_type),
    status: readRelationshipStatus(value.status),
    display_state: readRelationshipDisplayState(value.display_state),
    sensitivity: readRelationshipSensitivity(value.sensitivity),
    is_directional: readBoolean(value.is_directional, "graph edge direction"),
    start_date: readNullableString(value.start_date, "graph edge start date"),
    end_date: readNullableString(value.end_date, "graph edge end date"),
    date_precision: readRelationshipDatePrecision(value.date_precision),
    explanation: readNullableString(value.explanation, "graph edge explanation"),
    updated_at: readString(value.updated_at, "graph edge update time")
  };
}

function storeGraphFocusId(entityId: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(graphFocusStorageKey, entityId);
  }
}

function readStoredGraphFocusId() {
  if (typeof window === "undefined") {
    return null;
  }
  const value = window.localStorage.getItem(graphFocusStorageKey);
  return value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function escapeSearchPattern(value: string) {
  return value.replace(/[%,_]/g, (character) => `\\${character}`);
}
