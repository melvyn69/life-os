import type { GraphFiltersValue } from "@/types/graph";

export function GraphFilters({
  value,
  onChange
}: {
  value: GraphFiltersValue;
  onChange: (value: GraphFiltersValue) => void;
}) {
  return (
    <fieldset className="rounded-lg border border-border bg-card p-4">
      <legend className="px-1 text-sm font-semibold">Graph filters</legend>
      <div className="mt-1 grid gap-3 sm:grid-cols-3">
        <FilterCheckbox
          checked={value.includeSuggestions}
          label="Suggestions"
          onChange={(checked) => onChange({ ...value, includeSuggestions: checked })}
        />
        <FilterCheckbox
          checked={value.includeHistorical}
          label="Past relationships"
          onChange={(checked) => onChange({ ...value, includeHistorical: checked })}
        />
        <label className="flex min-h-11 items-center justify-between gap-3 text-sm">
          <span>Depth</span>
          <select
            aria-label="Graph depth"
            className="min-h-10 rounded-md border border-input bg-background px-3"
            onChange={(event) => onChange({ ...value, depth: event.target.value === "2" ? 2 : 1 })}
            value={value.depth}
          >
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </label>
      </div>
    </fieldset>
  );
}

function FilterCheckbox({
  checked,
  label,
  onChange
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 items-center gap-3 text-sm">
      <input
        checked={checked}
        className="size-5 accent-primary"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}
