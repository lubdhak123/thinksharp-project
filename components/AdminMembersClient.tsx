"use client";

import Link from "next/link";
import { Briefcase, Clock3, RefreshCw, Search, UserRound, X, AlertTriangle, CheckCircle2, Calendar, MapPin, Clock, Heart, Award, ShieldAlert, User, Mail } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchMembers, updateMemberStatus } from "@/lib/members";
import { fetchActivities, getTotalHours } from "@/lib/queries";
import type { Activity, Member } from "@/lib/types";

type RoleFilter = "all" | "volunteer" | "intern";
type StatusFilter = "all" | "Active" | "Completed" | "Suspended";

const DEFAULT_CONTRIBUTION_GOAL = 100;

type MemberRow = Member & {
  hours: number;
  activities: number;
  completed: boolean;
  trees: number;
  beneficiaries: number;
  deliverables: number;
};

// Count-up helper hook for KPI cards
function useCountUp(target: number, duration = 900, trigger = 0) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplay(0);
    startRef.current = null;

    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); };
  }, [target, duration, trigger]);

  return display;
}

export function AdminMembersClient() {
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [animTrigger, setAnimTrigger] = useState(0);

  // Member drill-down view drawer
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);

  // Drill-down activities filters
  const [viewSearch, setViewSearch] = useState("");
  const [viewProject, setViewProject] = useState("");
  const [viewLocation, setViewLocation] = useState("");
  const [viewFromDate, setViewFromDate] = useState("");
  const [viewToDate, setViewToDate] = useState("");

  // Confirmation dialog state
  const [confirmingAction, setConfirmingAction] = useState<{
    member: MemberRow;
    type: "Complete" | "Suspend" | "Reactivate";
  } | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [memberData, activityData] = await Promise.all([fetchMembers(), fetchActivities()]);
      setMembers(memberData);
      setActivities(activityData);
      setAnimTrigger((t) => t + 1);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rows = useMemo<MemberRow[]>(() => {
    return members.map((member) => {
      const memberActivities = activities.filter((activity) => {
        if (activity.user_id && activity.user_id === member.user_id) return true;
        return normalize(activity.volunteer_name) === normalize(member.name);
      });

      const totalTrees = memberActivities.reduce((t, a) => t + Number(a.trees_planted ?? 0), 0);
      const totalBens = memberActivities.reduce((t, a) => t + Number(a.beneficiaries_impacted ?? 0), 0);
      const totalDelivs = memberActivities.reduce((t, a) => t + Number(a.deliverables_completed ?? 0), 0);

      return {
        ...member,
        hours: memberActivities.reduce((total, activity) => total + getTotalHours(activity), 0),
        activities: memberActivities.length,
        completed: member.status === "Completed",
        trees: totalTrees,
        beneficiaries: totalBens,
        deliverables: totalDelivs,
      };
    });
  }, [activities, members]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return rows.filter((row) => {
      const matchesSearch =
        !query ||
        row.user_id.toLowerCase().includes(query) ||
        row.name.toLowerCase().includes(query) ||
        row.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === "all" || row.role === roleFilter;
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, rows, search, statusFilter]);

  const totals = useMemo(() => {
    return {
      total: rows.length,
      volunteers: rows.filter((row) => row.role === "volunteer").length,
      interns: rows.filter((row) => row.role === "intern").length,
      completed: rows.filter((row) => row.completed).length,
    };
  }, [rows]);

  async function executeStatusChange() {
    if (!confirmingAction) return;
    const { member, type } = confirmingAction;
    setActionBusy(true);
    setError("");

    try {
      let targetStatus: Member["status"] = "Active";
      let certNo: string | null = null;

      if (type === "Complete") {
        targetStatus = "Completed";
        const currentYear = new Date().getFullYear();
        const sequence = member.user_id.replace(/\D/g, "");
        certNo = `TSF-CERT-${currentYear}-${sequence || "0000"}`;
      } else if (type === "Suspend") {
        targetStatus = "Suspended";
      } else if (type === "Reactivate") {
        targetStatus = "Active";
      }

      await updateMemberStatus(member.id, targetStatus, certNo);
      await load();
      setConfirmingAction(null);
      
      if (selectedMember && selectedMember.id === member.id) {
        setSelectedMember(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member status.");
    } finally {
      setActionBusy(false);
    }
  }

  const memberActivities = useMemo(() => {
    if (!selectedMember) return [];
    return activities
      .filter((activity) => {
        if (activity.user_id && activity.user_id === selectedMember.user_id) return true;
        return normalize(activity.volunteer_name) === normalize(selectedMember.name);
      })
      .filter((activity) => {
        const matchesSearch =
          !viewSearch ||
          (activity.programme_name || "").toLowerCase().includes(viewSearch.toLowerCase()) ||
          (activity.milestone || "").toLowerCase().includes(viewSearch.toLowerCase());
        const matchesProject =
          !viewProject ||
          activity.project_type === viewProject ||
          activity.intern_work_type === viewProject;
        const matchesLocation =
          !viewLocation ||
          activity.location.toLowerCase().includes(viewLocation.toLowerCase());
        const matchesFrom = !viewFromDate || activity.activity_date >= viewFromDate;
        const matchesTo = !viewToDate || activity.activity_date <= viewToDate;
        
        return matchesSearch && matchesProject && matchesLocation && matchesFrom && matchesTo;
      });
  }, [activities, selectedMember, viewSearch, viewProject, viewLocation, viewFromDate, viewToDate]);

  const modalFilterOptions = useMemo(() => {
    if (!selectedMember) return { projects: [], locations: [] };
    const rawMemberActivities = activities.filter((activity) => {
      if (activity.user_id && activity.user_id === selectedMember.user_id) return true;
      return normalize(activity.volunteer_name) === normalize(selectedMember.name);
    });
    
    const projects = Array.from(
      new Set(
        rawMemberActivities.map((a) => a.project_type || a.intern_work_type).filter(Boolean)
      )
    ) as string[];
    const locations = Array.from(
      new Set(rawMemberActivities.map((a) => a.location).filter(Boolean))
    ) as string[];

    return { projects, locations };
  }, [activities, selectedMember]);

  return (
    <div className="grid gap-6 text-left">
      {error && <div className="border border-red-500 bg-red-50 p-4 text-sm font-bold text-red-700 font-display rounded-xl">{error}</div>}

      {/* Premium Dark Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111] to-[#222] p-8 text-white border border-brand/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 relative z-10 border-b border-white/10">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand bg-brand/10 border border-brand/20 px-3 py-1 rounded-full">
              ADMIN MEMBERS
            </span>
            <h1 className="mt-2 text-2xl md:text-3xl font-display font-black tracking-tight text-white">
              Volunteer & Intern Members Portal
            </h1>
            <p className="text-xs text-mist font-semibold mt-1 flex items-center gap-1.5">
              Manage profiles, track contribution progress, and oversee lifecycle transitions.
              <span className="w-1.5 h-1.5 rounded-full bg-[#167241] inline-block animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#167241]">LIVE</span>
            </p>
          </div>
        </div>

        {/* Hero KPI Numbers strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 relative z-10 font-display">
          <Metric label="Total Members" value={totals.total} icon={<UserRound size={18} />} animTrigger={animTrigger} />
          <Metric label="Volunteers" value={totals.volunteers} icon={<UserRound size={18} />} animTrigger={animTrigger} />
          <Metric label="Interns" value={totals.interns} icon={<Briefcase size={18} />} animTrigger={animTrigger} />
          <Metric label="Completed" value={totals.completed} icon={<Clock3 size={18} />} animTrigger={animTrigger} />
        </div>
      </div>

      {/* Reusable Filter Card */}
      <section className="no-print border border-border bg-white p-6 rounded-2xl shadow-soft font-display text-left flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3 mb-1">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-brand flex items-center gap-1.5">
              <span>⚡</span> Filter Directory
            </h3>
            <p className="text-[11px] text-mist font-semibold mt-0.5">Narrow down member profiles and check their metrics.</p>
          </div>
          <button
            className="inline-flex h-8 items-center justify-center gap-2 border border-border bg-white px-4 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:border-brand hover:text-brand rounded-lg shadow-xs"
            type="button"
            onClick={load}
            disabled={loading}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3 lg:grid-cols-4 items-end">
          <label className="grid gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mist flex items-center gap-1">🔍 Search Directory</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist" size={14} />
              <input
                className="h-9 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-xs focus-visible:border-brand focus-visible:outline-none focus:outline-none focus:border-brand"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search TSF ID, name, or email"
              />
            </div>
          </label>

          <label className="grid gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mist">👤 Member Type</span>
            <select
              className="h-9 border border-border bg-white px-3 text-xs rounded-lg focus-visible:border-brand focus-visible:outline-none focus:outline-none"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
            >
              <option value="all">All Types</option>
              <option value="volunteer">Volunteer</option>
              <option value="intern">Intern</option>
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mist">🟢 Status</span>
            <select
              className="h-9 border border-border bg-white px-3 text-xs rounded-lg focus-visible:border-brand focus-visible:outline-none focus:outline-none"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
            >
              <option value="all">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Suspended">Suspended</option>
            </select>
          </label>

          <button
            className="h-9 border border-border hover:border-brand hover:text-brand bg-white px-4 text-xs font-bold uppercase tracking-wider transition-all rounded-lg"
            type="button"
            onClick={() => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); }}
          >
            Clear Filters
          </button>
        </div>
      </section>

      {/* Modernized Table Card */}
      <section className="rounded-2xl border border-border bg-white shadow-soft overflow-hidden">
        <div className="border-b border-border/60 bg-paper/20 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-brand flex items-center gap-1.5">
              <span>👥</span> Onboarded Members Directory
            </h2>
            <p className="text-[10px] text-mist font-semibold mt-0.5">Approved members who have initialized their workspace profiles.</p>
          </div>
          <span className="text-xs font-extrabold text-mist bg-white border px-3 py-1 rounded-full">
            {filtered.length.toLocaleString("en-IN")} members
          </span>
        </div>

        <div className="overflow-auto max-h-[600px] relative">
          <table className="w-full min-w-[1140px] border-collapse text-left text-xs">
            <thead className="sticky top-0 z-20 bg-paper/80 backdrop-blur-xs border-b border-border">
              <tr className="text-[10px] uppercase tracking-widest text-mist font-black">
                <th className="p-4 pl-6">Member ID / Details</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Start Date</th>
                <th className="p-4">Expected End</th>
                <th className="p-4">Hours</th>
                <th className="p-4">Activities</th>
                <th className="p-4">Contribution Progress</th>
                <th className="p-4 text-center">Completed</th>
                <th className="p-4 pr-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-8 text-center font-bold text-mist" colSpan={10}>Loading members directory...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="p-8 text-center" colSpan={10}>
                    <div className="flex flex-col items-center justify-center gap-2 p-6 font-display">
                      <p className="font-bold text-ink text-sm">No Members Found</p>
                      <p className="text-xs text-mist font-medium">Members approved from the applications portal will appear here.</p>
                      <Link 
                        href="/admin/applications"
                        className="mt-3 inline-flex px-4 py-2 border border-brand bg-brand text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:bg-ink transition-all"
                      >
                        Go to Applications
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((member, index) => {
                  const progressPct = Math.min(Math.round((member.hours / DEFAULT_CONTRIBUTION_GOAL) * 100), 100);
                  const nameInitials = member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "M";
                  return (
                    <tr 
                      key={member.id} 
                      className={`border-b border-border last:border-0 hover:bg-brand-light/30 transition-all duration-200 ${
                        index % 2 === 0 ? "bg-white" : "bg-paper/10"
                      }`}
                    >
                      {/* Name Details with Avatar Initials */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-light text-brand font-black text-xs flex items-center justify-center border border-brand/20 shadow-xs shrink-0 select-none">
                            {nameInitials}
                          </div>
                          <div>
                            <div className="font-bold text-ink text-xs flex items-center gap-1.5">
                              {member.name}
                            </div>
                            <div className="text-[10px] text-mist font-medium mt-0.5">{member.email}</div>
                            <div className="text-[9px] text-brand font-mono font-bold mt-1 inline-block bg-brand/5 border border-brand/10 px-2 py-0.5 rounded">
                              {member.user_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                          member.role === "volunteer" ? "bg-red-50 text-brand border border-brand/20" : "bg-paper text-ink border border-border/80"
                        }`}>
                          {member.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={member.status} />
                      </td>
                      <td className="p-4 font-semibold text-mist whitespace-nowrap">{formatDate(member.start_date)}</td>
                      <td className="p-4 font-semibold text-mist whitespace-nowrap">{formatDate(member.expected_end_date)}</td>
                      <td className="p-4 font-display font-extrabold text-ink">{member.hours.toLocaleString("en-IN")}h</td>
                      <td className="p-4 font-display font-bold text-ink">{member.activities.toLocaleString("en-IN")}</td>
                      
                      {/* Contribution Progress */}
                      <td className="p-4">
                        <div className="group/progress relative cursor-pointer flex flex-col gap-1.5 max-w-[130px]">
                          {/* Tooltip Content */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/progress:block bg-[#161616] text-white p-3 rounded-lg text-[10px] whitespace-nowrap shadow-xl border border-white/15 z-30 leading-normal pointer-events-none text-left">
                            <p className="font-bold text-[11px] mb-1.5 text-brand uppercase tracking-wider">Outreach Stats</p>
                            <div className="grid gap-0.5">
                              <p>⏰ Hours Logged: <strong>{member.hours}h</strong></p>
                              <p>📊 Activities Logged: <strong>{member.activities}</strong></p>
                              <p>👥 Beneficiaries: <strong>{member.beneficiaries}</strong></p>
                              {member.role === "volunteer" ? (
                                <p>🌳 Trees Planted: <strong>{member.trees}</strong></p>
                              ) : (
                                <p>📚 Deliverables: <strong>{member.deliverables}</strong></p>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-bold text-ink">
                            <span>{progressPct}%</span>
                            <span className="text-mist font-medium">{member.hours} / {DEFAULT_CONTRIBUTION_GOAL} hrs</span>
                          </div>
                          
                          <div className="w-full h-1.5 bg-paper border border-border rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                progressPct >= 80 ? "bg-[#2ecc71]" :
                                progressPct >= 50 ? "bg-[#f1c40f]" :
                                progressPct >= 20 ? "bg-[#e67e22]" : "bg-[#e74c3c]"
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-[8px] text-mist/60 font-semibold block text-right">Goal: {DEFAULT_CONTRIBUTION_GOAL} hrs</span>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-sm border ${
                          member.completed ? "bg-emerald-50 text-emerald-700 border-emerald-600/20" : "bg-paper text-mist border-border"
                        }`}>
                          {member.completed ? "Yes" : "No"}
                        </span>
                      </td>

                      {/* Redesigned actions */}
                      <td className="p-4 pr-6 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            className="inline-flex h-8 items-center gap-1 border border-border bg-paper hover:border-brand hover:text-brand px-3 text-xs font-bold text-ink transition-colors rounded-lg"
                            type="button"
                            onClick={() => {
                              setViewSearch("");
                              setViewProject("");
                              setViewLocation("");
                              setViewFromDate("");
                              setViewToDate("");
                              setSelectedMember(member);
                            }}
                          >
                            👁 View
                          </button>
                          {member.status === "Active" && (
                            <>
                              <button
                                className="inline-flex h-8 items-center gap-1 border border-border bg-paper hover:border-[#167241] hover:text-[#167241] px-3 text-xs font-bold text-ink transition-colors rounded-lg"
                                type="button"
                                onClick={() => setConfirmingAction({ member, type: "Complete" })}
                              >
                                ✔ Complete
                              </button>
                              <button
                                className="inline-flex h-8 items-center gap-1 border border-brand-light bg-[#fff7e8] hover:border-[#9a6500] hover:text-[#9a6500] px-3 text-xs font-bold text-[#9a6500] transition-colors rounded-lg"
                                type="button"
                                onClick={() => setConfirmingAction({ member, type: "Suspend" })}
                              >
                                ⏸ Suspend
                              </button>
                            </>
                          )}
                          {member.status === "Suspended" && (
                            <button
                              className="inline-flex h-8 items-center gap-1 border border-border bg-[#e9f7ef] hover:border-[#167241] hover:text-[#167241] px-3 text-xs font-bold text-[#167241] transition-colors rounded-lg"
                              type="button"
                              onClick={() => setConfirmingAction({ member, type: "Reactivate" })}
                            >
                              ▶ Reactivate
                            </button>
                          )}
                          {member.status === "Completed" && (
                            <span className="text-[10px] font-bold text-mist px-3 py-1.5 bg-paper/60 uppercase tracking-wide rounded-md">
                              Completed
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Confirmation Dialog Modal */}
      {confirmingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 font-display text-left">
          <div className="w-full max-w-md bg-white border border-border p-6 shadow-2xl rounded-2xl animate-fade-in">
            <div className="flex gap-3 mb-4 text-[#9a6500]">
              <AlertTriangle size={24} className="shrink-0" />
              <h3 className="text-lg font-bold text-ink">
                {confirmingAction.type === "Complete" && "Complete Member?"}
                {confirmingAction.type === "Suspend" && "Suspend Member?"}
                {confirmingAction.type === "Reactivate" && "Reactivate Member?"}
              </h3>
            </div>
            <div className="text-xs text-mist leading-relaxed mb-6 font-semibold">
              {confirmingAction.type === "Complete" && (
                confirmingAction.member.hours < DEFAULT_CONTRIBUTION_GOAL ? (
                  <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex flex-col gap-1 font-semibold text-xs leading-normal">
                    <p className="font-bold flex items-center gap-1">⚠️ Hour Threshold Warning</p>
                    <p>This member has completed {confirmingAction.member.hours} of the recommended {DEFAULT_CONTRIBUTION_GOAL} contribution hours. Do you still want to mark them as completed?</p>
                  </div>
                ) : (
                  "Mark Member Completed? This will lock their profile and generate a certificate of completion."
                )
              )}
              {confirmingAction.type === "Suspend" && "Suspend Member? This will immediately prevent the member from accessing their dashboard and submitting activities."}
              {confirmingAction.type === "Reactivate" && "Reactivate Member? This will restore their dashboard access and allow them to log activities."}
            </div>
            <div className="flex justify-end gap-3 border-t border-border/60 pt-4">
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => setConfirmingAction(null)}
                className="border border-border bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink hover:bg-paper rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={executeStatusChange}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider text-white rounded-lg ${
                  confirmingAction.type === "Suspend" ? "bg-brand hover:bg-ink" : "bg-[#167241] hover:bg-ink"
                }`}
              >
                {actionBusy ? "Saving..." : (
                  confirmingAction.type === "Complete" ? "Complete" :
                  confirmingAction.type === "Suspend" ? "Suspend" : "Reactivate"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redesigned View Member Drawer Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/50 backdrop-blur-xs font-display text-left">
          <div className="w-full max-w-4xl bg-white h-full flex flex-col shadow-2xl animate-slide-in p-6">
            <div className="flex justify-between items-start border-b border-border/60 pb-4 mb-6">
              <div>
                <span className="text-[10px] font-black text-brand uppercase tracking-widest bg-brand-light px-2.5 py-1 rounded-full">{selectedMember.role} Profile</span>
                <h2 className="text-2xl font-black text-ink mt-2">{selectedMember.name}</h2>
                <p className="text-xs text-mist font-semibold mt-0.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-mist shrink-0" />
                  {selectedMember.email} · TSF ID: <span className="font-bold text-ink">{selectedMember.user_id}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="border border-border p-2 rounded-xl text-ink hover:border-brand hover:text-brand hover:bg-brand-light/20 transition-colors shadow-xs"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Panels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Profile card */}
              <div className="border border-border rounded-xl p-4 bg-paper/20">
                <h4 className="text-[10px] font-black uppercase text-brand tracking-widest mb-3 flex items-center gap-1">
                  <User className="w-3 h-3" /> Profile Details
                </h4>
                <div className="flex flex-col gap-2.5 text-xs text-ink font-semibold">
                  <div className="flex justify-between">
                    <span className="text-mist font-medium">Status:</span>
                    <StatusBadge status={selectedMember.status} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mist font-medium">Role:</span>
                    <span className="capitalize">{selectedMember.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mist font-medium">TSF ID:</span>
                    <span className="font-mono text-xs">{selectedMember.user_id}</span>
                  </div>
                </div>
              </div>

              {/* Tenure timeline card */}
              <div className="border border-border rounded-xl p-4 bg-paper/20">
                <h4 className="text-[10px] font-black uppercase text-brand tracking-widest mb-3 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Tenure Details
                </h4>
                <div className="flex flex-col gap-2.5 text-xs text-ink font-semibold">
                  <div className="flex justify-between">
                    <span className="text-mist font-medium">Start Date:</span>
                    <span>{formatDate(selectedMember.start_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mist font-medium">Expected End:</span>
                    <span>{formatDate(selectedMember.expected_end_date)}</span>
                  </div>
                  {selectedMember.completed_at && (
                    <div className="flex justify-between">
                      <span className="text-mist font-medium">Completed At:</span>
                      <span>{formatDate(selectedMember.completed_at.slice(0, 10))}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Contribution statistics card */}
              <div className="border border-border rounded-xl p-4 bg-paper/20">
                <h4 className="text-[10px] font-black uppercase text-brand tracking-widest mb-3 flex items-center gap-1">
                  <Award className="w-3 h-3" /> Contribution Summary
                </h4>
                <div className="flex flex-col gap-2.5 text-xs text-ink font-semibold">
                  <div className="flex justify-between">
                    <span className="text-mist font-medium">Hours Completed:</span>
                    <span className="font-black text-brand">{selectedMember.hours} hrs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mist font-medium">Activities:</span>
                    <span>{selectedMember.activities} logs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-mist font-medium">Beneficiaries reached:</span>
                    <span>{selectedMember.beneficiaries} pupils</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Certificate placeholder card */}
            {selectedMember.certificate_number && (
              <div className="border border-[#167241]/20 rounded-xl p-4 bg-[#e9f7ef]/30 flex justify-between items-center mb-6 font-display text-xs">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-[#167241] tracking-widest flex items-center gap-1">
                    🎉 Certification Generated
                  </h4>
                  <p className="text-[11px] text-mist font-bold mt-1">Unique completion license: <span className="font-mono text-brand font-black">{selectedMember.certificate_number}</span></p>
                </div>
                <span className="text-[10px] font-bold text-[#167241] bg-[#e9f7ef] border border-[#167241]/35 px-3 py-1 rounded-full uppercase tracking-wider">
                  VERIFIED CERTIFICATE
                </span>
              </div>
            )}

            {/* Drill-down activities list */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-brand flex items-center gap-1">
                  <span>📋</span> Activities History Log
                </h3>
                <p className="text-[10px] text-mist font-semibold mt-0.5">Filter and inspect all logged submissions from this member.</p>
              </div>

              {/* Filters toolbar */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 border border-border p-4 bg-paper/30 mb-4 rounded-xl text-xs font-display">
                <label className="grid gap-1">
                  <span className="font-bold text-mist uppercase tracking-wide text-[9px]">Search Programme</span>
                  <input
                    className="h-8 border border-border bg-white px-2 focus:outline-brand focus:border-brand rounded-lg text-xs"
                    value={viewSearch}
                    onChange={(e) => setViewSearch(e.target.value)}
                    placeholder="e.g. Teaching"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="font-bold text-mist uppercase tracking-wide text-[9px]">Project / Work</span>
                  <select
                    className="h-8 border border-border bg-white px-2 focus:outline-brand focus:border-brand rounded-lg text-xs"
                    value={viewProject}
                    onChange={(e) => setViewProject(e.target.value)}
                  >
                    <option value="">All Projects</option>
                    {modalFilterOptions.projects.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="font-bold text-mist uppercase tracking-wide text-[9px]">Location</span>
                  <select
                    className="h-8 border border-border bg-white px-2 focus:outline-brand focus:border-brand rounded-lg text-xs"
                    value={viewLocation}
                    onChange={(e) => setViewLocation(e.target.value)}
                  >
                    <option value="">All Locations</option>
                    {modalFilterOptions.locations.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="font-bold text-mist uppercase tracking-wide text-[9px]">From Date</span>
                  <input
                    type="date"
                    className="h-8 border border-border bg-white px-2 focus:outline-brand focus:border-brand rounded-lg text-xs"
                    value={viewFromDate}
                    onChange={(e) => setViewFromDate(e.target.value)}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="font-bold text-mist uppercase tracking-wide text-[9px]">To Date</span>
                  <input
                    type="date"
                    className="h-8 border border-border bg-white px-2 focus:outline-brand focus:border-brand rounded-lg text-xs"
                    value={viewToDate}
                    onChange={(e) => setViewToDate(e.target.value)}
                  />
                </label>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto rounded-xl border border-border bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-paper/60 text-[10px] uppercase text-mist font-bold">
                      <th className="p-3 pl-4">Date</th>
                      <th className="p-3">Programme</th>
                      <th className="p-3">Project / Work</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Hours</th>
                      <th className="p-3">Beneficiaries</th>
                      <th className="p-3 pr-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberActivities.length === 0 ? (
                      <tr>
                        <td className="p-6 text-center font-semibold text-mist" colSpan={7}>No matching activities found.</td>
                      </tr>
                    ) : (
                      memberActivities.map((act, index) => (
                        <tr 
                          key={act.id} 
                          className={`border-b border-border last:border-0 hover:bg-paper/40 ${
                            index % 2 === 0 ? "bg-white" : "bg-paper/10"
                          }`}
                        >
                          <td className="p-3 pl-4 font-semibold text-ink whitespace-nowrap">{formatDate(act.activity_date)}</td>
                          <td className="p-3 font-semibold text-ink">{act.programme_name || act.milestone || "-"}</td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-0.5 text-[9px] font-bold bg-brand/5 text-brand border border-brand/10 rounded uppercase">
                              {act.project_type || act.intern_work_type || "-"}
                            </span>
                          </td>
                          <td className="p-3">{act.location}</td>
                          <td className="p-3 font-bold tabular-nums text-ink">{getTotalHours(act)} hrs</td>
                          <td className="p-3 tabular-nums text-brand font-bold">❤️ {act.beneficiaries_impacted}</td>
                          <td className="p-3 pr-4 max-w-[200px] truncate text-mist font-medium" title={act.remarks || ""}>{act.remarks || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, icon, animTrigger }: { label: string; value: number; icon: React.ReactNode; animTrigger: number }) {
  const count = useCountUp(value, 950, animTrigger);
  return (
    <article className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col justify-between shadow-lg cursor-default font-display relative overflow-hidden text-left min-h-[90px]">
      <div className="flex justify-between items-start">
        <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand">{label}</span>
        <div className="text-white/40">{icon}</div>
      </div>
      <strong className="mt-2 block text-2xl font-black text-white tracking-tight">
        {count.toLocaleString("en-IN")}
      </strong>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  let styleClass = "bg-[#e9f7ef] text-[#167241] border-[#167241]/20";
  let dotColor = "bg-[#167241]";

  if (status === "Completed") {
    styleClass = "bg-[#eaf2f8] text-[#2980b9] border-[#2980b9]/20";
    dotColor = "bg-[#2980b9]";
  } else if (status === "Suspended") {
    styleClass = "bg-[#fdf2f2] text-[#c0392b] border-[#c0392b]/20";
    dotColor = "bg-[#c0392b]";
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full border ${styleClass}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} inline-block shrink-0`} />
      {status}
    </span>
  );
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
