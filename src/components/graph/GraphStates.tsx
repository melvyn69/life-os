import { Link } from "react-router-dom";

export function GraphEmptyState({ children }: { children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
      <h2 className="text-lg font-semibold">No graph focus yet</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Choose an entity to explore its current relationships.
      </p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}

export function GraphLoadingState() {
  return (
    <div aria-label="Loading Life Graph" className="space-y-4" role="status">
      <div className="h-20 animate-pulse rounded-lg bg-muted" />
      <div className="h-80 animate-pulse rounded-xl bg-muted" />
      <div className="h-28 animate-pulse rounded-lg bg-muted" />
    </div>
  );
}

export function GraphErrorState({ permissionDenied = false }: { permissionDenied?: boolean }) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-sm text-destructive" role="alert">
      <p className="font-semibold">{permissionDenied ? "Graph unavailable" : "Unable to load the graph"}</p>
      <p className="mt-2 leading-6">
        {permissionDenied
          ? "You do not have permission to view this focus."
          : "Keep the current page open and try again when the connection is available."}
      </p>
      <Link className="mt-3 inline-flex min-h-11 items-center underline" to="/graph">Choose another focus</Link>
    </div>
  );
}
