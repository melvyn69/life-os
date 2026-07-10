import type { RelationshipEvidence } from "@/types/relationships";

export function RelationshipEvidenceList({ evidence }: { evidence: RelationshipEvidence[] }) {
  if (evidence.length === 0) {
    return <p className="text-sm text-muted-foreground">No evidence is available on this page.</p>;
  }

  return (
    <ul className="space-y-3">
      {evidence.map((item) => (
        <li className="rounded-lg border border-border bg-background p-4" key={item.id}>
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>{item.relation_to_claim}</span>
            <span aria-hidden="true">·</span>
            <span>{item.evidence_kind.replaceAll("_", " ")}</span>
            <span aria-hidden="true">·</span>
            <span>{item.source_strength}</span>
          </div>
          {item.excerpt ? <p className="mt-3 text-sm leading-6">{item.excerpt}</p> : null}
          <p className="mt-2 text-xs text-muted-foreground">
            {formatDate(item.observed_at ?? item.created_at)}
          </p>
        </li>
      ))}
    </ul>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}
