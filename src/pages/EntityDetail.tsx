import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AuthRequiredState } from "@/components/common/AuthRequiredState";
import { RelationshipDetailSheet } from "@/components/relationships/RelationshipDetailSheet";
import { RelationshipStatusBadge } from "@/components/relationships/RelationshipStatusBadge";
import { useEntity } from "@/hooks/useEntities";
import { useEntityRelationships } from "@/hooks/useRelationships";
import { isAuthRequiredError } from "@/lib/errors";
import {
  getRelationshipDisplayState,
  getRelationshipTypeLabel,
  type EntityRelationshipItem
} from "@/types/relationships";

export function EntityDetailPage() {
  const { entityId = "" } = useParams();
  const entityQuery = useEntity(entityId);
  const relationshipsQuery = useEntityRelationships(entityId);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string>();

  if (entityQuery.isLoading || relationshipsQuery.isLoading) {
    return <div aria-label="Loading entity detail" className="h-56 animate-pulse rounded-xl bg-muted" role="status" />;
  }

  const error = entityQuery.error ?? relationshipsQuery.error;
  if (error) {
    if (isAuthRequiredError(error)) {
      return <AuthRequiredState />;
    }
    return <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert">Unable to load this entity.</div>;
  }

  const entity = entityQuery.data;
  if (!entity) {
    return <div className="rounded-lg border border-border bg-card p-5">Entity not found.</div>;
  }

  const relationships = relationshipsQuery.data ?? [];
  const current = relationships.filter((item) => item.relationship.is_visible && ["confirmed", "supported"].includes(item.relationship.status));
  const historical = relationships.filter((item) => ["outdated", "archived"].includes(item.relationship.status));
  const review = relationships.filter((item) => ["suggested", "contradicted", "rejected"].includes(item.relationship.status));
  const hidden = relationships.filter((item) => !item.relationship.is_visible && !historical.includes(item));

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{entity.type}</p>
        <h1 className="mt-1 text-2xl font-semibold">{entity.name}</h1>
        {entity.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{entity.description}</p> : null}
        <Link className="mt-4 inline-flex min-h-11 items-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" to={`/graph/${entity.id}`}>Explore the graph</Link>
      </header>
      <EntityRelationshipSection items={current} onOpen={setSelectedRelationshipId} title="Current relationships" />
      <EntityRelationshipSection items={historical} onOpen={setSelectedRelationshipId} title="Past relationships" />
      <EntityRelationshipSection items={review} onOpen={setSelectedRelationshipId} title="Needs review" />
      <EntityRelationshipSection items={hidden} onOpen={setSelectedRelationshipId} title="Hidden relationships" />
      {selectedRelationshipId ? <RelationshipDetailSheet onClose={() => setSelectedRelationshipId(undefined)} relationshipId={selectedRelationshipId} /> : null}
    </section>
  );
}

function EntityRelationshipSection({
  items,
  onOpen,
  title
}: {
  items: EntityRelationshipItem[];
  onOpen: (relationshipId: string) => void;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {items.length === 0 ? <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">No relationships in this section.</p> : null}
      {items.map((item) => (
        <button className="min-h-20 w-full rounded-lg border border-border bg-card p-4 text-left shadow-sm focus-visible:ring-2 focus-visible:ring-ring" key={item.relationship.id} onClick={() => onOpen(item.relationship.id)} type="button">
          <span className="flex items-start justify-between gap-3">
            <span>
              <span className="block font-semibold">{item.source_entity.name} {item.relationship.is_directional ? "→" : "↔"} {item.target_entity.name}</span>
              <span className="mt-1 block text-sm text-muted-foreground">{getRelationshipTypeLabel(item.relationship.relationship_type)}</span>
            </span>
            <RelationshipStatusBadge status={getRelationshipDisplayState(item.relationship.status)} />
          </span>
        </button>
      ))}
    </section>
  );
}
