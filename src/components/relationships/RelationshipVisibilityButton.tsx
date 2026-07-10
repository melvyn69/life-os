import { Eye, EyeOff } from "lucide-react";
import { useSetRelationshipVisibility } from "@/hooks/useRelationships";
import { usePendingNotification } from "@/hooks/usePendingNotification";

export function RelationshipVisibilityButton({ relationshipId, isVisible, disabled = false, onPendingChange }: { relationshipId: string; isVisible: boolean; disabled?: boolean; onPendingChange?: (isPending: boolean) => void }) {
  const mutation = useSetRelationshipVisibility();
  usePendingNotification(mutation.isPending, onPendingChange);
  return (
    <div>
      <button
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-60"
        disabled={disabled || mutation.isPending}
        onClick={() => mutation.mutate({ relationshipId, isVisible: !isVisible })}
        type="button"
      >
        {isVisible ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
        {mutation.isPending ? "Saving…" : isVisible ? "Hide" : "Show"}
      </button>
      {mutation.isError ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {typeof navigator !== "undefined" && !navigator.onLine
            ? "You are offline. Visibility was not changed."
            : mutation.error.message}
        </p>
      ) : null}
    </div>
  );
}
