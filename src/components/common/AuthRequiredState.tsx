type AuthRequiredStateProps = {
  title?: string;
};

export function AuthRequiredState({ title = "Sign in required" }: AuthRequiredStateProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="mb-10 h-1 w-12 rounded-full bg-primary" aria-hidden="true" />
      <h2 className="text-2xl font-semibold tracking-normal">{title}</h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
        Sign in to review your captures, suggestions, entities, and memories.
      </p>
    </section>
  );
}
