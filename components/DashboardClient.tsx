"use client";

import { toPng } from "html-to-image";
import { Download, FileText, ImageIcon, RefreshCw, X, TrendingUp, Award, Clock, Users, BookOpen, User, CheckCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { ActivityTrendChart, ActivityTypeChart, ContributorChart, HoursChart } from "@/components/charts/DashboardCharts";
import { FilterBar } from "@/components/FilterBar";
import { ImpactCard } from "@/components/ImpactCard";
import { RecordsTable } from "@/components/RecordsTable";
import { StatCard } from "@/components/StatCard";
import type { DashboardView, Granularity } from "@/lib/constants";
import { exportActivitiesToExcel, exportSummaryToPdf } from "@/lib/export";
import { activitiesByType, distinctOptions, fetchActivities, filterByView, getTotalHours, impactStats, staffOverseen, summarize, topContributors, trend, useDemoMode } from "@/lib/queries";
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
  const [lastUpdatedSecs, setLastUpdatedSecs] = useState(0);
  const impactCardRef = useRef<HTMLDivElement>(null);
  const demoMode = useDemoMode();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRecords(await fetchActivities(filters));
      setAnimKey((k) => k + 1);
      setFlashing(true);
      setLastUpdatedSecs(0);
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
    const interval = setInterval(() => {
      setLastUpdatedSecs((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

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

  // Compute V2 Executive Insights Panel (Read-only logic using useMemo)
  const topVolunteer = useMemo(() => {
    const contributor = contributorData[0];
    return contributor ? contributor.name : "N/A";
  }, [contributorData]);

  const mostActiveProgramme = useMemo(() => {
    const counts: Record<string, number> = {};
    scopedRecords.forEach(r => {
      const name = r.programme_name || r.milestone;
      if (name) counts[name] = (counts[name] || 0) + 1;
    });
    let best = "N/A";
    let max = 0;
    Object.entries(counts).forEach(([name, val]) => {
      if (val > max) {
        max = val;
        best = name;
      }
    });
    return best;
  }, [scopedRecords]);

  const avgHours = useMemo(() => {
    if (scopedRecords.length === 0) return "0.0";
    const totalHours = scopedRecords.reduce((sum, r) => sum + getTotalHours(r), 0);
    return (totalHours / scopedRecords.length).toFixed(1);
  }, [scopedRecords]);

  const mostActiveStaff = useMemo(() => {
    const counts: Record<string, number> = {};
    scopedRecords.forEach(r => {
      if (r.staff_in_charge) counts[r.staff_in_charge] = (counts[r.staff_in_charge] || 0) + 1;
    });
    let best = "N/A";
    let max = 0;
    Object.entries(counts).forEach(([name, val]) => {
      if (val > max) {
        max = val;
        best = name;
      }
    });
    return best;
  }, [scopedRecords]);

  // Generate V2 30-day activity heatmap dataset
  const last30Days = useMemo(() => {
    const days = [];
    const counts: Record<string, number> = {};
    
    scopedRecords.forEach(r => {
      if (r.activity_date) counts[r.activity_date] = (counts[r.activity_date] || 0) + 1;
    });

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const formatted = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      days.push({
        dateStr,
        formatted,
        count: counts[dateStr] || 0
      });
    }
    return days;
  }, [scopedRecords]);

  const formatLastUpdated = (secs: number) => {
    if (secs < 5) return "Just now";
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    return `${mins}m ago`;
  };

  return (
    <div className="grid gap-6 text-left">
      {demoMode && (
        <div className="border border-border bg-brand-light p-4 text-sm font-semibold text-ink rounded-xl">
          💡 Note: Showing demo data. Supabase environment keys are not configured yet in .env.local.
        </div>
      )}

      {/* Premium Dark Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111] to-[#222] p-8 text-white border border-brand/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6 relative z-10">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand bg-brand/10 border border-brand/20 px-3 py-1 rounded-full">
              ORGANISATION ANALYTICS
            </span>
            <h1 className="mt-2 text-2xl md:text-3xl font-display font-black tracking-tight text-white">
              ThinkSharp Foundation Impact Dashboard
            </h1>
            <p className="text-xs text-mist font-semibold mt-1 flex items-center gap-1.5">
              Last Updated: {formatLastUpdated(lastUpdatedSecs)}
              <span className="w-1.5 h-1.5 rounded-full bg-[#167241] inline-block animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#167241]">LIVE</span>
            </p>
          </div>
          
          {/* Action Tabs & Controls Inside Dark Hero */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!recordsOnly && (
              <div className="flex bg-[#222] border border-white/10 p-1 rounded-xl">
                {tabs.map((tab) => {
                  const isActive = view === tab.id;
                  return (
                    <button
                      key={tab.id}
                      className={`px-4 py-1.5 text-xs font-black tracking-wider uppercase transition-all rounded-lg outline-none focus:outline-none ${
                        isActive
                          ? "bg-brand text-white shadow-lg shadow-brand/20"
                          : "text-white/60 hover:text-white"
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
          </div>
        </div>

        {/* Hero Today's Impact Numbers strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 relative z-10 font-display">
          <div>
            <span className="text-[10px] font-bold text-mist/60 uppercase tracking-widest block">Beneficiaries</span>
            <strong className="text-3xl md:text-4xl font-black text-white mt-1 block tracking-tight">
              {summary.beneficiariesImpacted.toLocaleString("en-IN")}
            </strong>
          </div>
          <div>
            <span className="text-[10px] font-bold text-mist/60 uppercase tracking-widest block">Volunteer Hours</span>
            <strong className="text-3xl md:text-4xl font-black text-white mt-1 block tracking-tight">
              {summary.volunteerHours.toLocaleString("en-IN")}
            </strong>
          </div>
          <div>
            <span className="text-[10px] font-bold text-mist/60 uppercase tracking-widest block">Active Members</span>
            <strong className="text-3xl md:text-4xl font-black text-white mt-1 block tracking-tight">
              {(summary.activeVolunteers + summary.activeInterns).toLocaleString("en-IN")}
            </strong>
          </div>
          <div>
            <span className="text-[10px] font-bold text-mist/60 uppercase tracking-widest block">Programmes Tracked</span>
            <strong className="text-3xl md:text-4xl font-black text-white mt-1 block tracking-tight">
              {options.programmes.length}
            </strong>
          </div>
        </div>
      </div>

      {/* Modernized Operations Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 font-display">
        <h2 className="text-xs font-black uppercase tracking-widest text-brand flex items-center gap-1.5">
          <span>📈</span> Dashboard Operations
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-press inline-flex items-center gap-2 border border-border bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink hover:border-brand hover:text-brand transition-all rounded-xl shadow-xs" type="button" onClick={load}>
            <RefreshCw size={14} className="text-brand" />
            Refresh
          </button>
          <button className="btn-press inline-flex items-center gap-2 border border-border bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink hover:border-brand hover:text-brand transition-all rounded-xl shadow-xs" type="button" onClick={() => exportActivitiesToExcel(scopedRecords)}>
            <Download size={14} className="text-brand" />
            ⬇ Export Excel
          </button>
          <button className="btn-press inline-flex items-center gap-2 border border-border bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink hover:border-brand hover:text-brand transition-all rounded-xl shadow-xs" type="button" onClick={() => exportSummaryToPdf(summary, scopedRecords, view)}>
            <FileText size={14} className="text-brand" />
            📄 Export PDF
          </button>
          {!recordsOnly && (
            <button className="btn-press inline-flex items-center gap-2 border border-brand bg-brand px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink transition-all rounded-xl shadow-md shadow-brand/20" type="button" onClick={() => setShareOpen(true)}>
              <ImageIcon size={14} />
              🔗 Share Report
            </button>
          )}
        </div>
      </div>

      <FilterBar filters={filters} options={options} onChange={setFilters} />

      {error && <div className="border border-clay bg-brand-light p-3 text-sm font-bold text-clay rounded-xl">{error}</div>}
      {loading && <div className="border border-border bg-white p-4 text-xs font-bold text-mist rounded-xl">Loading live activity analytics...</div>}

      {!recordsOnly && (
        <>
          {/* Animated KPI cards */}
          <div key={`kpi-${view}`} className="grid gap-4 animate-fade-in">
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

          {/* Redesigned Chart Sections with Gaps and Rounded Borders */}
          <div className="grid gap-6 lg:grid-cols-2 font-display">
            <Panel title={view === "intern" ? "🥇 Top Intern Contributors" : "🥇 Top Volunteer Contributors"}>
              <ContributorChart data={contributorData} animKey={animKey} />
            </Panel>
            <Panel title="📊 Activities by Category Type">
              <ActivityTypeChart data={typeData} />
            </Panel>
            <Panel title={view === "intern" ? "⏰ Monthly Internship Hours" : "⏰ Monthly Volunteer Hours"}>
              <div className="flex justify-between items-center mb-3">
                <GranularityToggle value={granularity} onChange={setGranularity} />
              </div>
              <HoursChart data={trendData} />
            </Panel>
            <Panel title={view === "intern" ? "📈 Internship Trend" : "📈 Volunteer Trend"}>
              <ActivityTrendChart data={trendData} label="Activity Count" />
            </Panel>
            {view === "overall" && (
              <div className="lg:col-span-2">
                <Panel title="👥 Activities Overseen by Staff">
                  <ContributorChart data={staffOverseenData} animKey={animKey} unit="activities" />
                </Panel>
              </div>
            )}
          </div>

          {/* Quick Insights + Activity Heatmap panel */}
          <div className="grid gap-6 md:grid-cols-12 font-display">
            <div className="md:col-span-5">
              <article className="rounded-2xl border border-border bg-white p-6 shadow-sm min-h-[250px] text-left">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand flex items-center gap-1.5 border-b border-border/60 pb-3 mb-4">
                  <span>📌</span> Quick Insights
                </h3>
                <ul className="flex flex-col gap-3 text-xs text-ink font-semibold">
                  <li className="flex justify-between items-center">
                    <span className="text-mist">Top contributor:</span>
                    <strong className="text-brand">{topVolunteer}</strong>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-mist">Most active programme:</span>
                    <strong>{mostActiveProgramme}</strong>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-mist">Total beneficiaries:</span>
                    <strong className="text-brand">{summary.beneficiariesImpacted.toLocaleString("en-IN")}</strong>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-mist">Avg hours per activity:</span>
                    <strong>{avgHours} hrs</strong>
                  </li>
                  <li className="flex justify-between items-center">
                    <span className="text-mist">Most active staff:</span>
                    <strong className="text-brand">{mostActiveStaff}</strong>
                  </li>
                </ul>
              </article>
            </div>
            <div className="md:col-span-7">
              <article className="rounded-2xl border border-border bg-white p-6 shadow-sm min-h-[250px] text-left">
                <h3 className="text-xs font-black uppercase tracking-wider text-brand flex items-center gap-1.5 border-b border-border/60 pb-3 mb-4">
                  <span>📅</span> Activity Heatmap (Last 30 Days)
                </h3>
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                  {last30Days.map((day) => {
                    let levelClass = "bg-paper border-border/40 hover:border-mist";
                    if (day.count === 1) levelClass = "bg-brand/10 border-brand/20 hover:bg-brand/25";
                    if (day.count === 2) levelClass = "bg-brand/35 border-brand/40 hover:bg-brand/50";
                    if (day.count >= 3) levelClass = "bg-brand text-white hover:bg-ink";
                    return (
                      <div
                        key={day.dateStr}
                        className={`h-9 rounded-lg border flex flex-col justify-center items-center cursor-default transition-all ${levelClass}`}
                        title={`${day.formatted}: ${day.count} activities`}
                      >
                        <span className="text-[9px] font-black">{day.formatted.split(" ")[0]}</span>
                        <span className="text-[8px] font-bold opacity-80">{day.formatted.split(" ")[1]}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex justify-between items-center text-[10px] text-mist font-bold uppercase tracking-wide">
                  <span>Less active</span>
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2.5 h-2.5 rounded bg-paper border border-border inline-block" />
                    <span className="w-2.5 h-2.5 rounded bg-brand/10 inline-block" />
                    <span className="w-2.5 h-2.5 rounded bg-brand/35 inline-block" />
                    <span className="w-2.5 h-2.5 rounded bg-brand inline-block" />
                  </div>
                  <span>More active</span>
                </div>
              </article>
            </div>
          </div>
        </>
      )}

      {/* Submitted Activities List */}
      <section className="grid gap-3">
        <div className="flex items-center justify-between border-b border-border/65 pb-2">
          <h2 className="text-xs font-black uppercase tracking-widest text-brand flex items-center gap-1.5">
            <span>📋</span> Submitted Activities Log
          </h2>
          <p className="text-xs font-extrabold text-mist">{scopedRecords.length.toLocaleString("en-IN")} records found</p>
        </div>
        <RecordsTable records={scopedRecords} />
      </section>

      {/* Share Snapshot Dialog Panel */}
      {shareOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-xs p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-auto border border-border bg-paper p-6 rounded-2xl shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-border/60 pb-3">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-brand">Shareable Impact Card</p>
                <h2 className="mt-1 text-xl font-display font-black tracking-tight text-ink">Create a PNG snapshot</h2>
              </div>
              <button className="rounded-lg border border-border bg-white p-2 text-ink hover:border-brand hover:text-brand hover:shadow-xs transition-all" type="button" onClick={() => setShareOpen(false)} aria-label="Close share impact panel">
                <X size={18} />
              </button>
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
              <label className="grid gap-1 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-mist">Period</span>
                <select className="h-9 border border-border bg-white px-3 text-xs rounded-lg focus:border-brand focus:outline-none" value={sharePeriod} onChange={(event) => setSharePeriod(event.target.value as SharePeriod)}>
                  <option value="month">This month</option>
                  <option value="quarter">This quarter</option>
                  <option value="year">This year</option>
                  <option value="custom">Custom range</option>
                </select>
              </label>
              <label className="grid gap-1 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-mist">From</span>
                <input className="h-9 border border-border bg-white px-3 text-xs rounded-lg focus:border-brand focus:outline-none disabled:bg-paper" type="date" disabled={sharePeriod !== "custom"} value={customRange.from} onChange={(event) => setCustomRange((range) => ({ ...range, from: event.target.value }))} />
              </label>
              <label className="grid gap-1 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-mist">To</span>
                <input className="h-9 border border-border bg-white px-3 text-xs rounded-lg focus:border-brand focus:outline-none disabled:bg-paper" type="date" disabled={sharePeriod !== "custom"} value={customRange.to} onChange={(event) => setCustomRange((range) => ({ ...range, to: event.target.value }))} />
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
    <article className="rounded-2xl border border-border bg-white p-6 shadow-sm text-left">
      <h2 className="mb-4 text-xs font-black text-brand uppercase tracking-widest border-b border-border/60 pb-3">{title}</h2>
      {children}
    </article>
  );
}

function GranularityToggle({ value, onChange }: { value: Granularity; onChange: (value: Granularity) => void }) {
  return (
    <div className="no-print inline-flex border border-border bg-paper p-1 gap-1 font-display rounded-lg">
      {(["month", "year"] as Granularity[]).map((option) => {
        const isActive = value === option;
        return (
          <button
            key={option}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors border rounded-md ${
              isActive
                ? "bg-white border-border text-brand font-bold shadow-xs"
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
