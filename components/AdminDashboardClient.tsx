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
  UserCheck,
  AlertOctagon,
  Users,
  Settings,
  ChevronRight,
  Database,
  ShieldCheck,
  Sparkles,
  Mail,
  ListTodo
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { applicationStatuses, type ApplicationStatus } from "@/lib/constants";
import { fetchApplications } from "@/lib/applications";
import { fetchActivities, getTotalHours } from "@/lib/queries";
import { fetchMembers, updateMemberStatus } from "@/lib/members";
import type { Application, Activity as ActivityType, Member } from "@/lib/types";
import { StatCard } from "@/components/StatCard";

type AdminTab = "dashboard" | "applications" | "records" | "analytics" | "recent";

export function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [applications, setApplications] = useState<Application[]>([]);
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingActs, setLoadingActs] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState("");
  const [reactivatingId, setRereactivatingId] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

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

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const data = await fetchMembers();
      setMembers(data);
    } catch (e) {
      console.error("Could not load members:", e);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  const loadAll = useCallback(() => {
    loadApplications();
    loadActivities();
    loadMembers();
  }, [loadApplications, loadActivities, loadMembers]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Derived stats
  const appStats = useMemo(() => {
    const pendingApps = applications.filter((a) => a.status === "Pending").length;
    const pendingReviews = activities.filter((a) => a.status === "Submitted").length;
    const activeMems = members.filter((m) => m.status === "Active").length;
    const completedMems = members.filter((m) => m.status === "Completed").length;
    const suspendedMems = members.filter((m) => m.status === "Suspended").length;

    return {
      pendingApplications: pendingApps,
      pendingReviews,
      activeMembers: activeMems,
      completedMembers: completedMems,
      suspendedMembers: suspendedMems
    };
  }, [applications, activities, members]);

  // Reactivate a member from the operational widget directly
  async function handleQuickReactivate(memberId: string) {
    setRereactivatingId(memberId);
    try {
      await updateMemberStatus(memberId, "Active", null);
      await loadMembers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reactivate member.");
    } finally {
      setRereactivatingId(null);
    }
  }

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Operations Center", icon: <Settings size={15} /> },
    { id: "applications", label: "Applications Portal", icon: <FileText size={15} /> },
    { id: "records", label: "Activity Records", icon: <ListChecks size={15} /> },
    { id: "analytics", label: "Analytics Overview", icon: <Activity size={15} /> },
    { id: "recent", label: "System logs", icon: <Clock3 size={15} /> },
  ];

  const loading = loadingApps || loadingActs || loadingMembers;
  const animKey = tabs.findIndex((tab) => tab.id === activeTab) + applications.length + activities.length;

  return (
    <div className="grid gap-6 text-left">
      {/* Demo banner */}
      {demoMode && (
        <div className="border border-border bg-brand-light p-4 text-sm font-semibold text-ink font-display rounded-xl">
          💡 Showing demo data. Connect Supabase to see live records.
        </div>
      )}

      {error && (
        <div className="border border-red-500 bg-red-50 p-4 text-sm text-red-800 font-display rounded-xl">
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

        <button
          type="button"
          onClick={loadAll}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-border bg-white px-4 py-2 text-xs font-bold uppercase tracking-wide text-ink hover:border-brand hover:text-brand disabled:opacity-50 font-display transition-colors mb-1 rounded-xl shadow-xs"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {/* ── Tab: Operations Center ── */}
      {activeTab === "dashboard" && (
        <div className="grid gap-6 animate-fade-in font-display">
          {/* Operations Hero Card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111] to-[#222] p-8 text-white border border-brand/20 shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-6 relative z-10">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand bg-brand/10 border border-brand/20 px-3 py-1 rounded-full">
                  ADMIN OPERATIONS
                </span>
                <h1 className="mt-2 text-2xl md:text-3xl font-display font-black tracking-tight text-white">
                  Welcome to ThinkSharp Operations Center
                </h1>
                <p className="text-xs text-mist font-semibold mt-1 flex items-center gap-1.5">
                  Manage applications, members, reports and operational tasks.
                  <span className="w-1.5 h-1.5 rounded-full bg-[#167241] inline-block animate-pulse" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#167241]">LIVE</span>
                  <span className="text-white/40">|</span>
                  <span className="font-mono text-white/70">{currentTime}</span>
                </p>
              </div>
            </div>

            {/* Quick stats grid inside Hero */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 relative z-10">
              <div>
                <span className="text-[10px] font-bold text-mist/60 uppercase tracking-widest block">Pending Apps</span>
                <strong className="text-3xl font-black text-white mt-1 block tracking-tight">
                  {appStats.pendingApplications}
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-mist/60 uppercase tracking-widest block">Awaiting Review</span>
                <strong className="text-3xl font-black text-[#f1c40f] mt-1 block tracking-tight">
                  {appStats.pendingReviews}
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-mist/60 uppercase tracking-widest block">Active Members</span>
                <strong className="text-3xl font-black text-[#2ecc71] mt-1 block tracking-tight">
                  {appStats.activeMembers}
                </strong>
              </div>
              <div>
                <span className="text-[10px] font-bold text-mist/60 uppercase tracking-widest block">Completed Members</span>
                <strong className="text-3xl font-black text-white mt-1 block tracking-tight">
                  {appStats.completedMembers}
                </strong>
              </div>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div className="border border-border bg-white p-4 rounded-2xl shadow-soft flex flex-wrap gap-3 items-center justify-start">
            <span className="text-xs font-black uppercase text-brand tracking-widest mr-2">⚡ Quick Links:</span>
            <button 
              onClick={() => setActiveTab("applications")} 
              className="inline-flex h-9 items-center gap-2 border border-border hover:border-brand hover:text-brand bg-white px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs"
            >
              <FileText size={13} className="text-brand" /> Review Applications
            </button>
            <Link 
              href="/admin/members" 
              className="inline-flex h-9 items-center gap-2 border border-border hover:border-brand hover:text-brand bg-white px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs"
            >
              <Users size={13} className="text-brand" /> Manage Members
            </Link>
            <button 
              onClick={() => setActiveTab("records")} 
              className="inline-flex h-9 items-center gap-2 border border-border hover:border-brand hover:text-brand bg-white px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-xs"
            >
              <ListChecks size={13} className="text-brand" /> View Activity Records
            </button>
            <button 
              onClick={() => setActiveTab("analytics")} 
              className="inline-flex h-9 items-center gap-2 border border-brand bg-brand px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink rounded-xl transition-all shadow-md shadow-brand/20 animate-pulse"
            >
              <BarChart3 size={13} /> Open Analytics Hub
            </button>
          </div>

          {/* Today's Operational Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand">Pending Applications</span>
                <span className="p-1.5 bg-brand-light rounded-lg text-brand"><FileText size={16} /></span>
              </div>
              <strong className="mt-3 block text-3xl font-black text-ink">{appStats.pendingApplications} waiting</strong>
              <p className="text-[10px] text-mist font-bold uppercase mt-1">Needs credential review</p>
            </article>

            <article className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand">Awaiting Verification</span>
                <span className="p-1.5 bg-amber-50 rounded-lg text-amber-600"><Clock3 size={16} /></span>
              </div>
              <strong className="mt-3 block text-3xl font-black text-ink">{appStats.pendingReviews} tasks</strong>
              <p className="text-[10px] text-mist font-bold uppercase mt-1">Submitted volunteer reports</p>
            </article>

            <article className="rounded-2xl border border-border bg-white p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand">Certificates Issued</span>
                <span className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600"><UserCheck size={16} /></span>
              </div>
              <strong className="mt-3 block text-3xl font-black text-ink">{appStats.completedMembers} ready</strong>
              <p className="text-[10px] text-mist font-bold uppercase mt-1">Completion terms achieved</p>
            </article>

            <article className="rounded-2xl border border-[#c0392b]/20 bg-white p-5 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all duration-300">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#c0392b]">Suspended Members</span>
                <span className="p-1.5 bg-rose-50 rounded-lg text-[#c0392b]"><AlertOctagon size={16} /></span>
              </div>
              <strong className="mt-3 block text-3xl font-black text-ink">{appStats.suspendedMembers} members</strong>
              <p className="text-[10px] text-mist font-bold uppercase mt-1">Restricted workspace accounts</p>
            </article>
          </div>

          {/* Pending Applications & Pending Activity Reviews Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Pending Applications widget */}
            <div className="border border-border bg-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-brand flex items-center gap-1.5 border-b border-border/60 pb-3 mb-4">
                  <span>📥</span> Latest Pending Applications
                </h3>
                <div className="flex flex-col gap-3">
                  {applications.filter(a => a.status === "Pending").slice(0, 5).length === 0 ? (
                    <p className="text-xs font-bold text-mist py-4">No pending applications waiting.</p>
                  ) : (
                    applications.filter(a => a.status === "Pending").slice(0, 5).map(app => (
                      <div key={app.id} className="flex items-center justify-between p-3 border border-border/70 rounded-xl bg-paper/20 hover:border-brand/40 transition-colors">
                        <div>
                          <h4 className="font-bold text-ink text-xs">{app.full_name}</h4>
                          <span className="text-[9px] uppercase font-black text-brand bg-brand-light px-2 py-0.5 rounded-full mt-1.5 inline-block">{app.applying_as}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-mist font-bold">{app.current_city}</p>
                          <button onClick={() => { setActiveTab("applications"); }} className="text-[10px] font-black text-brand hover:underline mt-1 block">Review →</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <button onClick={() => setActiveTab("applications")} className="mt-4 w-full py-2 border border-border text-xs font-bold uppercase tracking-wider rounded-xl hover:border-brand hover:text-brand bg-white shadow-xs transition-colors">
                View All Applications
              </button>
            </div>

            {/* Pending Activity Reviews widget */}
            <div className="border border-border bg-white p-6 rounded-2xl shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-brand flex items-center gap-1.5 border-b border-border/60 pb-3 mb-4">
                  <span>📝</span> Pending Activity Reviews
                </h3>
                <div className="flex flex-col gap-3">
                  {activities.filter(a => a.status === "Submitted").slice(0, 5).length === 0 ? (
                    <p className="text-xs font-bold text-mist py-4">No activities awaiting verification.</p>
                  ) : (
                    activities.filter(a => a.status === "Submitted").slice(0, 5).map(act => (
                      <div key={act.id} className="flex items-center justify-between p-3 border border-border/70 rounded-xl bg-paper/20 hover:border-brand/40 transition-colors">
                        <div>
                          <h4 className="font-bold text-ink text-xs">{act.volunteer_name}</h4>
                          <p className="text-[10px] text-mist mt-0.5 font-bold uppercase">{act.programme_name || act.milestone}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-black text-brand tabular-nums">{getTotalHours(act)} hrs</span>
                          <button onClick={() => setActiveTab("records")} className="text-[10px] font-black text-brand hover:underline mt-1 block">Review Activity →</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <button onClick={() => setActiveTab("records")} className="mt-4 w-full py-2 border border-border text-xs font-bold uppercase tracking-wider rounded-xl hover:border-brand hover:text-brand bg-white shadow-xs transition-colors">
                View All Records
              </button>
            </div>
          </div>

          {/* Timeline and Notifications Grid */}
          <div className="grid gap-6 md:grid-cols-12">
            {/* Timeline widget */}
            <div className="md:col-span-7 border border-border bg-white p-6 rounded-2xl shadow-sm text-left">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand flex items-center gap-1.5 border-b border-border/60 pb-3 mb-4">
                <span>📈</span> Recent Member Activity
              </h3>
              <div className="relative pl-6 border-l border-border/80 flex flex-col gap-4 max-h-[380px] overflow-auto pr-2">
                {activities.slice(0, 8).map((act, i) => (
                  <div key={act.id} className="relative">
                    <span className="absolute -left-9 top-1 w-2.5 h-2.5 rounded-full bg-brand border border-white" />
                    <span className="text-[10px] font-black text-mist block">{act.activity_date}</span>
                    <p className="text-xs font-bold text-ink mt-0.5">
                      <strong className="text-brand">{act.volunteer_name}</strong> logged {getTotalHours(act)} hrs on {act.programme_name || act.milestone || "activity"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Notifications panel widget */}
            <div className="md:col-span-5 border border-border bg-white p-6 rounded-2xl shadow-sm text-left flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-brand flex items-center gap-1.5 border-b border-border/60 pb-3 mb-4">
                  <span>🔔</span> Live Notifications
                </h3>
                <div className="flex flex-col gap-2.5 max-h-[300px] overflow-auto pr-2">
                  {/* Dynamic generation based on actual data feeds */}
                  {activities.slice(0, 4).map((a) => (
                    <div key={a.id} className="flex gap-2 text-xs font-semibold p-2.5 border border-border/60 rounded-xl bg-paper/10">
                      <span className="text-emerald-600">✓</span>
                      <div>
                        <p className="text-ink">Activity Submitted</p>
                        <span className="text-[10px] text-mist mt-0.5 block">{a.volunteer_name} logged {getTotalHours(a)} hrs</span>
                      </div>
                    </div>
                  ))}
                  {applications.slice(0, 2).map((a) => (
                    <div key={a.id} className="flex gap-2 text-xs font-semibold p-2.5 border border-border/60 rounded-xl bg-paper/10">
                      <span className="text-brand">✓</span>
                      <div>
                        <p className="text-ink">New Applicant Registered</p>
                        <span className="text-[10px] text-mist mt-0.5 block">{a.full_name} applied as {a.applying_as}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Completed Members and Suspended Members lists */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Completed members table widget */}
            <div className="border border-border bg-white p-6 rounded-2xl shadow-sm text-left">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand flex items-center gap-1.5 border-b border-border/60 pb-3 mb-4">
                <span>🎓</span> Recently Completed Members
              </h3>
              <div className="overflow-auto max-h-[280px]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[9px] uppercase text-mist font-bold">
                      <th className="pb-2">TSF ID</th>
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Certificate Generated</th>
                      <th className="pb-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.filter(m => m.status === "Completed").length === 0 ? (
                      <tr>
                        <td className="p-4 text-center font-bold text-mist" colSpan={4}>No completed members.</td>
                      </tr>
                    ) : (
                      members.filter(m => m.status === "Completed").slice(0, 5).map(m => (
                        <tr key={m.id} className="border-b border-border last:border-0 hover:bg-paper/20">
                          <td className="py-2.5 font-bold text-brand">{m.user_id}</td>
                          <td className="py-2.5 font-bold text-ink">{m.name}</td>
                          <td className="py-2.5 font-mono text-[10px] text-mist">{m.certificate_number || "Pending"}</td>
                          <td className="py-2.5 text-center">
                            <Link href="/admin/members" className="text-[10px] font-bold text-brand hover:underline">View Portal →</Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Suspended members table widget */}
            <div className="border border-border bg-white p-6 rounded-2xl shadow-sm text-left">
              <h3 className="text-xs font-black uppercase tracking-widest text-[#c0392b] flex items-center gap-1.5 border-b border-border/60 pb-3 mb-4">
                <span>🚫</span> Suspended Members Directory
              </h3>
              <div className="overflow-auto max-h-[280px]">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[9px] uppercase text-mist font-bold">
                      <th className="pb-2">TSF ID</th>
                      <th className="pb-2">Name</th>
                      <th className="pb-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.filter(m => m.status === "Suspended").length === 0 ? (
                      <tr>
                        <td className="p-4 text-center font-bold text-mist" colSpan={3}>No currently suspended members.</td>
                      </tr>
                    ) : (
                      members.filter(m => m.status === "Suspended").map(m => (
                        <tr key={m.id} className="border-b border-border last:border-0 hover:bg-paper/20">
                          <td className="py-2.5 font-bold text-brand">{m.user_id}</td>
                          <td className="py-2.5 font-bold text-ink">{m.name}</td>
                          <td className="py-2.5 text-center">
                            <button
                              disabled={reactivatingId === m.id}
                              onClick={() => handleQuickReactivate(m.id)}
                              className="text-[10px] font-bold text-emerald-600 hover:underline disabled:opacity-50"
                            >
                              {reactivatingId === m.id ? "Activating..." : "Reactivate →"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* System Status and Upcoming Tasks Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* System Status Card */}
            <div className="border border-border bg-white p-6 rounded-2xl shadow-sm text-left">
              <h3 className="text-xs font-black uppercase tracking-widest text-brand flex items-center gap-1.5 border-b border-border/60 pb-3 mb-4">
                <span>⚙</span> Infrastructure Status
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border border-border/70 rounded-xl bg-paper/10 text-xs font-semibold text-ink">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-brand" /> Supabase REST API
                  </span>
                  <span className="text-[#2ecc71] font-bold">ONLINE</span>
                </div>
                <div className="flex items-center justify-between p-3 border border-border/70 rounded-xl bg-paper/10 text-xs font-semibold text-ink">
                  <span className="flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-brand" /> Remote Database
                  </span>
                  <span className="text-[#2ecc71] font-bold">CONNECTED</span>
                </div>
                <div className="flex items-center justify-between p-3 border border-border/70 rounded-xl bg-paper/10 text-xs font-semibold text-ink">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-brand" /> Authorization GoTrue
                  </span>
                  <span className="text-[#2ecc71] font-bold">HEALTHY</span>
                </div>
                <div className="flex items-center justify-between p-3 border border-border/70 rounded-xl bg-paper/10 text-xs font-semibold text-ink">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand" /> PDF Generators
                  </span>
                  <span className="text-[#2ecc71] font-bold">AVAILABLE</span>
                </div>
                <div className="col-span-2 flex items-center justify-between p-3 border border-border/70 rounded-xl bg-paper/10 text-xs font-semibold text-ink">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-brand" /> System Email Dispatcher
                  </span>
                  <span className="text-[#2ecc71] font-bold">CONFIGURED</span>
                </div>
              </div>
            </div>

            {/* Upcoming tasks reminders card */}
            <div className="border border-border bg-white p-6 rounded-2xl shadow-sm text-left flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-brand flex items-center gap-1.5 border-b border-border/60 pb-3 mb-4">
                  <span>📋</span> Tasks Reminders Checklist
                </h3>
                <div className="flex flex-col gap-3 font-semibold text-xs text-ink">
                  <label className="flex items-center gap-2.5 p-2.5 border border-border/50 rounded-xl bg-paper/5 cursor-pointer">
                    <input type="checkbox" defaultChecked={appStats.pendingApplications === 0} className="w-4 h-4 text-brand" readOnly />
                    <span className={appStats.pendingApplications === 0 ? "line-through text-mist" : ""}>
                      Review pending volunteer/intern applications ({appStats.pendingApplications} waiting)
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 border border-border/50 rounded-xl bg-paper/5 cursor-pointer">
                    <input type="checkbox" defaultChecked={appStats.pendingReviews === 0} className="w-4 h-4 text-brand" readOnly />
                    <span className={appStats.pendingReviews === 0 ? "line-through text-mist" : ""}>
                      Verify submitted member activity reports ({appStats.pendingReviews} pending review)
                    </span>
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 border border-border/50 rounded-xl bg-paper/5 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-brand" />
                    <span>Export and audit Monthly Outreach PDF summaries</span>
                  </label>
                  <label className="flex items-center gap-2.5 p-2.5 border border-border/50 rounded-xl bg-paper/5 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-brand" />
                    <span>Audit certificate serial allocations for completed graduates</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
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

      {/* ── Tab: System logs ── */}
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
      <div className="flex flex-wrap gap-2">
        {applicationStatuses.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setActiveStatus(s)}
            className={`border-2 px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors font-display rounded-lg ${
              activeStatus === s
                ? "border-brand text-brand bg-white"
                : "border-transparent text-mist hover:text-ink"
            }`}
          >
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Table container */}
        <div className="overflow-hidden border border-border bg-white rounded-2xl shadow-soft">
          <div className="overflow-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-paper/60 text-[10px] uppercase tracking-widest text-mist font-black">
                  <th className="p-4 pl-5">Applicant</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Availability</th>
                  <th className="p-4 pr-5">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="p-8 text-center text-xs font-bold text-mist font-display" colSpan={5}>
                      Loading applications…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td className="p-8 text-center text-xs font-bold text-mist font-display" colSpan={5}>
                      No {activeStatus.toLowerCase()} applications.
                    </td>
                  </tr>
                ) : (
                  filtered.map((a, idx) => (
                    <tr
                      key={a.id}
                      onClick={() => setSelected(a)}
                      className={`cursor-pointer border-b border-border transition-all duration-150 last:border-0 hover:bg-brand-light/40 ${
                        selected?.id === a.id ? "bg-brand-light/60 font-bold" : (idx % 2 === 0 ? "bg-white" : "bg-paper/10")
                      }`}
                    >
                      <td className="p-4 pl-5">
                        <div className="font-bold text-ink text-xs">{a.full_name}</div>
                        <div className="text-[10px] text-mist font-medium mt-0.5">{a.email}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-block px-2 py-0.5 text-[9px] font-black bg-brand/5 text-brand border border-brand/10 rounded uppercase">
                          {a.applying_as}
                        </span>
                      </td>
                      <td className="p-4 text-ink font-semibold">
                        {a.current_city}, {a.current_state}
                      </td>
                      <td className="p-4 text-mist font-semibold">
                        {a.availability} · {a.hours_per_week}h/wk
                      </td>
                      <td className="p-4 pr-5">
                        <StatusBadge status={a.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail panel (read-only) */}
        <aside className="border border-border bg-white p-5 overflow-y-auto max-h-[640px] rounded-2xl shadow-soft">
          {selected ? (
            <div className="grid gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand font-display">
                  Application
                </p>
                <h3 className="mt-1 text-lg font-black text-ink font-display">
                  {selected.full_name}
                </h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusBadge status={selected.status} />
                  <span className="bg-brand/5 border border-brand/10 px-2 py-0.5 text-[9px] font-black uppercase text-brand rounded font-display">
                    {selected.applying_as}
                  </span>
                </div>
              </div>
              <DetailGroup title="Contact Info">
                <Detail label="Email" value={selected.email} />
                <Detail label="Mobile" value={selected.mobile_number} />
                <Detail label="Location" value={`${selected.current_city}, ${selected.current_state}`} />
              </DetailGroup>
              <DetailGroup title="Application Specifics">
                <Detail label="Status" value={selected.current_status} />
                <Detail label="Organisation" value={selected.organization_name} />
                <Detail label="Preferred Mode" value={selected.preferred_mode} />
                <Detail label="Duration" value={selected.expected_duration} />
                <Detail label="Availability" value={selected.availability} />
                <Detail label="Hours / Week" value={selected.hours_per_week != null ? String(selected.hours_per_week) : null} />
                <Detail label="Interests" value={selected.areas_of_interest?.join(", ")} />
              </DetailGroup>
              {selected.admin_notes && (
                <DetailGroup title="Admin Assessment">
                  <p className="text-xs text-ink font-medium leading-relaxed bg-paper/20 p-2.5 border border-border rounded-xl">{selected.admin_notes}</p>
                </DetailGroup>
              )}
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center text-center text-xs font-bold text-mist font-display">
              Select an applicant profile to inspect the details drawer.
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
      <div className="overflow-hidden border border-border bg-white rounded-2xl shadow-soft">
        <div className="overflow-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-paper/60 text-[10px] uppercase tracking-widest text-mist font-black">
                <th className="p-4 pl-5">Member</th>
                <th className="p-4">Type</th>
                <th className="p-4">Date</th>
                <th className="p-4">Activity Name</th>
                <th className="p-4">Location</th>
                <th className="p-4">Hours Logged</th>
                <th className="p-4 pr-5">Beneficiaries</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-8 text-center text-xs font-bold text-mist font-display" colSpan={7}>
                    Loading activity records…
                  </td>
                </tr>
              ) : activities.length === 0 ? (
                <tr>
                  <td className="p-8 text-center text-xs font-bold text-mist" colSpan={7}>
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                activities.map((a, idx) => (
                  <tr
                    key={a.id}
                    className={`border-b border-border transition-all duration-150 last:border-0 hover:bg-paper/40 ${
                      idx % 2 === 0 ? "bg-white" : "bg-paper/10"
                    }`}
                  >
                    <td className="p-4 pl-5 font-bold text-ink">{a.volunteer_name}</td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded ${
                          a.entry_type === "volunteer"
                            ? "bg-brand-light text-brand border border-brand/20"
                            : "bg-paper text-ink border border-border/80"
                        }`}
                      >
                        {a.entry_type}
                      </span>
                    </td>
                    <td className="p-4 text-mist font-semibold">{a.activity_date}</td>
                    <td className="p-4 text-ink font-semibold">
                      {a.project_type ?? a.intern_work_type ?? "—"}
                    </td>
                    <td className="p-4 text-mist font-semibold">{a.location ?? "—"}</td>
                    <td className="p-4 font-black text-ink tabular-nums">
                      {a.volunteering_hours ?? a.internship_hours ?? "—"} hrs
                    </td>
                    <td className="p-4 font-black text-brand tabular-nums pr-5">
                      ❤️ {a.beneficiaries_impacted ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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
        <div className="border border-border bg-white p-5 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-4 font-display">
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
                  <div className="h-2 bg-paper rounded-full overflow-hidden border">
                    <div
                      className={`h-full ${color} rounded-full transition-all duration-700`}
                      style={{
                        width: roleBreakdown.total > 0
                          ? `${(count / roleBreakdown.total) * 100}%`
                          : "0%",
                      }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-mist font-display pt-2 font-bold uppercase tracking-wide">
                Total hours logged: <span className="text-brand font-black">{totalHours.toLocaleString("en-IN")} hrs</span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-mist font-bold">No application statistics yet.</p>
          )}
        </div>

        {/* Top Locations */}
        <div className="border border-border bg-white p-5 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-4 font-display">
            Top Locations
          </p>
          {topLocations.length > 0 ? (
            <div className="grid gap-3">
              {topLocations.map(([city, count], i) => (
                <div key={city} className="flex items-center justify-between text-xs font-bold font-display">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand text-[9px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="truncate text-ink">{city}</span>
                  </div>
                  <span className="font-extrabold text-mist tabular-nums ml-4">{count} apps</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-mist font-bold">No location logs available.</p>
          )}
        </div>

        {/* Activity types */}
        <div className="border border-border bg-white p-5 rounded-2xl shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-brand mb-4 font-display">
            Activity Types
          </p>
          {activityByType.length > 0 ? (
            <div className="grid gap-2.5">
              {activityByType.map(([type, count]) => {
                const max = activityByType[0]?.[1] ?? 1;
                return (
                  <div key={type}>
                    <div className="flex justify-between text-xs font-semibold mb-1 font-display">
                      <span className="text-mist truncate max-w-[140px]">{type}</span>
                      <span className="text-ink ml-2 shrink-0">{count} logs</span>
                    </div>
                    <div className="h-1.5 bg-paper rounded-full border overflow-hidden">
                      <div
                        className="h-full bg-brand rounded-full transition-all duration-700"
                        style={{ width: `${(count / max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-mist font-bold">No activities submitted yet.</p>
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
    <section className="grid gap-4 animate-fade-in" role="tabpanel text-left">
      {loading ? (
        <div className="p-8 text-center text-xs font-bold text-mist font-display">
          Loading recent activity…
        </div>
      ) : recent.length === 0 ? (
        <div className="p-8 text-center text-xs font-bold text-mist font-display">
          No activity logs recorded yet.
        </div>
      ) : (
        <div className="border border-border bg-white divide-y divide-border rounded-2xl overflow-hidden shadow-soft">
          {recent.map((a) => (
            <div key={a.id} className="flex items-start gap-4 p-4 hover:bg-paper/50 transition-colors">
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold font-display ${
                  a.entry_type === "volunteer" ? "bg-brand" : "bg-ink"
                }`}
              >
                {a.entry_type === "volunteer" ? "V" : "I"}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-ink text-xs">{a.volunteer_name}</span>
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand bg-brand-light px-2 py-0.5 rounded border border-brand/20 font-display">
                    {a.project_type ?? a.intern_work_type ?? "Activity"}
                  </span>
                </div>
                <p className="text-[11px] text-mist font-semibold mt-1">
                  📅 {a.activity_date}
                  {a.location ? ` · 📍 ${a.location}` : ""}
                  {(a.volunteering_hours ?? a.internship_hours)
                    ? ` · ⏰ ${a.volunteering_hours ?? a.internship_hours} hrs`
                    : ""}
                  {a.beneficiaries_impacted
                    ? ` · 👥 ${a.beneficiaries_impacted} beneficiaries`
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

function DetailGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-border pt-4">
      <h3 className="mb-3 text-[10px] font-black uppercase tracking-widest text-brand font-display">
        {title}
      </h3>
      <div className="grid gap-2.5">{children}</div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-2 text-xs font-semibold">
      <span className="text-mist font-medium">{label}</span>
      <span className="text-ink">{value || "—"}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const styles: Record<ApplicationStatus, string> = {
    Pending: "bg-[#fff7e8] text-[#9a6500] border-[#9a6500]/25",
    Approved: "bg-[#e9f7ef] text-[#167241] border-[#167241]/25",
    Rejected: "bg-brand-light text-brand border-brand/25",
  };
  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border font-display ${styles[status]}`}
    >
      {status}
    </span>
  );
}
