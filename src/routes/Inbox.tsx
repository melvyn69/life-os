import { AnalyzeCaptureButton } from "@/components/inbox/AnalyzeCaptureButton";
import { useCaptures } from "@/hooks/useCaptures";
import { useSuggestedObservations } from "@/hooks/useObservations";
import type { SuggestedObservation } from "@/services/observations";

export function Inbox() {
  const { data: captures = [], error, isError, isLoading } = useCaptures();
  const suggestedObservations = useSuggestedObservations();

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

      <div className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-normal text-muted-foreground">
          Awaiting analysis
        </h3>

        {captures.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
            <h4 className="text-base font-semibold">No captures waiting</h4>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Text captures ready for analysis will appear here after you save them.
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
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground sm:justify-start">
                    <span>{formatCaptureDate(capture.created_at)}</span>
                    <span className="rounded-md bg-secondary px-2 py-1 font-medium text-secondary-foreground">
                      Awaiting analysis
                    </span>
                  </div>
                  <AnalyzeCaptureButton captureId={capture.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <SuggestedObservationsSection
        error={suggestedObservations.error}
        isError={suggestedObservations.isError}
        isLoading={suggestedObservations.isLoading}
        observations={suggestedObservations.data ?? []}
      />
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

function SuggestedObservationsSection({
  error,
  isError,
  isLoading,
  observations
}: {
  error: Error | null;
  isError: boolean;
  isLoading: boolean;
  observations: SuggestedObservation[];
}) {
  return (
    <div className="space-y-3 pt-3">
      <h3 className="text-sm font-semibold uppercase tracking-normal text-muted-foreground">
        Suggested observations
      </h3>

      {isLoading ? (
        <div className="h-24 animate-pulse rounded-lg border border-border bg-card" />
      ) : null}

      {isError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
          {error?.message ?? "Unable to load suggested observations."}
        </div>
      ) : null}

      {!isLoading && !isError && observations.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
          <h4 className="text-base font-semibold">No observations yet</h4>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Analyze a capture to review what Life OS cautiously noticed.
          </p>
        </div>
      ) : null}

      {!isLoading && !isError && observations.length > 0 ? (
        <div className="space-y-3">
          {observations.map((observation) => (
            <article
              className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm"
              key={observation.id}
            >
              <p className="text-sm leading-6">{observation.content}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                <ObservationBadge label={observation.type} />
                <ObservationBadge label={observation.confidence} />
                <ObservationBadge label={observation.sensitivity} />
              </div>
              {observation.captures ? (
                <p className="mt-3 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  From: {observation.captures.content}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ObservationBadge({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-secondary px-2 py-1 font-medium text-secondary-foreground">
      {label}
    </span>
  );
}
