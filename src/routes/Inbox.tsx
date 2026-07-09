import { EyeOff } from "lucide-react";
import { AnalyzeCaptureButton } from "@/components/inbox/AnalyzeCaptureButton";
import { ProcessObservationsButton } from "@/components/inbox/ProcessObservationsButton";
import { useCaptures } from "@/hooks/useCaptures";
import { useIgnoreObservation, useSuggestedObservations } from "@/hooks/useObservations";
import { AuthRequiredState } from "@/components/common/AuthRequiredState";
import { getUserFacingErrorMessage, isAuthRequiredError } from "@/lib/errors";
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
    if (isAuthRequiredError(error)) {
      return <AuthRequiredState />;
    }

    return (
      <section className="space-y-4">
        <InboxHeader />
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
          Unable to load inbox right now.
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
  const ignoreObservation = useIgnoreObservation();
  const observationGroups = groupSuggestedObservations(observations);

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
          {getUserFacingErrorMessage(error, "Unable to load suggested observations right now.")}
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
          {observationGroups.map((group) => (
            <article
              className="rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm"
              key={group.key}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                    Source capture
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm leading-6">
                    {group.captureContent ?? "Capture unavailable"}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {formatCaptureDate(group.createdAt)}
                  </p>
                </div>
                {group.captureId ? <ProcessObservationsButton captureId={group.captureId} /> : null}
              </div>

              <div className="mt-4 space-y-4 border-t border-border pt-4">
                {group.observations.map((observation) => (
                  <div key={observation.id}>
                    <p className="text-sm leading-6">{observation.content}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <ObservationBadge label={observation.type} />
                      <ObservationBadge label={observation.confidence} />
                      <ObservationBadge label={observation.sensitivity} />
                    </div>
                    <button
                      className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={ignoreObservation.isPending}
                      onClick={() => ignoreObservation.mutate(observation.id)}
                      type="button"
                    >
                      <EyeOff aria-hidden="true" className="size-4" />
                      Ignore
                    </button>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {ignoreObservation.isError ? (
        <p className="text-sm leading-5 text-destructive">
          {getUserFacingErrorMessage(ignoreObservation.error, "Unable to ignore this observation right now.")}
        </p>
      ) : null}
    </div>
  );
}

function groupSuggestedObservations(observations: SuggestedObservation[]) {
  const groups = new Map<
    string,
    {
      captureContent: string | null;
      captureId: string | null;
      createdAt: string;
      key: string;
      observations: SuggestedObservation[];
    }
  >();

  for (const observation of observations) {
    const key = observation.capture_id ?? observation.id;
    const existingGroup = groups.get(key);

    if (existingGroup) {
      existingGroup.observations.push(observation);
      continue;
    }

    groups.set(key, {
      captureContent: observation.captures?.content ?? null,
      captureId: observation.capture_id,
      createdAt: observation.captures?.created_at ?? observation.created_at,
      key,
      observations: [observation]
    });
  }

  return [...groups.values()];
}

function ObservationBadge({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-secondary px-2 py-1 font-medium text-secondary-foreground">
      {label}
    </span>
  );
}
