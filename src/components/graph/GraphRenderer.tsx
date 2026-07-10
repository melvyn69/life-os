import type { KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { GraphRendererProps } from "@/types/graph";

type Position = { x: number; y: number };

const center: Position = { x: 210, y: 190 };

export function GraphRenderer({
  focusNodeId,
  nodes,
  edges,
  selectedNodeId,
  selectedEdgeId,
  onNodeSelect,
  onEdgeSelect,
  onExpandNode
}: GraphRendererProps) {
  const visibleNodes = nodes.slice(0, 9);
  const positions = buildPositions(visibleNodes.map((node) => node.id), focusNodeId);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <svg
        aria-label="Focused relationship graph. A structured list follows this visualization."
        className="h-auto min-h-80 w-full"
        role="img"
        viewBox="0 0 420 380"
      >
        <defs>
          <marker id="graph-arrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
            <path d="M0,0 L8,4 L0,8 Z" className="fill-muted-foreground" />
          </marker>
        </defs>
        {edges.map((edge) => {
          const source = positions.get(edge.source_entity_id);
          const target = positions.get(edge.target_entity_id);
          if (!source || !target) {
            return null;
          }
          const selected = selectedEdgeId === edge.id;
          return (
            <g
              aria-label={`${edge.relationship_type.replaceAll("_", " ")}, ${edge.display_state.replaceAll("_", " ")}`}
              key={edge.id}
              onClick={() => onEdgeSelect(edge.id)}
              onKeyDown={(event) => activateWithKeyboard(event, () => onEdgeSelect(edge.id))}
              role="button"
              tabIndex={0}
            >
              <rect
                aria-hidden="true"
                className="fill-transparent"
                height="44"
                width="44"
                x={(source.x + target.x) / 2 - 22}
                y={(source.y + target.y) / 2 - 22}
              />
              <line
                className={cn(
                  "cursor-pointer stroke-muted-foreground/60 transition",
                  edge.display_state === "suggested" && "stroke-dasharray-[6_6]",
                  selected && "stroke-primary"
                )}
                markerEnd={edge.is_directional ? "url(#graph-arrow)" : undefined}
                strokeWidth={selected ? 4 : 2}
                x1={source.x}
                x2={target.x}
                y1={source.y}
                y2={target.y}
              />
              <line
                aria-hidden="true"
                className="cursor-pointer stroke-transparent"
                strokeWidth="20"
                x1={source.x}
                x2={target.x}
                y1={source.y}
                y2={target.y}
              />
            </g>
          );
        })}
        {visibleNodes.map((node) => {
          const position = positions.get(node.id);
          if (!position) {
            return null;
          }
          const isFocus = node.id === focusNodeId;
          const selected = selectedNodeId === node.id;
          return (
            <g key={node.id}>
              <g
                aria-label={`${node.name}, ${node.type}${isFocus ? ", graph focus" : ""}`}
                className="cursor-pointer outline-none"
                onClick={() => onNodeSelect(node.id)}
                onKeyDown={(event) => activateWithKeyboard(event, () => onNodeSelect(node.id))}
                role="button"
                tabIndex={0}
                transform={`translate(${position.x} ${position.y})`}
              >
                <circle
                  className={cn(
                    "fill-background stroke-border transition",
                    isFocus && "fill-primary stroke-primary",
                    selected && !isFocus && "stroke-primary"
                  )}
                  r={isFocus ? 43 : 36}
                  strokeWidth={selected ? 4 : 2}
                />
                <text
                  className={cn("pointer-events-none fill-foreground text-[11px] font-semibold", isFocus && "fill-primary-foreground")}
                  textAnchor="middle"
                  y="-2"
                >
                  {shortenLabel(node.name)}
                </text>
                <text
                  className={cn("pointer-events-none fill-muted-foreground text-[9px]", isFocus && "fill-primary-foreground/80")}
                  textAnchor="middle"
                  y="14"
                >
                  {shortenLabel(node.type)}
                </text>
              </g>
              {!isFocus ? (
                <g
                  aria-label={`Explore from ${node.name}`}
                  className="cursor-pointer outline-none"
                  onClick={(event) => {
                    event.stopPropagation();
                    onExpandNode(node.id);
                  }}
                  onKeyDown={(event) => activateWithKeyboard(event, () => onExpandNode(node.id))}
                  role="button"
                  tabIndex={0}
                  transform={`translate(${position.x + 31} ${position.y + 31})`}
                >
                  <circle className="fill-transparent" r="22" />
                  <circle className="fill-secondary stroke-border" r="13" />
                  <text className="pointer-events-none fill-secondary-foreground text-[13px]" textAnchor="middle" y="5">↗</text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function buildPositions(nodeIds: string[], focusNodeId: string) {
  const positions = new Map<string, Position>();
  positions.set(focusNodeId, center);
  const connectedIds = nodeIds.filter((nodeId) => nodeId !== focusNodeId);
  const horizontalRadius = 152;
  const verticalRadius = 130;

  connectedIds.forEach((nodeId, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(connectedIds.length, 1) - Math.PI / 2;
    positions.set(nodeId, {
      x: center.x + Math.cos(angle) * horizontalRadius,
      y: center.y + Math.sin(angle) * verticalRadius
    });
  });

  return positions;
}

function activateWithKeyboard(event: KeyboardEvent<SVGGElement>, action: () => void) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
}

function shortenLabel(value: string) {
  return value.length > 18 ? `${value.slice(0, 16)}…` : value;
}
