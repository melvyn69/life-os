import { Archive, Check } from "lucide-react";
import { AuthRequiredState } from "@/components/common/AuthRequiredState";
import { useArchiveEntity, useEntities, useValidateEntity } from "@/hooks/useEntities";
import { getUserFacingErrorMessage, isAuthRequiredError } from "@/lib/errors";
import type { Entity } from "@/services/entities";

export function Entities() {
  const { data: entities = [], error, isError, isLoading } = useEntities();
  const suggestedEntities = entities.filter((entity) => entity.status === "suggested");
  const activeEntities = entities.filter((entity) => entity.status === "active");

  if (isLoading) {
    return (
      <section className="space-y-4">
        <EntitiesHeader />
        <div className="space-y-3">
          <div className="h-28 animate-pulse rounded-lg border border-border bg-card" />
          <div className="h-28 animate-pulse rounded-lg border border-border bg-card" />
        </div>
      </section>
    );
  }

  if (isError) {
    if (isAuthRequiredError(error)) {
      return <AuthRequiredState />;
    }

    return (
      <section className="space-y-4">
        <EntitiesHeader />
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
          Unable to load entities right now.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <EntitiesHeader />
      <EntitySection
        emptyDescription="Suggested entities will appear after processing observations."
        entities={suggestedEntities}
        showActions
        title="Suggested"
      />
      <EntitySection
        emptyDescription="Validated entities will appear here."
        entities={activeEntities}
        title="Active"
      />
    </section>
  );
}

function EntitiesHeader() {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-normal">Entities</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Review the people, projects, places, habits, and values Life OS has suggested.
      </p>
    </div>
  );
}

function EntitySection({
  emptyDescription,
  entities,
  showActions = false,
  title
}: {
  emptyDescription: string;
  entities: Entity[];
  showActions?: boolean;
  title: string;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-normal text-muted-foreground">
        {title}
      </h3>

      {entities.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
          <h4 className="text-base font-semibold">Nothing here yet</h4>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {entities.map((entity) => (
            <EntityCard entity={entity} key={entity.id} showActions={showActions} />
          ))}
        </div>
      )}
    </div>
  );
}

function EntityCard({ entity, showActions }: { entity: Entity; showActions: boolean }) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold leading-6">{entity.name}</h4>
          {entity.description ? (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{entity.description}</p>
          ) : null}
        </div>
        <EntityStatusBadge label={entity.status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <EntityStatusBadge label={entity.type} />
        <EntityStatusBadge label={entity.confidence} />
        <EntityStatusBadge label={entity.sensitivity} />
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        Updated {formatDate(entity.updated_at)}
      </div>

      {showActions ? <EntityActions entityId={entity.id} /> : null}
    </article>
  );
}

function EntityActions({ entityId }: { entityId: string }) {
  const validateEntity = useValidateEntity();
  const archiveEntity = useArchiveEntity();
  const isPending = validateEntity.isPending || archiveEntity.isPending;
  const error = validateEntity.error ?? archiveEntity.error;

  return (
    <div className="mt-4 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={() => validateEntity.mutate(entityId)}
          type="button"
        >
          <Check aria-hidden="true" className="size-4" />
          Validate
        </button>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={() => archiveEntity.mutate(entityId)}
          type="button"
        >
          <Archive aria-hidden="true" className="size-4" />
          Archive
        </button>
      </div>

      {error ? (
        <p className="text-sm leading-5 text-destructive">
          {getUserFacingErrorMessage(error, "Unable to update this entity right now.")}
        </p>
      ) : null}
    </div>
  );
}

function EntityStatusBadge({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-secondary px-2 py-1 font-medium text-secondary-foreground">
      {label}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
