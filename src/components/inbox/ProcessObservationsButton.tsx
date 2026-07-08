import { Sparkles } from "lucide-react";
import { useProcessObservations } from "@/hooks/useObservations";
import { getUserFacingErrorMessage } from "@/lib/errors";

type ProcessObservationsButtonProps = {
  captureId: string;
};

export function ProcessObservationsButton({ captureId }: ProcessObservationsButtonProps) {
  const processObservations = useProcessObservations();

  return (
    <div className="space-y-2">
      <button
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={processObservations.isPending}
        onClick={() => processObservations.mutate(captureId)}
        type="button"
      >
        <Sparkles aria-hidden="true" className="size-4" />
        {processObservations.isPending ? "Suggesting..." : "Suggest memory"}
      </button>

      {processObservations.isError ? (
        <p className="text-sm leading-5 text-destructive">
          {getUserFacingErrorMessage(
            processObservations.error,
            "Unable to suggest memory right now."
          )}
        </p>
      ) : null}
    </div>
  );
}
