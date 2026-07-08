type MobileHeaderProps = {
  title: string;
};

export function MobileHeader({ title }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 px-5 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase text-muted-foreground">Life OS</p>
          <h1 className="mt-1 text-xl font-semibold tracking-normal text-foreground">{title}</h1>
        </div>
        <div className="grid h-9 w-9 place-items-center rounded-md border border-border bg-accent text-xs font-semibold text-accent-foreground">
          LO
        </div>
      </div>
    </header>
  );
}
