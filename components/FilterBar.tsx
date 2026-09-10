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
    <section className="no-print border border-border bg-white p-6 rounded-2xl shadow-soft font-display text-left flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-1">
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-brand flex items-center gap-1.5">
            <span>⚡</span> Analysis Controls
          </h3>
          <p className="text-[11px] text-mist font-semibold mt-0.5">Filter records and update visualizations dynamically.</p>
        </div>
        <button 
          className="h-8 border border-border hover:border-brand hover:text-brand bg-white px-4 text-xs font-bold uppercase tracking-wider transition-all rounded-lg" 
          type="button" 
          onClick={() => onChange({})}
        >
          Reset Filters
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 items-end">
        <label className="grid gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mist flex items-center gap-1">👤 Search Name</span>
          <input
            className="rounded-lg border border-border px-3 py-2 text-xs h-9 bg-white transition-all focus:border-brand focus:outline-none"
            value={filters.search ?? ""}
            onChange={(event) => update("search", event.target.value)}
            placeholder="e.g. Lubdhak"
          />
        </label>
        <Select label="👤 Member" icon="👥" value={filters.person} options={options.people} onChange={(value) => update("person", value)} />
        <Select label="📁 Programme" icon="📁" value={filters.programme} options={options.programmes} onChange={(value) => update("programme", value)} />
        <Select label="⚡ Project / Work" icon="🎯" value={filters.projectType} options={options.projectTypes} onChange={(value) => update("projectType", value)} />
        <Select label="📍 Location" icon="📍" value={filters.location} options={options.locations} onChange={(value) => update("location", value)} />
        <Select label="👤 Staff In-Charge" icon="👤" value={filters.staff} options={options.staff} onChange={(value) => update("staff", value)} />
        <label className="grid gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mist flex items-center gap-1">📅 From Date</span>
          <input className="rounded-lg border border-border px-3 py-2 text-xs h-9 bg-white transition-all focus:border-brand focus:outline-none" type="date" value={filters.from ?? ""} onChange={(event) => update("from", event.target.value)} />
        </label>
        <label className="grid gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mist flex items-center gap-1">📅 To Date</span>
          <input className="rounded-lg border border-border px-3 py-2 text-xs h-9 bg-white transition-all focus:border-brand focus:outline-none" type="date" value={filters.to ?? ""} onChange={(event) => update("to", event.target.value)} />
        </label>
      </div>
    </section>
  );
}

function Select({
  label,
  icon,
  value,
  options,
  onChange
}: {
  label: string;
  icon?: string;
  value?: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1">
      <span className="text-[10px] font-bold uppercase tracking-wider text-mist flex items-center gap-1">
        {icon && <span>{icon}</span>}
        {label}
      </span>
      <select className="rounded-lg border border-border px-3 py-2 text-xs h-9 bg-white transition-all focus:border-brand focus:outline-none" value={value ?? ""} onChange={(event) => onChange(event.target.value)}>
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

