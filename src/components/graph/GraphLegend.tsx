export function GraphLegend() {
  return (
    <details className="rounded-lg border border-border bg-card p-4 text-sm">
      <summary className="cursor-pointer font-semibold">Graph legend</summary>
      <ul className="mt-3 space-y-2 text-muted-foreground">
        <li><span className="font-medium text-foreground">Solid line:</span> supported or confirmed relationship</li>
        <li><span className="font-medium text-foreground">Dashed line:</span> suggestion, not a fact</li>
        <li><span className="font-medium text-foreground">Arrow:</span> directional relationship</li>
      </ul>
    </details>
  );
}
