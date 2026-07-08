import { useCaptures } from "@/hooks/useCaptures";

export function Inbox() {
  const { data: captures = [], error, isError, isLoading } = useCaptures();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <InboxHeader />
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-lg border border-border bg-card" />
          <div className="h-24 animate-pulse rounded-lg border border-border bg-card" />
        </div>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="space-y-4">
        <InboxHeader />
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
          {error.message}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <InboxHeader />

      {captures.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
          <h3 className="text-base font-semibold">No captures yet</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Text captures awaiting analysis will appear here after you save them.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {captures.map((capture) => (
            <article
              className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm"
              key={capture.id}
            >
              <p className="whitespace-pre-wrap text-sm leading-6">{capture.content}</p>
              <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                <span>{formatCaptureDate(capture.created_at)}</span>
                <span className="rounded-md bg-secondary px-2 py-1 font-medium text-secondary-foreground">
                  Awaiting analysis
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function InboxHeader() {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-normal">Inbox</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Text captures awaiting analysis.
      </p>
    </div>
  );
}

function formatCaptureDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
