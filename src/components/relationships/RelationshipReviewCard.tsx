import { useCallback, useState } from "react";
import { ConfirmRelationshipButton } from "@/components/relationships/ConfirmRelationshipButton";
import { RejectRelationshipDialog } from "@/components/relationships/RejectRelationshipDialog";
import { RelationshipSensitivityNotice } from "@/components/relationships/RelationshipSensitivityNotice";
import { RelationshipStatusBadge } from "@/components/relationships/RelationshipStatusBadge";
import {
  getRelationshipDisplayState,
  getRelationshipTypeLabel,
  type RelationshipReviewItem
} from "@/types/relationships";

export function RelationshipReviewCard({
  item,
  onOpen
}: {
  item: RelationshipReviewItem;
  onOpen: (relationshipId: string) => void;
}) {
  const relationship = item.relationship;
  const [pendingDecisionCount, setPendingDecisionCount] = useState(0);
  const handlePendingChange = useCallback((isPending: boolean) => {
    setPendingDecisionCount((count) => Math.max(0, count + (isPending ? 1 : -1)));
  }, []);
  const decisionPending = pendingDecisionCount > 0;
  return (
    <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <button className="w-full min-h-11 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => onOpen(relationship.id)} type="button">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold">{item.source_entity.name} {relationship.is_directional ? "→" : "↔"} {item.target_entity.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{getRelationshipTypeLabel(relationship.relationship_type)}</p>
          </div>
          <RelationshipStatusBadge status={getRelationshipDisplayState(relationship.status)} />
        </div>
        {relationship.explanation ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{relationship.explanation}</p> : null}
        <p className="mt-3 text-xs text-muted-foreground">{item.evidence_count} evidence item{item.evidence_count === 1 ? "" : "s"}</p>
      </button>
      <div className="mt-3"><RelationshipSensitivityNotice sensitivity={relationship.sensitivity} /></div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {relationship.status !== "rejected" && relationship.status !== "archived" ? <ConfirmRelationshipButton disabled={decisionPending} onPendingChange={handlePendingChange} relationshipId={relationship.id} /> : null}
        {relationship.status !== "archived" ? <RejectRelationshipDialog disabled={decisionPending} onPendingChange={handlePendingChange} relationshipId={relationship.id} /> : null}
      </div>
    </article>
  );
}
