import { useCallback, useState } from "react";
import { Archive, RotateCcw, X } from "lucide-react";
import { ConfirmRelationshipButton } from "@/components/relationships/ConfirmRelationshipButton";
import { CorrectRelationshipForm } from "@/components/relationships/CorrectRelationshipForm";
import { MarkOutdatedDialog } from "@/components/relationships/MarkOutdatedDialog";
import { RejectRelationshipDialog } from "@/components/relationships/RejectRelationshipDialog";
import { RelationshipEvidenceList } from "@/components/relationships/RelationshipEvidenceList";
import { RelationshipHistoryTimeline } from "@/components/relationships/RelationshipHistoryTimeline";
import { RelationshipSensitivityNotice } from "@/components/relationships/RelationshipSensitivityNotice";
import { RelationshipStatusBadge } from "@/components/relationships/RelationshipStatusBadge";
import { RelationshipVisibilityButton } from "@/components/relationships/RelationshipVisibilityButton";
import {
  useArchiveRelationship,
  useRelationshipDetail,
  useRestoreRelationship
} from "@/hooks/useRelationships";
import {
  getRelationshipDisplayState,
  getRelationshipTypeLabel
} from "@/types/relationships";

export function RelationshipDetailSheet({
  relationshipId,
  onClose
}: {
  relationshipId: string;
  onClose: () => void;
}) {
  const detailQuery = useRelationshipDetail(relationshipId);
  const archiveMutation = useArchiveRelationship();
  const restoreMutation = useRestoreRelationship();
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [pendingDecisionCount, setPendingDecisionCount] = useState(0);
  const handlePendingChange = useCallback((isPending: boolean) => {
    setPendingDecisionCount((count) => Math.max(0, count + (isPending ? 1 : -1)));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 p-0 sm:items-center sm:p-5" onMouseDown={onClose}>
      <section
        aria-labelledby="relationship-detail-title"
        aria-modal="true"
        className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-2xl border border-border bg-card p-5 shadow-2xl sm:rounded-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Relationship detail</p>
            <h2 className="mt-1 text-xl font-semibold" id="relationship-detail-title">Evidence and history</h2>
          </div>
          <button aria-label="Close relationship detail" className="flex size-11 items-center justify-center rounded-full hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" onClick={onClose} type="button">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        {detailQuery.isLoading ? (
          <div aria-label="Loading relationship detail" className="mt-5 space-y-3" role="status">
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
            <div className="h-32 animate-pulse rounded-lg bg-muted" />
          </div>
        ) : null}

        {detailQuery.isError ? (
          <div className="mt-5 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive" role="alert">
            {typeof navigator !== "undefined" && !navigator.onLine
              ? "You are offline. No relationship decision was recorded."
              : detailQuery.error.message || "Unable to load relationship detail."}
          </div>
        ) : null}

        {detailQuery.data ? (() => {
          const detail = detailQuery.data;
          const relationship = detail.relationship;
          const mutationPending = archiveMutation.isPending || restoreMutation.isPending || pendingDecisionCount > 0;
          return (
            <div className="mt-5 space-y-6">
              <div>
                <h3 className="text-lg font-semibold">{getRelationshipTypeLabel(relationship.relationship_type)}</h3>
                <p className="mt-2 text-sm leading-6">
                  {detail.source_entity.name} {relationship.is_directional ? "→" : "↔"} {detail.target_entity.name}
                </p>
              </div>

              <RelationshipStatusBadge status={getRelationshipDisplayState(relationship.status)} />

              <div className="text-sm leading-6">
                <p className="font-semibold">Time</p>
                <p className="text-muted-foreground">{formatTemporalContext(relationship.start_date, relationship.end_date, relationship.date_precision)}</p>
              </div>

              {relationship.explanation ? (
                <div className="text-sm leading-6">
                  <p className="font-semibold">Why this relationship appears</p>
                  <p className="mt-1 text-muted-foreground">{relationship.explanation}</p>
                </div>
              ) : null}

              <RelationshipSensitivityNotice sensitivity={relationship.sensitivity} />

              {detail.contradictions.length > 0 ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
                  <p className="font-semibold">Contradiction needs review</p>
                  <p className="mt-1">The current interpretation is not resolved automatically. Existing confidence and evidence are preserved.</p>
                </div>
              ) : null}

              <div>
                <h3 className="font-semibold">Evidence summary</h3>
                <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <SummaryCount label="Supporting" value={detail.evidence_summary.supporting} />
                  <SummaryCount label="Contradicting" value={detail.evidence_summary.contradicting} />
                  <SummaryCount label="Contextual" value={detail.evidence_summary.contextual} />
                  <SummaryCount label="Independent" value={detail.evidence_summary.independent_sources} />
                </dl>
                <div className="mt-4"><RelationshipEvidenceList evidence={detail.evidence} /></div>
              </div>

              <div>
                <h3 className="font-semibold">Actions</h3>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {detail.actions.can_confirm ? <ConfirmRelationshipButton disabled={mutationPending} onPendingChange={handlePendingChange} relationshipId={relationship.id} /> : null}
                  {detail.actions.can_reject ? <RejectRelationshipDialog disabled={mutationPending} onPendingChange={handlePendingChange} relationshipId={relationship.id} /> : null}
                  {detail.actions.can_mark_outdated ? <MarkOutdatedDialog disabled={mutationPending} onPendingChange={handlePendingChange} relationshipId={relationship.id} /> : null}
                  {detail.actions.can_set_visibility ? <RelationshipVisibilityButton disabled={mutationPending} isVisible={relationship.is_visible} onPendingChange={handlePendingChange} relationshipId={relationship.id} /> : null}
                  {detail.actions.can_correct ? (
                    <button className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-60" disabled={mutationPending} onClick={() => setIsCorrecting((value) => !value)} type="button">Correct</button>
                  ) : null}
                  {detail.actions.can_archive ? (
                    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-60" disabled={mutationPending} onClick={() => archiveMutation.mutate(relationship.id)} type="button"><Archive aria-hidden="true" className="size-4" />{archiveMutation.isPending ? "Archiving…" : "Archive"}</button>
                  ) : null}
                  {detail.actions.can_restore ? (
                    <button className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-60" disabled={mutationPending} onClick={() => restoreMutation.mutate(relationship.id)} type="button"><RotateCcw aria-hidden="true" className="size-4" />{restoreMutation.isPending ? "Restoring…" : "Restore"}</button>
                  ) : null}
                </div>
                {archiveMutation.isError ? <p className="mt-3 text-sm text-destructive" role="alert">{archiveMutation.error.message}</p> : null}
                {restoreMutation.isError ? <p className="mt-3 text-sm text-destructive" role="alert">{restoreMutation.error.message}</p> : null}
              </div>

              {isCorrecting ? (
                <CorrectRelationshipForm
                  onDone={() => setIsCorrecting(false)}
                  onPendingChange={handlePendingChange}
                  relationship={relationship}
                  sourceEntity={detail.source_entity}
                  targetEntity={detail.target_entity}
                />
              ) : null}

              <details className="rounded-lg border border-border p-4">
                <summary className="cursor-pointer font-semibold">Detailed history</summary>
                <div className="mt-5"><RelationshipHistoryTimeline history={detail.history} /></div>
              </details>
              {detailQuery.hasNextPage ? (
                <button
                  className="min-h-11 w-full rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-60"
                  disabled={detailQuery.isFetchingNextPage}
                  onClick={() => void detailQuery.fetchNextPage()}
                  type="button"
                >
                  {detailQuery.isFetchingNextPage ? "Loading…" : "Load more evidence and history"}
                </button>
              ) : null}
            </div>
          );
        })() : null}
      </section>
    </div>
  );
}

function SummaryCount({ label, value }: { label: string; value: number }) {
  return <div className="rounded-md bg-muted p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-lg font-semibold">{value}</dd></div>;
}

function formatTemporalContext(start: string | null, end: string | null, precision: string) {
  if (!start && !end) {
    return "No time period recorded";
  }
  const formatter = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
  const startLabel = start ? formatter.format(new Date(`${start}T00:00:00`)) : "Unknown start";
  const endLabel = end ? formatter.format(new Date(`${end}T00:00:00`)) : "Current";
  return `${startLabel} – ${endLabel} (${precision})`;
}
