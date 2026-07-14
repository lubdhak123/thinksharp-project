"use client";

import type { Filters } from "@/lib/types";

type FilterBarProps = {
  filters: Filters;
  options: {
    people: string[];
    programmes: string[];
    projectTypes: string[];
    locations: string[];
    staff: string[];
  };
  onChange: (filters: Filters) => void;
};

export function FilterBar({ filters, options, onChange }: FilterBarProps) {
  const update = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value });

  return (
    <section className="no-print grid gap-4 rounded-none border border-border bg-white p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-9 items-end">
      <label className="grid gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-mist">Search Name</span>
        <input
          className="rounded-none border border-border px-3 py-2 text-sm h-10 bg-white"
          value={filters.search ?? ""}
          onChange={(event) => update("search", event.target.value)}
          placeholder="Type a name"
        />
      </label>
      <Select label="Volunteer / Intern" value={filters.person} options={options.people} onChange={(value) => update("person", value)} />
      <Select label="Programme" value={filters.programme} options={options.programmes} onChange={(value) => update("programme", value)} />
      <Select label="Project / Work Type" value={filters.projectType} options={options.projectTypes} onChange={(value) => update("projectType", value)} />
      <Select label="Location" value={filters.location} options={options.locations} onChange={(value) => update("location", value)} />
      <Select label="Staff In-Charge" value={filters.staff} options={options.staff} onChange={(value) => update("staff", value)} />
      <label className="grid gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-mist">From</span>
        <input className="rounded-none border border-border px-3 py-2 text-sm h-10 bg-white" type="date" value={filters.from ?? ""} onChange={(event) => update("from", event.target.value)} />
      </label>
      <label className="grid gap-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-mist">To</span>
        <input className="rounded-none border border-border px-3 py-2 text-sm h-10 bg-white" type="date" value={filters.to ?? ""} onChange={(event) => update("to", event.target.value)} />
      </label>
      <button className="h-10 border border-border bg-white px-4 text-sm font-semibold text-ink hover:border-brand hover:text-brand transition-all active:bg-brand-light/45" type="button" onClick={() => onChange({})}>
        Reset
      </button>

    </section>
  );
}

function Select({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value?: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[11px] font-bold uppercase tracking-wider text-mist">{label}</span>
      <select className="rounded-none border border-border px-3 py-2 text-sm h-10 bg-white" value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
