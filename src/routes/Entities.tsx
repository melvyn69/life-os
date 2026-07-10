import { useState } from "react";
import { Archive, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { AuthRequiredState } from "@/components/common/AuthRequiredState";
import { useArchiveEntity, useCorrectEntity, useEntities, useValidateEntity } from "@/hooks/useEntities";
import { useValidationRequirements } from "@/hooks/useValidationRequirements";
import { getUserFacingErrorMessage, isAuthRequiredError } from "@/lib/errors";
import type { Entity } from "@/services/entities";

const noValidationRequirementIds = new Set<string>();

export function Entities() {
  const { data: entities = [], error, isError, isLoading } = useEntities();
  const { data: validationRequirements } = useValidationRequirements();
  const suggestedEntities = entities.filter((entity) => entity.status === "suggested");
  const activeEntities = entities.filter((entity) => entity.status === "active");
  const requiredEntityIds = new Set([
    ...(validationRequirements?.entityIds ?? []),
    ...suggestedEntities.filter((entity) => entity.sensitivity === "sensitive").map((entity) => entity.id)
  ]);
  const requiredEntities = suggestedEntities.filter((entity) => requiredEntityIds.has(entity.id));
  const optionalEntities = suggestedEntities.filter((entity) => !requiredEntityIds.has(entity.id));

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
      {requiredEntities.length > 0 ? (
        <EntitySection
          emptyDescription=""
          entities={requiredEntities}
          showActions
          title="Needs your confirmation"
          requiresConfirmationIds={requiredEntityIds}
        />
      ) : null}
      <EntitySection
        emptyDescription="Suggested entities will appear after processing observations."
        entities={optionalEntities}
        showActions
        title="Suggested"
      />
      <EntitySection
        emptyDescription="Validated entities will appear here."
        entities={activeEntities}
        showArchiveActions
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
        Suggestions stay tentative until you choose to confirm them. Life OS only asks for your confirmation when it cannot safely settle something on its own.
      </p>
    </div>
  );
}

function EntitySection({
  emptyDescription,
  entities,
  showActions = false,
  showArchiveActions = false,
  title,
  requiresConfirmationIds = noValidationRequirementIds
}: {
  emptyDescription: string;
  entities: Entity[];
  showArchiveActions?: boolean;
  showActions?: boolean;
  title: string;
  requiresConfirmationIds?: Set<string>;
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
            <EntityCard
              entity={entity}
              key={entity.id}
              showActions={showActions}
              showArchiveActions={showArchiveActions}
              requiresConfirmation={requiresConfirmationIds.has(entity.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EntityCard({
  entity,
  showActions,
  showArchiveActions,
  requiresConfirmation
}: {
  entity: Entity;
  showActions: boolean;
  showArchiveActions: boolean;
  requiresConfirmation: boolean;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
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

      <Link className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline" to={`/entities/${entity.id}`}>
        View entity and relationships
      </Link>

      {requiresConfirmation ? (
        <p className="mt-3 text-sm leading-5 text-muted-foreground">
          Life OS will keep this tentative until you decide.
        </p>
      ) : null}

      {showActions ? <EntityActions entity={entity} mode="review" /> : null}
      {showArchiveActions ? <EntityActions entity={entity} mode="archive" /> : null}
    </article>
  );
}

function EntityActions({ entity, mode }: { entity: Entity; mode: "archive" | "review" }) {
  const validateEntity = useValidateEntity();
  const correctEntity = useCorrectEntity();
  const archiveEntity = useArchiveEntity();
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [description, setDescription] = useState(entity.description ?? "");
  const isPending = validateEntity.isPending || correctEntity.isPending || archiveEntity.isPending;
  const error = validateEntity.error ?? correctEntity.error ?? archiveEntity.error;
  const isReviewMode = mode === "review";
  const correctionFieldId = `entity-correction-${entity.id}`;

  function submitCorrection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    correctEntity.mutate({
      entityId: entity.id,
      description: description.trim() || null
    }, {
      onSuccess: () => setIsCorrecting(false)
    });
  }

  return (
    <div className="mt-4 space-y-2">
      <div className={isReviewMode ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 gap-2"}>
        {isReviewMode ? (
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isPending}
            onClick={() => validateEntity.mutate(entity.id)}
            type="button"
          >
            <Check aria-hidden="true" className="size-4" />
            Confirm
          </button>
        ) : null}
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={() => archiveEntity.mutate(entity.id)}
          type="button"
        >
          <Archive aria-hidden="true" className="size-4" />
          Archive
        </button>
      </div>

      {isCorrecting ? (
        <form className="space-y-2" onSubmit={submitCorrection}>
          <label className="block text-sm font-medium" htmlFor={correctionFieldId}>
            What should Life OS remember instead?
          </label>
          <textarea
            className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            disabled={isPending}
            id={correctionFieldId}
            onChange={(event) => setDescription(event.target.value)}
            value={description}
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Saving your correction makes this the current confirmed understanding. Earlier evidence stays in history.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              Save correction
            </button>
            <button
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              onClick={() => {
                setDescription(entity.description ?? "");
                setIsCorrecting(false);
              }}
              type="button"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={() => setIsCorrecting(true)}
          type="button"
        >
          Correct
        </button>
      )}

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
