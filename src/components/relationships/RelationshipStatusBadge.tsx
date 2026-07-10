import { cn } from "@/lib/utils";
import {
  getRelationshipDisplayLabel,
  type RelationshipDisplayState
} from "@/types/relationships";

export function RelationshipStatusBadge({ status }: { status: RelationshipDisplayState }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold",
        status === "confirmed" && "border-primary/30 bg-primary/10 text-primary",
        status === "supported" && "border-blue-500/30 bg-blue-500/10 text-blue-800",
        status === "suggested" && "border-amber-500/40 bg-amber-500/10 text-amber-800",
        status === "needs_review" && "border-destructive/30 bg-destructive/10 text-destructive",
        status === "past" && "border-border bg-muted text-muted-foreground",
        status === "archived" && "border-border bg-muted text-muted-foreground"
      )}
    >
      {getRelationshipDisplayLabel(status)}
    </span>
  );
}
