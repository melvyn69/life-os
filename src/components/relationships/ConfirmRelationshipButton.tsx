import { Check } from "lucide-react";
import { useConfirmRelationship } from "@/hooks/useRelationships";
import { usePendingNotification } from "@/hooks/usePendingNotification";

export function ConfirmRelationshipButton({
  relationshipId,
  disabled = false,
  onPendingChange
}: {
  relationshipId: string;
  disabled?: boolean;
  onPendingChange?: (isPending: boolean) => void;
}) {
  const mutation = useConfirmRelationship();
  usePendingNotification(mutation.isPending, onPendingChange);
  return (
    <div>
      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        disabled={disabled || mutation.isPending}
        onClick={() => mutation.mutate(relationshipId)}
        type="button"
      >
        <Check aria-hidden="true" className="size-4" />
        {mutation.isPending ? "Confirming…" : "Confirm"}
      </button>
      {mutation.isError ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {isOffline() ? "You are offline. The relationship was not confirmed." : mutation.error.message}
        </p>
      ) : null}
    </div>
  );
}

function isOffline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}
