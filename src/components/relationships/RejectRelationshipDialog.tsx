import { useState } from "react";
import { useRejectRelationship } from "@/hooks/useRelationships";
import { usePendingNotification } from "@/hooks/usePendingNotification";

export function RejectRelationshipDialog({
  relationshipId,
  disabled = false,
  onPendingChange
}: {
  relationshipId: string;
  disabled?: boolean;
  onPendingChange?: (isPending: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const mutation = useRejectRelationship();
  usePendingNotification(mutation.isPending, onPendingChange);
  const fieldId = `relationship-rejection-${relationshipId}`;

  if (!open) {
    return (
      <button
        className="min-h-11 rounded-md border border-border px-4 py-2 text-sm font-semibold disabled:opacity-60"
        disabled={disabled}
        onClick={() => setOpen(true)}
        type="button"
      >
        Reject
      </button>
    );
  }

  return (
    <form
      aria-labelledby={`${fieldId}-title`}
      className="col-span-full rounded-lg border border-border bg-background p-4"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate({ relationshipId, reason: reason.trim() || null }, {
          onSuccess: () => setOpen(false)
        });
      }}
      role="dialog"
    >
      <h4 className="font-semibold" id={`${fieldId}-title`}>Reject this relationship?</h4>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Its evidence and fingerprint will be preserved so the same evidence cannot recreate it.</p>
      <label className="mt-3 block text-sm font-medium" htmlFor={fieldId}>Reason (optional)</label>
      <textarea
        className="mt-2 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        disabled={mutation.isPending}
        id={fieldId}
        maxLength={500}
        onChange={(event) => setReason(event.target.value)}
        value={reason}
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="min-h-11 rounded-md bg-destructive px-3 text-sm font-semibold text-white disabled:opacity-60" disabled={mutation.isPending} type="submit">
          {mutation.isPending ? "Rejecting…" : "Reject"}
        </button>
        <button className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold" disabled={mutation.isPending} onClick={() => setOpen(false)} type="button">Cancel</button>
      </div>
      {mutation.isError ? <p className="mt-3 text-sm text-destructive" role="alert">{mutation.error.message}</p> : null}
    </form>
  );
}
