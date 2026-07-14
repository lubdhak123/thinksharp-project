"use client";

import {
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  ListChecks,
  RefreshCw,
  XCircle,
  Activity,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { applicationStatuses, type ApplicationStatus } from "@/lib/constants";
import { fetchApplications } from "@/lib/applications";
import { fetchActivities } from "@/lib/queries";
import type { Application, Activity as ActivityType } from "@/lib/types";
import { DashboardClient } from "@/components/DashboardClient";
import { StatCard } from "@/components/StatCard";

// ── Types ────────────────────────────────────────────────────────────────────

type AdminTab = "dashboard" | "applications" | "records" | "analytics" | "recent";

// ── Main Component ────────────────────────────────────────────────────────────

export function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [applications, setApplications] = useState<Application[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingActs, setLoadingActs] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [error, setError] = useState("");

  const loadApplications = useCallback(async () => {
    setLoadingApps(true);
    setError("");
    try {
      const data = await fetchApplications();
      setApplications(data);
      setDemoMode(data.some((a) => a.id.startsWith("app-demo-")));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load applications.");
    } finally {
      setLoadingApps(false);
    }
  }, []);

  const loadActivities = useCallback(async () => {
    setLoadingActs(true);
    try {
      const data = await fetchActivities();
      setActivities(data);
    } catch (e) {
      console.error("Could not load activities:", e);
    } finally {
      setLoadingActs(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
    loadActivities();
  }, [loadApplications, loadActivities]);

  function handleRefresh() {
    loadApplications();
    loadActivities();
  }

  // ── Derived stats ──────────────────────────────────────────────────────────
  const appStats = useMemo(() => {
    const volunteers = applications.filter((a) => a.applying_as === "volunteer");
    const interns = applications.filter((a) => a.applying_as === "intern");
    const approved = applications.filter((a) => a.status === "Approved");
    const pending = applications.filter((a) => a.status === "Pending");
    const rejected = applications.filter((a) => a.status === "Rejected");

    return {
      totalVolunteers: volunteers.length,
      totalInterns: interns.length,
      activeVolunteers: volunteers.filter((a) => a.status === "Approved").length,
      activeInterns: interns.filter((a) => a.status === "Approved").length,
      approved: approved.length,
      pending: pending.length,
      rejected: rejected.length,
      total: applications.length,
    };
  }, [applications]);




  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={15} /> },
    { id: "applications", label: "Applications", icon: <FileText size={15} /> },
    { id: "records", label: "Records", icon: <ListChecks size={15} /> },
    { id: "analytics", label: "Analytics", icon: <Activity size={15} /> },
    { id: "recent", label: "Recent Activity", icon: <Clock3 size={15} /> },
  ];

  const loading = loadingApps || loadingActs;
  const animKey = tabs.findIndex((tab) => tab.id === activeTab) + applications.length + activities.length;

  return (
    <div className="grid gap-6">
      {/* Demo banner */}
      {demoMode && (
        <div className="border border-border bg-brand-light p-4 text-sm font-semibold text-ink font-display">
          Showing demo data. Connect Supabase to see live records.
        </div>
      )}

      {error && (
        <div className="border-l-4 border-red-500 bg-red-50 p-4 text-sm text-red-800 font-display">
          {error}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-border pb-0">
        <nav className="flex gap-0" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-xs font-bold uppercase tracking-wide transition-colors font-display ${
                activeTab === tab.id
                  ? "border-brand text-brand"
                  : "border-transparent text-mist hover:text-ink"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Only show refresh on non-dashboard tabs; DashboardClient has its own */}
        {activeTab !== "dashboard" && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 border border-border bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink hover:border-brand hover:text-brand disabled:opacity-50 font-display transition-colors mb-1"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        )}
      </div>

      {/* ── Tab: Dashboard ── Full org analytics with charts */}
      {activeTab === "dashboard" && (
        <section className="animate-fade-in" role="tabpanel">
          <DashboardClient />
        </section>
      )}

      {/* ── Tab: Applications ── */}
      {activeTab === "applications" && (
        <ApplicationsTab
          applications={applications}
          loading={loadingApps}
        />
      )}

      {/* ── Tab: Records ── */}
      {activeTab === "records" && (
        <RecordsTab activities={activities} loading={loadingActs} />
      )}

      {/* ── Tab: Analytics ── */}
      {activeTab === "analytics" && (
        <AnalyticsTab
          applications={applications}
          activities={activities}
          animKey={animKey}
        />
      )}

      {/* ── Tab: Recent Activity ── */}
      {activeTab === "recent" && (
        <RecentTab activities={activities} loading={loadingActs} />
      )}
    </div>
  );
}

// ── Applications Tab ─────────────────────────────────────────────────────────

function ApplicationsTab({
  applications,
  loading,
}: {
  applications: Application[];
  loading: boolean;
}) {
  const [activeStatus, setActiveStatus] = useState<ApplicationStatus>("Pending");
  const [selected, setSelected] = useState<Application | null>(null);

  const counts = useMemo(
    () =>
      applicationStatuses.reduce<Record<ApplicationStatus, number>>(
        (acc, s) => {
          acc[s] = applications.filter((a) => a.status === s).length;
          return acc;
        },
        { Pending: 0, Approved: 0, Rejected: 0 }
      ),
    [applications]
  );

  const filtered = useMemo(
    () => applications.filter((a) => a.status === activeStatus),
    [applications, activeStatus]
  );

  return (
    <section className="grid gap-5 animate-fade-in" role="tabpanel">
      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {applicationStatuses.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveStatus(s)}
            className={`border-2 px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors font-display ${
              activeStatus === s
                ? "border-brand text-brand"
                : "border-transparent text-mist hover:text-ink"
            }`}
          >
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Table */}
        <div className="overflow-auto border border-border bg-white">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-paper/60 text-[11px] uppercase tracking-wider text-mist font-display">
                <th className="p-4">Applicant</th>
                <th className="p-4">Role</th>
                <th className="p-4">Location</th>
                <th className="p-4">Availability</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-8 text-center text-sm text-mist font-display" colSpan={5}>
                    Loading applications…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="p-8 text-center text-sm text-mist font-display" colSpan={5}>
                    No {activeStatus.toLowerCase()} applications.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => setSelected(a)}
                    className={`cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-brand-light/40 ${
                      selected?.id === a.id ? "bg-brand-light/60" : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className="font-bold text-ink">{a.full_name}</div>
                      <div className="text-xs text-mist">{a.email}</div>
                    </td>
                    <td className="p-4 text-xs font-bold uppercase tracking-wide text-brand font-display">
                      {a.applying_as}
                    </td>
                    <td className="p-4 text-sm text-mist">
                      {a.current_city}, {a.current_state}
                    </td>
                    <td className="p-4 text-sm text-mist">
                      {a.availability} · {a.hours_per_week}h/wk
                    </td>
                    <td className="p-4">
                      <StatusBadge status={a.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Detail panel (read-only) */}
        <aside className="border border-border bg-white p-5 overflow-y-auto max-h-[640px]">
          {selected ? (
            <div className="grid gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-brand font-display">
                  Application
                </p>
                <h3 className="mt-1 text-xl font-bold text-ink font-display">
                  {selected.full_name}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge status={selected.status} />
                  <span className="bg-paper px-2 py-1 text-[10px] font-bold uppercase text-mist font-display">
                    {selected.applying_as}
                  </span>
                </div>
              </div>
              <DetailGroup title="Contact">
                <Detail label="Email" value={selected.email} />
                <Detail label="Mobile" value={selected.mobile_number} />
                <Detail label="Location" value={`${selected.current_city}, ${selected.current_state}`} />
              </DetailGroup>
              <DetailGroup title="Application Details">
                <Detail label="Status" value={selected.current_status} />
                <Detail label="Organisation" value={selected.organization_name} />
                <Detail label="Mode" value={selected.preferred_mode} />
                <Detail label="Duration" value={selected.expected_duration} />
                <Detail label="Availability" value={selected.availability} />
                <Detail label="Hours/week" value={selected.hours_per_week != null ? String(selected.hours_per_week) : null} />
                <Detail label="Interest" value={selected.areas_of_interest?.join(", ")} />
              </DetailGroup>
              {selected.admin_notes && (
                <DetailGroup title="Admin Notes">
                  <p className="text-sm text-ink">{selected.admin_notes}</p>
                </DetailGroup>
              )}
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center text-center text-sm font-semibold text-mist font-display">
              Select an application to view details.
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

// ── Records Tab ───────────────────────────────────────────────────────────────

function RecordsTab({
  activities,
  loading,
}: {
  activities: ActivityType[];
  loading: boolean;
}) {
  return (
    <section className="grid gap-4 animate-fade-in" role="tabpanel">
      <div className="overflow-auto border border-border bg-white">
        <table className="w-full min-w-[860px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-paper/60 text-[11px] uppercase tracking-wider text-mist font-display">
              <th className="p-4">Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Date</th>
              <th className="p-4">Activity</th>
              <th className="p-4">Location</th>
              <th className="p-4">Hours</th>
              <th className="p-4">Beneficiaries</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-8 text-center text-sm text-mist font-display" colSpan={7}>
                  Loading records…
                </td>
              </tr>
            ) : activities.length === 0 ? (
              <tr>
                <td className="p-8 text-center text-sm text-mist font-display" colSpan={7}>
                  No records found.
                </td>
              </tr>
            ) : (
              activities.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-border transition-colors last:border-0 hover:bg-paper/60"
                >
                  <td className="p-4 font-semibold text-ink">{a.volunteer_name}</td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide font-display ${
                        a.entry_type === "volunteer"
                          ? "bg-brand-light text-brand"
                          : "bg-[#E8F7F1] text-[#167241]"
                      }`}
                    >
                      {a.entry_type}
                    </span>
                  </td>
                  <td className="p-4 text-mist">{a.activity_date}</td>
                  <td className="p-4 text-mist">
                    {a.project_type ?? a.intern_work_type ?? "—"}
                  </td>
                  <td className="p-4 text-mist">{a.location ?? "—"}</td>
                  <td className="p-4 font-semibold tabular-nums">
                    {a.volunteering_hours ?? a.internship_hours ?? "—"}
                  </td>
                  <td className="p-4 font-semibold tabular-nums">
                    {a.beneficiaries_impacted ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Analytics Tab ─────────────────────────────────────────────────────────────

function AnalyticsTab({
  applications,
  activities,
  animKey,
}: {
  applications: Application[];
  activities: ActivityType[];
  animKey: number;
}) {
  const roleBreakdown = useMemo(() => {
    const v = applications.filter((a) => a.applying_as === "volunteer").length;
    const i = applications.filter((a) => a.applying_as === "intern").length;
    return { volunteer: v, intern: i, total: v + i };
  }, [applications]);

  const topLocations = useMemo(() => {
    const map: Record<string, number> = {};
    applications.forEach((a) => {
      if (a.current_city) {
        map[a.current_city] = (map[a.current_city] ?? 0) + 1;
      }
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [applications]);

  const activityByType = useMemo(() => {
    const map: Record<string, number> = {};
    activities.forEach((a) => {
      const key = a.project_type ?? a.intern_work_type ?? "Other";
      map[key] = (map[key] ?? 0) + 1;
    });
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);
  }, [activities]);

  const totalHours = activities.reduce(
    (s, a) => s + (a.volunteering_hours ?? a.internship_hours ?? 0),
    0
  );

  return (
    <section className="grid gap-6 animate-fade-in" role="tabpanel">
      {/* Top ledger stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Applications" value={applications.length} variant="secondary" iconName="FileText" index={0} animKey={animKey} />
        <StatCard label="Approved" value={applications.filter((a) => a.status === "Approved").length} variant="secondary" iconName="CheckCircle2" index={1} animKey={animKey} />
        <StatCard label="Volunteers" value={roleBreakdown.volunteer} variant="secondary" iconName="Users" index={2} animKey={animKey} />
        <StatCard label="Interns" value={roleBreakdown.intern} variant="secondary" iconName="GraduationCap" index={3} animKey={animKey} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Role breakdown */}
        <div className="border border-border bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand mb-4 font-display">
            Role Breakdown
          </p>
          {roleBreakdown.total > 0 ? (
            <div className="grid gap-3">
              {[
                { label: "Volunteers", count: roleBreakdown.volunteer, color: "bg-brand" },
                { label: "Interns", count: roleBreakdown.intern, color: "bg-ink" },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs font-semibold mb-1 font-display">
                    <span className="text-mist">{label}</span>
                    <span className="text-ink">
                      {count} ({roleBreakdown.total > 0 ? Math.round((count / roleBreakdown.total) * 100) : 0}%)
                    </span>
                  </div>
                  <div className="h-2 bg-paper rounded-none overflow-hidden">
                    <div
                      className={`h-full ${color} transition-all duration-700`}
                      style={{
                        width: roleBreakdown.total > 0
                          ? `${(count / roleBreakdown.total) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-mist font-display pt-1">
                Total volunteer hours logged: <strong className="text-ink">{totalHours.toLocaleString("en-IN")}</strong>
              </p>
            </div>
          ) : (
            <p className="text-sm text-mist font-display">No applications yet.</p>
          )}
        </div>

        {/* Top Locations */}
        <div className="border border-border bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand mb-4 font-display">
            Top Locations
          </p>
          {topLocations.length > 0 ? (
            <div className="grid gap-2">
              {topLocations.map(([city, count], i) => (
                <div key={city} className="flex items-center justify-between text-sm font-display">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="truncate text-ink">{city}</span>
                  </div>
                  <span className="font-bold text-mist tabular-nums ml-4">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-mist font-display">No location data yet.</p>
          )}
        </div>

        {/* Activity types */}
        <div className="border border-border bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand mb-4 font-display">
            Activity Types
          </p>
          {activityByType.length > 0 ? (
            <div className="grid gap-2">
              {activityByType.map(([type, count]) => {
                const max = activityByType[0]?.[1] ?? 1;
                return (
                  <div key={type}>
                    <div className="flex justify-between text-xs font-semibold mb-1 font-display">
                      <span className="text-mist truncate max-w-[140px]">{type}</span>
                      <span className="text-ink ml-2 shrink-0">{count}</span>
                    </div>
                    <div className="h-1.5 bg-paper overflow-hidden">
                      <div
                        className="h-full bg-brand transition-all duration-700"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-mist font-display">No activity data yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Recent Activity Tab ───────────────────────────────────────────────────────

function RecentTab({
  activities,
  loading,
}: {
  activities: ActivityType[];
  loading: boolean;
}) {
  const recent = useMemo(
    () => [...activities].slice(0, 20),
    [activities]
  );

  return (
    <section className="grid gap-4 animate-fade-in" role="tabpanel">
      {loading ? (
        <div className="p-8 text-center text-sm text-mist font-display">
          Loading recent activity…
        </div>
      ) : recent.length === 0 ? (
        <div className="p-8 text-center text-sm text-mist font-display">
          No activity records yet.
        </div>
      ) : (
        <div className="border border-border bg-white divide-y divide-border">
          {recent.map((a) => (
            <div key={a.id} className="flex items-start gap-4 p-4 hover:bg-paper/50 transition-colors">
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold font-display ${
                  a.entry_type === "volunteer" ? "bg-brand" : "bg-ink"
                }`}
              >
                {a.entry_type === "volunteer" ? "V" : "I"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-ink text-sm">{a.volunteer_name}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-brand font-display">
                    {a.project_type ?? a.intern_work_type ?? "Activity"}
                  </span>
                </div>
                <p className="text-xs text-mist mt-0.5 font-display">
                  {a.activity_date}
                  {a.location ? ` · ${a.location}` : ""}
                  {(a.volunteering_hours ?? a.internship_hours)
                    ? ` · ${a.volunteering_hours ?? a.internship_hours}h`
                    : ""}
                  {a.beneficiaries_impacted
                    ? ` · ${a.beneficiaries_impacted} beneficiaries`
                    : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function AdminMetric({
  label,
  value,
  icon,
  emphasized = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  emphasized?: boolean;
}) {
  return (
    <article
      className={`border p-5 ${
        emphasized ? "border-brand bg-brand-light" : "border-border bg-white"
      }`}
    >
      <div className="flex items-center justify-between text-brand">{icon}</div>
      <p className="mt-4 text-sm font-bold text-mist font-display">{label}</p>
      <strong className="mt-1 block text-3xl font-black text-ink">
        {value.toLocaleString("en-IN")}
      </strong>
    </article>
  );
}

function DetailGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-4">
      <h3 className="mb-3 text-[11px] font-bold uppercase tracking-widest text-brand font-display">
        {title}
      </h3>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 text-sm">
      <span className="font-bold text-mist font-display">{label}</span>
      <span className="text-ink">{value || "—"}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const styles: Record<ApplicationStatus, string> = {
    Pending: "bg-[#fff7e8] text-[#9a6500]",
    Approved: "bg-[#e9f7ef] text-[#167241]",
    Rejected: "bg-brand-light text-brand",
  };
  return (
    <span
      className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider font-display ${styles[status]}`}
    >
      {status}
    </span>
  );
}
