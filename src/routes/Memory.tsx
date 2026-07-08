import { Archive, Check } from "lucide-react";
import { AuthRequiredState } from "@/components/common/AuthRequiredState";
import { useArchiveMemory, useMemories, useValidateMemory } from "@/hooks/useMemories";
import { getUserFacingErrorMessage, isAuthRequiredError } from "@/lib/errors";
import type { MemoryWithEntity } from "@/services/memories";

export function Memory() {
  const { data: memories = [], error, isError, isLoading } = useMemories();
  const suggestedMemories = memories.filter((memory) => memory.status === "suggested");
  const activeMemories = memories.filter((memory) => memory.status === "active");

  if (isLoading) {
    return (
      <section className="space-y-4">
        <MemoryHeader />
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
        <MemoryHeader />
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
          Unable to load memory right now.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <MemoryHeader />
      <MemorySection
        emptyDescription="Suggested memories will appear after processing observations."
        memories={suggestedMemories}
        showActions
        title="Suggested"
      />
      <MemorySection
        emptyDescription="Validated memories will appear here."
        memories={activeMemories}
        title="Active"
      />
    </section>
  );
}

function MemoryHeader() {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-normal">Memory</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Confirm what Life OS may remember. Suggestions stay inactive until you validate them.
      </p>
    </div>
  );
}

function MemorySection({
  emptyDescription,
  memories,
  showActions = false,
  title
}: {
  emptyDescription: string;
  memories: MemoryWithEntity[];
  showActions?: boolean;
  title: string;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-normal text-muted-foreground">
        {title}
      </h3>

      {memories.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
          <h4 className="text-base font-semibold">Nothing here yet</h4>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{emptyDescription}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {memories.map((memory) => (
            <MemoryCard key={memory.id} memory={memory} showActions={showActions} />
          ))}
        </div>
      )}
    </div>
  );
}

function MemoryCard({
  memory,
  showActions
}: {
  memory: MemoryWithEntity;
  showActions: boolean;
}) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-6">{memory.content}</p>
        <MemoryStatusBadge label={memory.status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <MemoryStatusBadge label={memory.type} />
        <MemoryStatusBadge label={memory.confidence} />
        <MemoryStatusBadge label={memory.sensitivity} />
        {memory.entities ? <MemoryStatusBadge label={memory.entities.name} /> : null}
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        Updated {formatDate(memory.updated_at)}
      </div>

      {showActions ? <MemoryActions memoryId={memory.id} /> : null}
    </article>
  );
}

function MemoryActions({ memoryId }: { memoryId: string }) {
  const validateMemory = useValidateMemory();
  const archiveMemory = useArchiveMemory();
  const isPending = validateMemory.isPending || archiveMemory.isPending;
  const error = validateMemory.error ?? archiveMemory.error;

  return (
    <div className="mt-4 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={() => validateMemory.mutate(memoryId)}
          type="button"
        >
          <Check aria-hidden="true" className="size-4" />
          Validate
        </button>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          onClick={() => archiveMemory.mutate(memoryId)}
          type="button"
        >
          <Archive aria-hidden="true" className="size-4" />
          Archive
        </button>
      </div>

      {error ? (
        <p className="text-sm leading-5 text-destructive">
          {getUserFacingErrorMessage(error, "Unable to update this memory right now.")}
        </p>
      ) : null}
    </div>
  );
}

function MemoryStatusBadge({ label }: { label: string }) {
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
