import type { RelationshipHistoryEntry } from "@/types/relationships";

export function RelationshipHistoryTimeline({ history }: { history: RelationshipHistoryEntry[] }) {
  if (history.length === 0) {
    return <p className="text-sm text-muted-foreground">No history is available on this page.</p>;
  }

  return (
    <ol className="space-y-4 border-l border-border pl-5">
      {history.map((entry) => (
        <li className="relative" key={entry.id}>
          <span aria-hidden="true" className="absolute -left-[1.55rem] top-1.5 size-2 rounded-full bg-primary" />
          <p className="text-sm font-semibold">{entry.action.replaceAll("_", " ")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(entry.created_at))}
          </p>
          {entry.reason ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.reason}</p> : null}
        </li>
      ))}
    </ol>
  );
}
