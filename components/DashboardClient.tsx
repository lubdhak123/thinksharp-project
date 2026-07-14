"use client";

import { toPng } from "html-to-image";
import { Download, FileText, ImageIcon, RefreshCw, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ActivityTrendChart, ActivityTypeChart, ContributorChart, HoursChart } from "@/components/charts/DashboardCharts";
import { FilterBar } from "@/components/FilterBar";
import { ImpactCard } from "@/components/ImpactCard";
import { RecordsTable } from "@/components/RecordsTable";
import { StatCard } from "@/components/StatCard";
import type { DashboardView, Granularity } from "@/lib/constants";
import { exportActivitiesToExcel, exportSummaryToPdf } from "@/lib/export";
import { activitiesByType, distinctOptions, fetchActivities, filterByView, impactStats, staffOverseen, summarize, topContributors, trend, useDemoMode } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import type { Activity, Filters } from "@/lib/types";

const tabs: { id: DashboardView; label: string }[] = [
  { id: "overall", label: "Overall" },
  { id: "volunteer", label: "Volunteer" },
  { id: "intern", label: "Intern" }
];

type SharePeriod = "month" | "quarter" | "year" | "custom";

export function DashboardClient({ recordsOnly = false }: { recordsOnly?: boolean }) {
  const [records, setRecords] = useState<Activity[]>([]);
  const [filters, setFilters] = useState<Filters>({});
  const [view, setView] = useState<DashboardView>("overall");
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [shareOpen, setShareOpen] = useState(false);
  const [sharePeriod, setSharePeriod] = useState<SharePeriod>("quarter");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [imageBusy, setImageBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [animKey, setAnimKey] = useState(0);      // increments to replay animations
  const [flashing, setFlashing] = useState(false); // briefly true after refresh
  const impactCardRef = useRef<HTMLDivElement>(null);
  const demoMode = useDemoMode();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRecords(await fetchActivities(filters));
      // Replay all animations and flash numbers
      setAnimKey((k) => k + 1);
      setFlashing(true);
      setTimeout(() => setFlashing(false), 800);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load records.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    const channel = client
      .channel("activities-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, () => load())
      .subscribe();

    return () => {
      void client.removeChannel(channel);
    };
  }, [load]);

  const options = useMemo(() => distinctOptions(records), [records]);
  const scopedRecords = useMemo(() => filterByView(records, view), [records, view]);
  const summary = useMemo(() => summarize(scopedRecords), [scopedRecords]);
  const contributorData = useMemo(() => topContributors(scopedRecords), [scopedRecords]);
  const staffOverseenData = useMemo(() => staffOverseen(scopedRecords), [scopedRecords]);
  const typeData = useMemo(() => activitiesByType(scopedRecords), [scopedRecords]);
  const trendData = useMemo(() => trend(scopedRecords, granularity), [scopedRecords, granularity]);
  const impactPeriod = useMemo(() => getImpactPeriod(sharePeriod, customRange), [sharePeriod, customRange]);
  const impactRecords = useMemo(
    () => scopedRecords.filter((record) => record.activity_date >= impactPeriod.from && record.activity_date <= impactPeriod.to),
    [scopedRecords, impactPeriod]
  );
  const shareStats = useMemo(() => impactStats(impactRecords), [impactRecords]);
  const canShareImpact = useMemo(() => {
    if (typeof navigator === "undefined" || !("canShare" in navigator)) return false;
    try {
      const file = new File([""], "thinksharp-impact.png", { type: "image/png" });
      return navigator.canShare({ files: [file] });
    } catch {
      return false;
    }
  }, []);

  const kpiGroups = useMemo(() => {
    if (view === "overall") {
      return {
        hero: { label: "Total Beneficiaries Impacted", value: summary.beneficiariesImpacted, iconName: "GraduationCap" as const },
        secondary: [
          { label: "Total Active Volunteers", value: summary.activeVolunteers, iconName: "Users" as const },
          { label: "Total Volunteer Hours", value: summary.volunteerHours, iconName: "Clock" as const },
          { label: "Total Trees Planted", value: summary.treesPlanted, iconName: "Trees" as const },
        ],
        ledger: [
          { label: "Total Activities Completed", value: summary.volunteerActivitiesCompleted },
          { label: "Total Projects Completed", value: summary.internProjects },
        ]
      };
    } else if (view === "volunteer") {
      return {
        hero: { label: "Total Trees Planted", value: summary.treesPlanted, iconName: "Trees" as const },
        secondary: [
          { label: "Total Volunteers", value: summary.totalVolunteers, iconName: "Users" as const },
          { label: "Active Volunteers", value: summary.activeVolunteers, iconName: "UserCheck" as const },
          { label: "Hours Completed", value: summary.volunteerHours, iconName: "Clock" as const },
        ],
        ledger: [
          { label: "Activities Conducted", value: summary.activitiesConducted },
          { label: "Beneficiaries Impacted", value: summary.beneficiariesImpacted },
        ]
      };
    } else { // intern
      return {
        hero: { label: "Total Internship Hours", value: summary.internHours, iconName: "Clock" as const },
        secondary: [
          { label: "Total Interns", value: summary.totalInterns, iconName: "Users" as const },
          { label: "Active Interns", value: summary.activeInterns, iconName: "UserCheck" as const },
          { label: "Projects Completed", value: summary.internProjects, iconName: "Briefcase" as const },
        ],
        ledger: [
          { label: "Beneficiaries Impacted", value: summary.beneficiariesImpacted },
          { label: "Activities Conducted", value: summary.activitiesConducted },
        ]
      };
    }
  }, [view, summary]);

  return (
    <div className="grid gap-6">
      {demoMode && (
        <div className="border border-border bg-brand-light p-4 text-sm font-semibold text-ink">
          Note: Showing demo data. Supabase environment keys are not configured yet in .env.local.
        </div>
      )}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 font-display">
        {!recordsOnly && (
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const isActive = view === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`btn-press px-4 py-2 text-sm font-bold tracking-wide border-2 transition-all duration-200 outline-none focus:outline-none ${
                    isActive
                      ? "border-brand text-brand bg-transparent"
                      : "border-transparent text-mist hover:text-ink"
                  }`}
                  type="button"
                  onClick={() => { setView(tab.id); setAnimKey((k) => k + 1); }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live pulse badge */}
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-mist">
            <span className="live-dot w-2 h-2 rounded-full bg-brand inline-block" />
            Live
          </span>
          <button className="btn-press inline-flex items-center gap-2 border border-border bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:text-brand transition-all active:bg-brand-light/45" type="button" onClick={load}>
            <RefreshCw size={15} />
            Refresh
          </button>
          <button className="btn-press inline-flex items-center gap-2 border border-border bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:text-brand transition-all active:bg-brand-light/45" type="button" onClick={() => exportActivitiesToExcel(scopedRecords)}>
            <Download size={15} />
            Excel
          </button>
          <button className="btn-press inline-flex items-center gap-2 border border-border bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:text-brand transition-all active:bg-brand-light/45" type="button" onClick={() => exportSummaryToPdf(summary, scopedRecords, view)}>
            <FileText size={15} />
            PDF
          </button>
          {!recordsOnly && (
            <button className="btn-press inline-flex items-center gap-2 border border-brand bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-ink transition-all" type="button" onClick={() => setShareOpen(true)}>
              <ImageIcon size={15} />
              Share impact
            </button>
          )}
        </div>
      </div>

      <FilterBar filters={filters} options={options} onChange={setFilters} />

      {error && <div className="border border-clay bg-brand-light p-3 text-sm font-bold text-clay">{error}</div>}
      {loading && <div className="border border-border bg-white p-4 text-sm font-semibold text-mist">Loading live activity data...</div>}

      {!recordsOnly && (
        <>
          {/* Hierarchical KPI Grid — crossfades on tab switch */}
          <div key={`kpi-${view}`} className="grid gap-4 animate-fade-in">
            {/* Primary Grid: Hero (span 2) and Secondary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 font-display">
              <div className="sm:col-span-2">
                <StatCard
                  variant="hero"
                  label={kpiGroups.hero.label}
                  value={Number(kpiGroups.hero.value)}
                  iconName={kpiGroups.hero.iconName}
                  index={0}
                  animKey={animKey}
                  flashing={flashing}
                />
              </div>
              {kpiGroups.secondary.map((card, i) => (
                <StatCard
                  key={card.label}
                  variant="secondary"
                  label={card.label}
                  value={Number(card.value)}
                  iconName={card.iconName}
                  index={i + 1}
                  animKey={animKey}
                  flashing={flashing}
                />
              ))}
            </div>

            {/* Ledger Strip Grid */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 font-display">
              {kpiGroups.ledger.map((card, i) => (
                <StatCard
                  key={card.label}
                  variant="ledger"
                  label={card.label}
                  value={Number(card.value)}
                  index={i + 4}
                  animKey={animKey}
                  flashing={flashing}
                />
              ))}
            </div>
          </div>

          <section className="grid gap-4 xl:grid-cols-2">
            <Panel title={view === "intern" ? "Top Intern Contributors" : "Top Volunteer Contributors"}>
              <ContributorChart data={contributorData} animKey={animKey} />
            </Panel>
            <Panel title="Activities by Type">
              <ActivityTypeChart data={typeData} />
            </Panel>
            <Panel title={view === "intern" ? "Monthly Internship Hours" : "Monthly Volunteer Hours"}>
              <div className="flex justify-between items-center mb-3">
                <GranularityToggle value={granularity} onChange={setGranularity} />
              </div>
              <HoursChart data={trendData} />
            </Panel>
            <Panel title={view === "intern" ? "Internship Trend" : "Volunteer Trend"}>
              <ActivityTrendChart data={trendData} label="Activity Count" />
            </Panel>
            {view === "overall" && (
              <div className="xl:col-span-2">
                <Panel title="Activities Overseen by Staff">
                  <ContributorChart data={staffOverseenData} animKey={animKey} unit="activities" />
                </Panel>
              </div>
            )}
          </section>
        </>
      )}

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold tracking-tight">Submitted Activities</h2>
          <p className="text-sm font-semibold text-mist">{scopedRecords.length.toLocaleString("en-IN")} records</p>
        </div>
        <RecordsTable records={scopedRecords} />
      </section>

      {shareOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-auto border border-border bg-paper p-5 shadow-soft">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand">Shareable Impact Card</p>
                <h2 className="mt-1 text-2xl font-display font-bold tracking-tight text-ink">Create a PNG snapshot</h2>
              </div>
              <button className="rounded border border-border bg-white p-2 text-ink hover:border-brand hover:text-brand" type="button" onClick={() => setShareOpen(false)} aria-label="Close share impact panel">
                <X size={18} />
              </button>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <label className="grid gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-mist">Period</span>
                <select className="h-10 border border-border bg-white px-3 text-sm" value={sharePeriod} onChange={(event) => setSharePeriod(event.target.value as SharePeriod)}>
                  <option value="month">This month</option>
                  <option value="quarter">This quarter</option>
                  <option value="year">This year</option>
                  <option value="custom">Custom range</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-mist">From</span>
                <input className="h-10 border border-border bg-white px-3 text-sm disabled:bg-paper" type="date" disabled={sharePeriod !== "custom"} value={customRange.from} onChange={(event) => setCustomRange((range) => ({ ...range, from: event.target.value }))} />
              </label>
              <label className="grid gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-mist">To</span>
                <input className="h-10 border border-border bg-white px-3 text-sm disabled:bg-paper" type="date" disabled={sharePeriod !== "custom"} value={customRange.to} onChange={(event) => setCustomRange((range) => ({ ...range, to: event.target.value }))} />
              </label>
            </div>

            <ImpactCard
              ref={impactCardRef}
              periodLabel={impactPeriod.label}
              stats={shareStats}
              onDownload={() => handleDownloadImpact(impactCardRef, impactPeriod.label, setImageBusy)}
              onShare={() => handleShareImpact(impactCardRef, impactPeriod.label, setImageBusy)}
              canShare={canShareImpact}
              busy={imageBusy}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function getImpactPeriod(period: SharePeriod, customRange: { from: string; to: string }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = toDateInput(now);

  if (period === "year") {
    return { from: `${year}-01-01`, to: `${year}-12-31`, label: `${year}` };
  }

  if (period === "month") {
    const from = new Date(year, month, 1);
    const to = new Date(year, month + 1, 0);
    return { from: toDateInput(from), to: toDateInput(to), label: from.toLocaleDateString("en-IN", { month: "long", year: "numeric" }) };
  }

  if (period === "custom") {
    const from = customRange.from || `${year}-01-01`;
    const to = customRange.to || today;
    return { from, to, label: `${formatShortDate(from)} - ${formatShortDate(to)}` };
  }

  const quarter = Math.floor(month / 3) + 1;
  const from = new Date(year, (quarter - 1) * 3, 1);
  const to = new Date(year, quarter * 3, 0);
  return { from: toDateInput(from), to: toDateInput(to), label: `Q${quarter} ${year}` };
}

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatShortDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

async function cardToFile(ref: RefObject<HTMLDivElement>, periodLabel: string) {
  if (!ref.current) throw new Error("Impact card is not ready.");
  const dataUrl = await toPng(ref.current, { cacheBust: true, pixelRatio: 2, backgroundColor: "#1A1A1A" });
  const blob = await (await fetch(dataUrl)).blob();
  return new File([blob], `thinksharp-impact-${slugify(periodLabel)}.png`, { type: "image/png" });
}

async function handleDownloadImpact(ref: RefObject<HTMLDivElement>, periodLabel: string, setBusy: (busy: boolean) => void) {
  setBusy(true);
  try {
    const file = await cardToFile(ref, periodLabel);
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  } finally {
    setBusy(false);
  }
}

async function handleShareImpact(ref: RefObject<HTMLDivElement>, periodLabel: string, setBusy: (busy: boolean) => void) {
  setBusy(true);
  try {
    const file = await cardToFile(ref, periodLabel);
    await navigator.share({
      title: "ThinkSharp impact snapshot",
      text: `ThinkSharp Foundation impact for ${periodLabel}`,
      files: [file]
    });
  } finally {
    setBusy(false);
  }
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-none border border-border bg-white p-5">
      <h2 className="mb-4 text-lg font-display font-bold text-ink uppercase tracking-wide">{title}</h2>
      {children}
    </article>
  );
}

function GranularityToggle({ value, onChange }: { value: Granularity; onChange: (value: Granularity) => void }) {
  return (
    <div className="no-print inline-flex border border-border bg-paper p-1 gap-1 font-display">
      {(["month", "year"] as Granularity[]).map((option) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-colors border ${
              isActive
                ? "bg-white border-border text-brand font-bold shadow-sm"
                : "bg-transparent border-transparent text-mist hover:text-ink"
            }`}
            type="button"
            onClick={() => onChange(option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
