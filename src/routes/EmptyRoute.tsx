type EmptyRouteProps = {
  title: string;
  description: string;
};

export function EmptyRoute({ title, description }: EmptyRouteProps) {
  return (
    <section className="rounded-lg border border-border bg-card p-5 text-card-foreground shadow-sm">
      <div className="mb-10 h-1 w-12 rounded-full bg-primary" aria-hidden="true" />
      <h2 className="text-2xl font-semibold tracking-normal">{title}</h2>
      <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
    </section>
  );
}
