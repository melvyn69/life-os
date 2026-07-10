import { useState } from "react";
import { useMarkRelationshipOutdated } from "@/hooks/useRelationships";
import { usePendingNotification } from "@/hooks/usePendingNotification";

export function MarkOutdatedDialog({ relationshipId, disabled = false, onPendingChange }: { relationshipId: string; disabled?: boolean; onPendingChange?: (isPending: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [endDate, setEndDate] = useState("");
  const mutation = useMarkRelationshipOutdated();
  usePendingNotification(mutation.isPending, onPendingChange);

  if (!open) {
    return <button className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold disabled:opacity-60" disabled={disabled} onClick={() => setOpen(true)} type="button">Mark as past</button>;
  }

  return (
    <form
      className="col-span-full rounded-lg border border-border bg-background p-4"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate({ relationshipId, endDate: endDate || null, datePrecision: endDate ? "exact" : "unknown" }, { onSuccess: () => setOpen(false) });
      }}
      role="dialog"
    >
      <h4 className="font-semibold">Mark this relationship as past?</h4>
      <label className="mt-3 block text-sm font-medium">End date (optional)<input className="mt-1 min-h-11 w-full rounded-md border border-input bg-background px-3" disabled={mutation.isPending} onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} /></label>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button className="min-h-11 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-60" disabled={mutation.isPending} type="submit">{mutation.isPending ? "Saving…" : "Mark as past"}</button>
        <button className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold" disabled={mutation.isPending} onClick={() => setOpen(false)} type="button">Cancel</button>
      </div>
      {mutation.isError ? <p className="mt-3 text-sm text-destructive" role="alert">{mutation.error.message}</p> : null}
    </form>
  );
}
