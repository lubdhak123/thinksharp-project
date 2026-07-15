"use client";

import { Briefcase, Clock3, RefreshCw, Search, UserRound, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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

export function AdminMembersClient() {
  const [members, setMembers] = useState<Member[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Member drill-down view modal
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
      
      // TODO: Placeholders for Email Notifications
      if (type === "Complete") {
        console.log(`[TODO] Trigger Completion/Certificate Email to ${member.email} containing certificate no ${certNo}`);
      } else if (type === "Suspend") {
        console.log(`[TODO] Trigger Account Suspended notification to ${member.email}`);
      } else if (type === "Reactivate") {
        console.log(`[TODO] Trigger Account Reactivated notification to ${member.email}`);
      }

      await load();
      setConfirmingAction(null);
      
      if (selectedMember && selectedMember.id === member.id) {
        setSelectedMember(null); // Close view details drawer to avoid stale visual data
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update member status.");
    } finally {
      setActionBusy(false);
    }
  }

  // Filter selected member's activities inside View Drawer
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

  // Dynamic filter lists inside View Drawer
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
    <div className="grid gap-6">
      {error && <div className="border border-red-500 bg-red-50 p-4 text-sm font-bold text-red-700 font-display">{error}</div>}

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Total Members" value={totals.total} icon={<UserRound size={20} />} />
        <Metric label="Volunteers" value={totals.volunteers} icon={<UserRound size={20} />} />
        <Metric label="Interns" value={totals.interns} icon={<Briefcase size={20} />} />
        <Metric label="Completed" value={totals.completed} icon={<Clock3 size={20} />} />
      </section>

      <section className="grid gap-3 border border-border bg-white p-4 lg:grid-cols-[1fr_180px_180px_auto] lg:items-end">
        <label className="grid gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-mist">Search</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist" size={16} />
            <input
              className="h-10 w-full border border-border bg-white pl-9 pr-3 text-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search TSF ID, name, or email"
            />
          </div>
        </label>

        <label className="grid gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-mist">Type</span>
          <select
            className="h-10 border border-border bg-white px-3 text-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
          >
            <option value="all">All</option>
            <option value="volunteer">Volunteer</option>
            <option value="intern">Intern</option>
          </select>
        </label>

        <label className="grid gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-mist">Status</span>
          <select
            className="h-10 border border-border bg-white px-3 text-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="all">All</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Suspended">Suspended</option>
          </select>
        </label>

        <button
          className="inline-flex h-10 items-center justify-center gap-2 border border-border bg-white px-4 text-sm font-bold text-ink transition-colors hover:border-brand hover:text-brand disabled:opacity-50"
          type="button"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </section>

      <section className="overflow-auto border border-border bg-white">
        <table className="w-full min-w-[1140px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b-2 border-border bg-paper/60 text-[11px] uppercase tracking-wider text-mist">
              <th className="p-4">TSF ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Status</th>
              <th className="p-4">Start Date</th>
              <th className="p-4">End Date</th>
              <th className="p-4">Hours</th>
              <th className="p-4">Activities</th>
              <th className="p-4">Contribution Progress</th>
              <th className="p-4">Completed</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="p-6 text-center font-bold text-mist" colSpan={11}>Loading members...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td className="p-6 text-center font-bold text-mist" colSpan={11}>No matching members found.</td>
              </tr>
            ) : (
              filtered.map((member) => (
                <tr key={member.id} className="border-b border-border last:border-0 hover:bg-brand-light/30">
                  <td className="p-4 font-black text-brand">{member.user_id}</td>
                  <td className="p-4">
                    <div className="font-bold text-ink">{member.name}</div>
                    <div className="text-xs text-mist">{member.email}</div>
                  </td>
                  <td className="p-4 text-xs font-bold uppercase tracking-wide text-brand">{member.role}</td>
                  <td className="p-4"><StatusBadge status={member.status} /></td>
                  <td className="p-4">{formatDate(member.start_date)}</td>
                  <td className="p-4">{formatDate(member.expected_end_date)}</td>
                  <td className="p-4 font-bold text-ink">{member.hours.toLocaleString("en-IN")}</td>
                  <td className="p-4 font-bold text-ink">{member.activities.toLocaleString("en-IN")}</td>
                  <td className="p-4 font-display">
                    {/* Tooltip Wrapper */}
                    <div className="group/progress relative cursor-pointer flex items-center gap-2">
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

                      {/* Bar & Percentage */}
                      <span className="font-mono font-bold text-xs text-ink">{Math.min(Math.round((member.hours / DEFAULT_CONTRIBUTION_GOAL) * 100), 100)}%</span>
                      
                      <div className="w-14 sm:w-20 h-2 bg-paper border border-border rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            Math.min(Math.round((member.hours / DEFAULT_CONTRIBUTION_GOAL) * 100), 100) >= 80 ? "bg-[#2ecc71]" :
                            Math.min(Math.round((member.hours / DEFAULT_CONTRIBUTION_GOAL) * 100), 100) >= 50 ? "bg-[#f1c40f]" :
                            Math.min(Math.round((member.hours / DEFAULT_CONTRIBUTION_GOAL) * 100), 100) >= 20 ? "bg-[#e67e22]" : "bg-[#e74c3c]"
                          }`}
                          style={{ width: `${Math.min(Math.round((member.hours / DEFAULT_CONTRIBUTION_GOAL) * 100), 100)}%` }}
                        />
                      </div>

                      <span className="text-[10px] text-mist font-semibold shrink-0">{member.hours}/{DEFAULT_CONTRIBUTION_GOAL}h</span>
                    </div>
                  </td>
                  <td className="p-4">{member.completed ? "Yes" : "No"}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="border border-border bg-paper hover:border-brand hover:text-brand px-3 py-1.5 text-xs font-bold text-ink transition-colors"
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
                        View
                      </button>
                      {member.status === "Active" && (
                        <>
                          <button
                            className="border border-border bg-paper hover:border-[#167241] hover:text-[#167241] px-3 py-1.5 text-xs font-bold text-ink transition-colors"
                            type="button"
                            onClick={() => setConfirmingAction({ member, type: "Complete" })}
                          >
                            Mark Completed
                          </button>
                          <button
                            className="border border-brand-light bg-[#fff7e8] hover:border-[#9a6500] hover:text-[#9a6500] px-3 py-1.5 text-xs font-bold text-[#9a6500] transition-colors"
                            type="button"
                            onClick={() => setConfirmingAction({ member, type: "Suspend" })}
                          >
                            Suspend
                          </button>
                        </>
                      )}
                      {member.status === "Suspended" && (
                        <button
                          className="border border-border bg-[#e9f7ef] hover:border-[#167241] hover:text-[#167241] px-3 py-1.5 text-xs font-bold text-[#167241] transition-colors"
                          type="button"
                          onClick={() => setConfirmingAction({ member, type: "Reactivate" })}
                        >
                          Reactivate
                        </button>
                      )}
                      {member.status === "Completed" && (
                        <span className="text-xs font-bold text-mist px-3 py-1.5 bg-paper/60 uppercase tracking-wide">
                          Completed
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {/* Confirmation Dialog Modal */}
      {confirmingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 font-display">
          <div className="w-full max-w-md bg-white border border-border p-6 shadow-soft">
            <div className="flex gap-3 mb-4 text-[#9a6500]">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold text-ink">
                {confirmingAction.type === "Complete" && "Complete Member?"}
                {confirmingAction.type === "Suspend" && "Suspend Member?"}
                {confirmingAction.type === "Reactivate" && "Reactivate Member?"}
              </h3>
            </div>
            <div className="text-sm text-mist leading-relaxed mb-6">
              {confirmingAction.type === "Complete" && (
                confirmingAction.member.hours < DEFAULT_CONTRIBUTION_GOAL ? (
                  <div className="bg-red-50 border border-red-100 text-red-700 p-3 rounded-lg flex flex-col gap-1 font-semibold text-xs leading-normal">
                    <p className="font-bold">⚠️ Hour Threshold Warning</p>
                    <p>This member has completed {confirmingAction.member.hours} of the recommended {DEFAULT_CONTRIBUTION_GOAL} contribution hours. Do you still want to mark them as completed?</p>
                  </div>
                ) : (
                  "Mark Member Completed? This will lock their profile and generate a certificate of completion."
                )
              )}
              {confirmingAction.type === "Suspend" && "Suspend Member? This will immediately prevent the member from accessing their dashboard and submitting activities."}
              {confirmingAction.type === "Reactivate" && "Reactivate Member? This will restore their dashboard access and allow them to log activities."}
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={actionBusy}
                onClick={() => setConfirmingAction(null)}
                className="border border-border bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink hover:bg-paper"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionBusy}
                onClick={executeStatusChange}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider text-white ${
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

      {/* View Member Drawer Detail Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/45 font-display">
          <div className="w-full max-w-4xl bg-white h-full flex flex-col shadow-soft animate-slide-in p-6">
            <div className="flex justify-between items-start border-b border-border pb-4 mb-6">
              <div>
                <span className="text-[10px] font-bold text-brand uppercase tracking-widest">{selectedMember.role} Profile</span>
                <h2 className="text-2xl font-black text-ink">{selectedMember.name}</h2>
                <p className="text-xs text-mist font-semibold mt-0.5">{selectedMember.email} · TSF ID: <span className="font-bold text-ink">{selectedMember.user_id}</span></p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMember(null)}
                className="border border-border p-2 hover:border-brand hover:text-brand hover:bg-brand-light/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile fields */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-paper/50 p-4 border border-border mb-6 text-sm">
              <div>
                <span className="text-[10px] font-bold text-mist uppercase tracking-wide">Status</span>
                <div className="mt-1"><StatusBadge status={selectedMember.status} /></div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-mist uppercase tracking-wide">Start Date</span>
                <div className="mt-1 font-bold text-ink">{formatDate(selectedMember.start_date)}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-mist uppercase tracking-wide">Expected End Date</span>
                <div className="mt-1 font-bold text-ink">{formatDate(selectedMember.expected_end_date)}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-mist uppercase tracking-wide">Terms Accepted</span>
                <div className="mt-1 font-bold text-ink">
                  {selectedMember.accepted_terms ? (selectedMember.accepted_terms_at ? formatDate(selectedMember.accepted_terms_at.slice(0, 10)) : "Yes") : "No"}
                </div>
              </div>
              {selectedMember.certificate_number && (
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-mist uppercase tracking-wide">Certificate No.</span>
                  <div className="mt-1 font-bold text-brand text-xs font-mono">{selectedMember.certificate_number}</div>
                </div>
              )}
              {selectedMember.completed_at && (
                <div>
                  <span className="text-[10px] font-bold text-mist uppercase tracking-wide">Completed At</span>
                  <div className="mt-1 font-bold text-ink">{formatDate(selectedMember.completed_at.slice(0, 10))}</div>
                </div>
              )}
            </div>

            {/* Drill-down activities list */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-ink">Activities Log</h3>
                <p className="text-xs text-mist">Filter and inspect all logged submissions from this member.</p>
              </div>

              {/* Filters toolbar */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 border border-border p-4 bg-paper/30 mb-4 text-xs font-display">
                <label className="grid gap-1">
                  <span className="font-bold text-mist uppercase tracking-wide text-[9px]">Search Programme</span>
                  <input
                    className="h-8 border border-border bg-white px-2 focus:outline-brand focus:border-brand"
                    value={viewSearch}
                    onChange={(e) => setViewSearch(e.target.value)}
                    placeholder="e.g. Teaching"
                  />
                </label>
                <label className="grid gap-1">
                  <span className="font-bold text-mist uppercase tracking-wide text-[9px]">Project / Work</span>
                  <select
                    className="h-8 border border-border bg-white px-2 focus:outline-brand focus:border-brand"
                    value={viewProject}
                    onChange={(e) => setViewProject(e.target.value)}
                  >
                    <option value="">All</option>
                    {modalFilterOptions.projects.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="font-bold text-mist uppercase tracking-wide text-[9px]">Location</span>
                  <select
                    className="h-8 border border-border bg-white px-2 focus:outline-brand focus:border-brand"
                    value={viewLocation}
                    onChange={(e) => setViewLocation(e.target.value)}
                  >
                    <option value="">All</option>
                    {modalFilterOptions.locations.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1">
                  <span className="font-bold text-mist uppercase tracking-wide text-[9px]">From Date</span>
                  <input
                    type="date"
                    className="h-8 border border-border bg-white px-2 focus:outline-brand focus:border-brand"
                    value={viewFromDate}
                    onChange={(e) => setViewFromDate(e.target.value)}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="font-bold text-mist uppercase tracking-wide text-[9px]">To Date</span>
                  <input
                    type="date"
                    className="h-8 border border-border bg-white px-2 focus:outline-brand focus:border-brand"
                    value={viewToDate}
                    onChange={(e) => setViewToDate(e.target.value)}
                  />
                </label>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto border border-border bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-paper/60 text-[10px] uppercase text-mist font-bold">
                      <th className="p-3">Date</th>
                      <th className="p-3">Programme</th>
                      <th className="p-3">Project / Work</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Hours</th>
                      <th className="p-3">Beneficiaries</th>
                      <th className="p-3">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberActivities.length === 0 ? (
                      <tr>
                        <td className="p-6 text-center font-semibold text-mist" colSpan={7}>No matching activities found.</td>
                      </tr>
                    ) : (
                      memberActivities.map((act) => (
                        <tr key={act.id} className="border-b border-border last:border-0 hover:bg-paper/40">
                          <td className="p-3 font-semibold text-ink">{formatDate(act.activity_date)}</td>
                          <td className="p-3">{act.programme_name || act.milestone || "-"}</td>
                          <td className="p-3">{act.project_type || act.intern_work_type || "-"}</td>
                          <td className="p-3">{act.location}</td>
                          <td className="p-3 font-bold tabular-nums text-ink">{getTotalHours(act)}</td>
                          <td className="p-3 tabular-nums">{act.beneficiaries_impacted}</td>
                          <td className="p-3 max-w-[200px] truncate text-mist" title={act.remarks || ""}>{act.remarks || "-"}</td>
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

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <article className="border border-border bg-white p-5 font-display">
      <div className="flex items-center justify-between gap-4 text-brand">{icon}</div>
      <p className="mt-4 text-sm font-bold text-mist">{label}</p>
      <strong className="mt-1 block text-3xl font-black text-ink">{value.toLocaleString("en-IN")}</strong>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Active: "bg-[#e9f7ef] text-[#167241]",
    Completed: "bg-brand-light text-brand",
    Suspended: "bg-[#fff7e8] text-[#9a6500]",
  };

  return <span className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${styles[status] ?? "bg-paper text-mist"}`}>{status}</span>;
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
