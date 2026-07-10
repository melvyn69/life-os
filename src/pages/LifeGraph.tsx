import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FocusedGraph } from "@/components/graph/FocusedGraph";
import { GraphEmptyState, GraphErrorState, GraphLoadingState } from "@/components/graph/GraphStates";
import { AuthRequiredState } from "@/components/common/AuthRequiredState";
import { useGraphEntitySearch, useInitialGraphFocus } from "@/hooks/useFocusedGraph";
import { isAuthRequiredError } from "@/lib/errors";

export function LifeGraphPage() {
  const { entityId } = useParams();
  const navigate = useNavigate();
  const initialFocus = useInitialGraphFocus();
  const [search, setSearch] = useState("");
  const entitySearch = useGraphEntitySearch(search, !entityId && initialFocus.data === null);

  useEffect(() => {
    if (!entityId && initialFocus.data) {
      navigate(`/graph/${initialFocus.data}`, { replace: true });
    }
  }, [entityId, initialFocus.data, navigate]);

  if (entityId) {
    return (
      <section className="space-y-5">
        <GraphPageHeader />
        <FocusedGraph entityId={entityId} />
      </section>
    );
  }

  if (initialFocus.isLoading || (initialFocus.data && !entityId)) {
    return <GraphLoadingState />;
  }

  if (initialFocus.isError) {
    if (isAuthRequiredError(initialFocus.error)) {
      return <AuthRequiredState />;
    }
    return <GraphErrorState />;
  }

  return (
    <section className="space-y-5">
      <GraphPageHeader />
      <GraphEmptyState>
        <label className="block text-left text-sm font-medium" htmlFor="graph-entity-search">Search entities</label>
        <input
          className="mt-2 min-h-11 w-full rounded-md border border-input bg-background px-3"
          id="graph-entity-search"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Entity name"
          value={search}
        />
        {entitySearch.isFetching ? <p className="mt-3 text-sm text-muted-foreground">Searching…</p> : null}
        <ul className="mt-3 space-y-2 text-left">
          {(entitySearch.data ?? []).map((entity) => (
            <li key={entity.id}>
              <Link className="flex min-h-11 items-center justify-between rounded-md border border-border px-3 text-sm font-semibold" to={`/graph/${entity.id}`}>
                <span>{entity.name}</span><span className="text-xs font-normal text-muted-foreground">{entity.type}</span>
              </Link>
            </li>
          ))}
        </ul>
      </GraphEmptyState>
    </section>
  );
}

function GraphPageHeader() {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold">Life Graph</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Explore a focused, evidence-backed view. Suggestions remain clearly tentative.</p>
      </div>
      <Link className="min-h-11 shrink-0 rounded-md border border-border px-3 py-2 text-sm font-semibold" to="/relationships/review">Review</Link>
    </header>
  );
}
