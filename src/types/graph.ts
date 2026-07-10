import type {
  RelationshipDatePrecision,
  RelationshipDisplayState,
  RelationshipSensitivity,
  RelationshipStatus,
  RelationshipType
} from "@/types/relationships";

export type GraphNode = {
  id: string;
  name: string;
  type: string;
  description: string | null;
  status: string;
  sensitivity: string;
  updated_at: string;
};

export type GraphEdge = {
  id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: RelationshipType;
  status: RelationshipStatus;
  display_state: RelationshipDisplayState;
  sensitivity: RelationshipSensitivity;
  is_directional: boolean;
  start_date: string | null;
  end_date: string | null;
  date_precision: RelationshipDatePrecision;
  explanation: string | null;
  updated_at: string;
};

export type FocusedGraphPage = {
  focus_entity: GraphNode;
  nodes: GraphNode[];
  edges: GraphEdge[];
  page_info: {
    next_cursor: string | null;
    has_more: boolean;
  };
  counts: {
    visible: number;
    suggested: number;
    contradicted: number;
    historical: number;
  };
};

export type GraphFiltersValue = {
  includeSuggestions: boolean;
  includeHistorical: boolean;
  depth: 1 | 2;
};

export type GraphRendererProps = {
  focusNodeId: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId?: string;
  selectedEdgeId?: string;
  onNodeSelect: (nodeId: string) => void;
  onEdgeSelect: (edgeId: string) => void;
  onExpandNode: (nodeId: string) => void;
};
