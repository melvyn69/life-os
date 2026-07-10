import { ShieldAlert } from "lucide-react";
import type { RelationshipSensitivity } from "@/types/relationships";

export function RelationshipSensitivityNotice({
  sensitivity
}: {
  sensitivity: RelationshipSensitivity;
}) {
  if (sensitivity === "normal") {
    return null;
  }

  return (
    <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-900">
      <ShieldAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <p>
        {sensitivity === "highly_sensitive" ? "Highly sensitive" : "Sensitive"} relationship. It stays out of automatic graph suggestions and requires deliberate review.
      </p>
    </div>
  );
}
