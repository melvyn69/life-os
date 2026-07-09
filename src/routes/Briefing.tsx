import { Loader2, Sparkles } from "lucide-react";
import { AuthRequiredState } from "@/components/common/AuthRequiredState";
import { useGenerateBriefing, useLatestBriefing } from "@/hooks/useBriefings";
import { getUserFacingErrorMessage, isAuthRequiredError } from "@/lib/errors";
import { parseBriefingContent, type Briefing as BriefingRecord } from "@/services/briefings";

export function Briefing() {
  const { data: briefing, error, isError, isLoading } = useLatestBriefing();
  const generateBriefing = useGenerateBriefing();

  if (isLoading) {
    return (
      <section className="space-y-4">
        <BriefingHeader />
        <div className="h-48 animate-pulse rounded-lg border border-border bg-card" />
      </section>
    );
  }

  if (isError) {
    if (isAuthRequiredError(error)) {
      return <AuthRequiredState title="Sign in to view your briefing" />;
    }

    return (
      <section className="space-y-4">
        <BriefingHeader />
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
          Unable to load your briefing right now.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-5">
      <BriefingHeader />
      <GenerateBriefingButton
        isPending={generateBriefing.isPending}
        onGenerate={() => generateBriefing.mutate()}
      />

      {generateBriefing.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm leading-6 text-destructive">
          {getUserFacingErrorMessage(
            generateBriefing.error,
            "Unable to generate a briefing right now."
          )}
        </div>
      ) : null}

      {briefing ? <BriefingCard briefing={briefing} /> : <EmptyBriefingState />}
    </section>
  );
}

function BriefingHeader() {
  return (
    <div>
      <h2 className="text-2xl font-semibold tracking-normal">Briefing</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        A short read from your active memory.
      </p>
    </div>
  );
}

function GenerateBriefingButton({
  isPending,
  onGenerate
}: {
  isPending: boolean;
  onGenerate: () => void;
}) {
  return (
    <button
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      disabled={isPending}
      onClick={onGenerate}
      type="button"
    >
      {isPending ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <Sparkles aria-hidden="true" className="size-4" />
      )}
      {isPending ? "Generating" : "Generate briefing"}
    </button>
  );
}

function EmptyBriefingState() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
      <h3 className="text-base font-semibold">No briefing yet</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Generate one after you have active memories, entities, or recent observations.
      </p>
    </div>
  );
}

function BriefingCard({ briefing }: { briefing: BriefingRecord }) {
  const content = parseBriefingContent(briefing);

  return (
    <article className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border pb-4">
        <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          Latest briefing
        </p>
        <h3 className="text-xl font-semibold leading-7 tracking-normal">{briefing.title}</h3>
        <p className="text-xs text-muted-foreground">{formatDate(briefing.created_at)}</p>
      </div>

      <div className="mt-5 space-y-5">
        <p className="text-sm leading-6">{content.summary}</p>

        {content.sections.length > 0 ? (
          <div className="space-y-4">
            {content.sections.map((section) => (
              <section className="space-y-2" key={section.heading}>
                <h4 className="text-sm font-semibold">{section.heading}</h4>
                <ul className="space-y-2 text-sm leading-6 text-muted-foreground">
                  {section.bullets.map((bullet) => (
                    <li className="flex gap-2" key={bullet}>
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : null}

        {content.suggestedFocus ? (
          <div className="rounded-md bg-secondary p-3 text-sm leading-6 text-secondary-foreground">
            <span className="font-semibold">Suggested focus: </span>
            {content.suggestedFocus}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}
