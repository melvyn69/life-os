import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export function ExploreFromEntityButton({ entityId }: { entityId: string }) {
  return (
    <Link
      className="inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-semibold text-primary outline-none hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring"
      to={`/graph/${entityId}`}
    >
      Explore from this entity
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  );
}
