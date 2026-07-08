import { WandSparkles } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { inboxCapturesQueryKey } from "@/hooks/useCaptures";
import { suggestedObservationsQueryKey } from "@/hooks/useObservations";
import { getUserFacingErrorMessage } from "@/lib/errors";
import { analyzeCapture } from "@/services/ai";

type AnalyzeCaptureButtonProps = {
  captureId: string;
};

export function AnalyzeCaptureButton({ captureId }: AnalyzeCaptureButtonProps) {
  const queryClient = useQueryClient();
  const analyzeCaptureMutation = useMutation({
    mutationFn: () => analyzeCapture(captureId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inboxCapturesQueryKey });
      void queryClient.invalidateQueries({ queryKey: suggestedObservationsQueryKey });
    }
  });

  return (
    <div className="space-y-2">
      <button
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={analyzeCaptureMutation.isPending}
        onClick={() => analyzeCaptureMutation.mutate()}
        type="button"
      >
        <WandSparkles aria-hidden="true" className="size-4" />
        {analyzeCaptureMutation.isPending ? "Analyzing..." : "Analyze"}
      </button>

      {analyzeCaptureMutation.isError ? (
        <p className="text-sm leading-5 text-destructive">
          {getUserFacingErrorMessage(
            analyzeCaptureMutation.error,
            "Unable to analyze this capture right now."
          )}
        </p>
      ) : null}
    </div>
  );
}
