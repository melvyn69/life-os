import { useState } from "react";
import { useCorrectRelationship } from "@/hooks/useRelationships";
import { usePendingNotification } from "@/hooks/usePendingNotification";
import type { Relationship, RelationshipEntity, RelationshipType } from "@/types/relationships";

const relationshipTypes: RelationshipType[] = [
  "participates_in",
  "affiliated_with",
  "located_at",
  "temporally_associated_with",
  "concerns",
  "contributes_to",
  "created",
  "contextually_associated_with"
];

export function CorrectRelationshipForm({
  relationship,
  sourceEntity,
  targetEntity,
  disabled = false,
  onPendingChange,
  onDone
}: {
  relationship: Relationship;
  sourceEntity: RelationshipEntity;
  targetEntity: RelationshipEntity;
  disabled?: boolean;
  onPendingChange?: (isPending: boolean) => void;
  onDone: () => void;
}) {
  const mutation = useCorrectRelationship();
  usePendingNotification(mutation.isPending, onPendingChange);
  const [type, setType] = useState<RelationshipType>(relationship.relationship_type);
  const [startDate, setStartDate] = useState(relationship.start_date ?? "");
  const [endDate, setEndDate] = useState(relationship.end_date ?? "");
  const [reason, setReason] = useState("");
  const [sourceEntityId, setSourceEntityId] = useState(relationship.source_entity_id);
  const targetEntityId = sourceEntityId === sourceEntity.id ? targetEntity.id : sourceEntity.id;

  return (
    <form
      className="space-y-3 rounded-lg border border-border bg-background p-4"
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate({
          relationshipId: relationship.id,
          relationshipType: type,
          sourceEntityId,
          targetEntityId,
          startDate: startDate || null,
          endDate: endDate || null,
          datePrecision: startDate || endDate ? "exact" : "unknown",
          reason: reason.trim() || null
        }, { onSuccess: onDone });
      }}
    >
      <h4 className="font-semibold">Correct relationship</h4>
      <label className="block text-sm font-medium">
        Type
        <select
          className="mt-1 min-h-11 w-full rounded-md border border-input bg-background px-3"
          disabled={disabled || mutation.isPending}
          onChange={(event) => setType(readRelationshipTypeInput(event.target.value))}
          value={type}
        >
          {relationshipTypes.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
        </select>
      </label>
      {type !== "contextually_associated_with" ? (
        <fieldset className="rounded-md border border-border p-3">
          <legend className="px-1 text-sm font-medium">Direction</legend>
          <label className="mt-2 flex min-h-11 items-center gap-3 text-sm">
            <input
              checked={sourceEntityId === sourceEntity.id}
              className="size-5 accent-primary"
              disabled={disabled || mutation.isPending}
              name={`relationship-direction-${relationship.id}`}
              onChange={() => setSourceEntityId(sourceEntity.id)}
              type="radio"
            />
            {sourceEntity.name} → {targetEntity.name}
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <input
              checked={sourceEntityId === targetEntity.id}
              className="size-5 accent-primary"
              disabled={disabled || mutation.isPending}
              name={`relationship-direction-${relationship.id}`}
              onChange={() => setSourceEntityId(targetEntity.id)}
              type="radio"
            />
            {targetEntity.name} → {sourceEntity.name}
          </label>
        </fieldset>
      ) : null}
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm font-medium">Start date<input className="mt-1 min-h-11 w-full rounded-md border border-input bg-background px-3" disabled={disabled || mutation.isPending} onChange={(event) => setStartDate(event.target.value)} type="date" value={startDate} /></label>
        <label className="text-sm font-medium">End date<input className="mt-1 min-h-11 w-full rounded-md border border-input bg-background px-3" disabled={disabled || mutation.isPending} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} type="date" value={endDate} /></label>
      </div>
      <label className="block text-sm font-medium">Reason (optional)<textarea className="mt-1 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2" disabled={disabled || mutation.isPending} maxLength={500} onChange={(event) => setReason(event.target.value)} value={reason} /></label>
      <p className="text-xs leading-5 text-muted-foreground">The prior state and all earlier evidence remain in history. The corrected state becomes confirmed.</p>
      <div className="grid grid-cols-2 gap-2">
        <button className="min-h-11 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground disabled:opacity-60" disabled={disabled || mutation.isPending} type="submit">{mutation.isPending ? "Saving…" : "Save correction"}</button>
        <button className="min-h-11 rounded-md border border-border px-3 text-sm font-semibold" disabled={mutation.isPending} onClick={onDone} type="button">Cancel</button>
      </div>
      {mutation.isError ? <p className="text-sm text-destructive" role="alert">{mutation.error.message}</p> : null}
    </form>
  );
}

function readRelationshipTypeInput(value: string): RelationshipType {
  switch (value) {
    case "participates_in":
    case "affiliated_with":
    case "located_at":
    case "temporally_associated_with":
    case "concerns":
    case "contributes_to":
    case "created":
    case "contextually_associated_with":
      return value;
    default:
      throw new Error("Invalid relationship type.");
  }
}
