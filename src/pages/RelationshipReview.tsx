import { useState } from "react";
import { AuthRequiredState } from "@/components/common/AuthRequiredState";
import { RelationshipDetailSheet } from "@/components/relationships/RelationshipDetailSheet";
import { RelationshipReviewCard } from "@/components/relationships/RelationshipReviewCard";
import { useRelationshipReviewQueue } from "@/hooks/useRelationships";
import { isAuthRequiredError } from "@/lib/errors";
import type { RelationshipReviewFilter } from "@/types/relationships";

const filters: Array<{ value: RelationshipReviewFilter; label: string }> = [
  { value: "suggestions", label: "Suggestions" },
  { value: "contradictions", label: "Contradictions" },
  { value: "sensitive", label: "Sensitive" },
  { value: "rejected_with_new_evidence", label: "Rejected with new evidence" }
];

export function RelationshipReviewPage() {
  const [filter, setFilter] = useState<RelationshipReviewFilter>("suggestions");
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string>();
  const query = useRelationshipReviewQueue(filter);
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  if (query.isError && isAuthRequiredError(query.error)) {
    return <AuthRequiredState />;
  }

  return (
    <section className="space-y-5">
      <header>
        <h1 className="text-2xl font-semibold">Relationship Review</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Review suggestions, contradictions, sensitive links, and materially new evidence. Nothing here is resolved automatically.</p>
      </header>
      <div aria-label="Relationship review filters" className="flex gap-2 overflow-x-auto pb-1" role="group">
        {filters.map((item) => (
          <button
            aria-pressed={filter === item.value}
            className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-semibold ${filter === item.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card"}`}
            key={item.value}
            onClick={() => setFilter(item.value)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
      {query.isLoading ? <div aria-label="Loading relationship review" className="h-36 animate-pulse rounded-xl bg-muted" role="status" /> : null}
      {query.isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
          {typeof navigator !== "undefined" && !navigator.onLine
            ? "You are offline. Previously loaded review items remain unchanged."
            : "Unable to load relationship review right now."}
        </div>
      ) : null}
      {!query.isLoading && !query.isError && items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center"><h2 className="font-semibold">Nothing needs review</h2><p className="mt-2 text-sm text-muted-foreground">This queue is currently empty.</p></div>
      ) : null}
      <div className="space-y-4">
        {items.map((item) => <RelationshipReviewCard item={item} key={item.relationship.id} onOpen={setSelectedRelationshipId} />)}
      </div>
      {query.hasNextPage ? (
        <button className="min-h-11 w-full rounded-md border border-border bg-card px-4 text-sm font-semibold disabled:opacity-60" disabled={query.isFetchingNextPage} onClick={() => void query.fetchNextPage()} type="button">
          {query.isFetchingNextPage ? "Loading…" : "Load more"}
        </button>
      ) : null}
      {selectedRelationshipId ? <RelationshipDetailSheet onClose={() => setSelectedRelationshipId(undefined)} relationshipId={selectedRelationshipId} /> : null}
    </section>
  );
}
