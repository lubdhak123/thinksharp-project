"use client";

import Link from "next/link";
import { Briefcase, CalendarCheck, CheckCircle2, Clock3, GraduationCap, FilePlus2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchCurrentMember } from "@/lib/members";
import { fetchActivities, getTotalHours } from "@/lib/queries";
import type { UserRole, CurrentUser } from "@/hooks/useAuth";
import type { Activity, Member } from "@/lib/types";

// Modular Dashboard Components
import WelcomeHero from "./dashboard/WelcomeHero";
import ContributionProgress from "./dashboard/ContributionProgress";
import MonthlyHoursChart from "./dashboard/MonthlyHoursChart";
import ActivityDistributionChart from "./dashboard/ActivityDistributionChart";
import BeneficiaryTrendChart from "./dashboard/BeneficiaryTrendChart";
import AchievementGrid from "./dashboard/AchievementGrid";
import RecentTimeline from "./dashboard/RecentTimeline";
import ProfileSummaryCard from "./dashboard/ProfileSummaryCard";

type PersonalDashboardClientProps = {
  user: CurrentUser;
  role: Exclude<UserRole, "admin">;
};

export function PersonalDashboardClient({ user, role }: PersonalDashboardClientProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showGuide, setShowGuide] = useState(false);

  // Filters and sorting state for My Activities log
  const [search, setSearch] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [allApplications, allActivities] = await Promise.all([
        fetchCurrentMember(user),
        fetchActivities(),
      ]);

      setMember(allApplications);
      // Strictly scope activities to the authenticated member only to prevent data leakage
      setActivities(filterPersonalActivities(allActivities, user, role, allApplications));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, [role, user]);

  useEffect(() => {
    load();
  }, [load]);

  const displayName = member?.name || user.name || titleCase(user.email.split("@")[0] || "there");
  const roleLabel = role === "intern" ? "Intern" : "Volunteer";

  // KPIs calculations scoped exclusively to active/submitted/approved records
  const stats = useMemo(() => {
    const activeLogs = activities.filter((activity) => activity.status !== "Rejected");
    const myHours = activeLogs.reduce((total, activity) => total + getTotalHours(activity), 0);
    const beneficiaries = activeLogs.reduce((total, activity) => total + Number(activity.beneficiaries_impacted ?? 0), 0);
    const projects = new Set(
      activeLogs
        .map((activity) => activity.milestone || activity.programme_name || activity.project_type || activity.intern_work_type)
        .filter(Boolean)
    ).size;

    return {
      myHours,
      myActivities: activeLogs.length,
      myBeneficiaries: beneficiaries,
      myProjects: projects,
    };
  }, [activities]);

  const startDate = member?.start_date || earliestDate(activities);
  const expectedCompletionDate = member?.expected_end_date || latestExpectedDate(activities);
  const currentStatus = member?.status ?? "Active";

  // Filtered and Sorted list for display in the table
  const filteredActivities = useMemo(() => {
    let result = [...activities];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (act) =>
          (act.programme_name || "").toLowerCase().includes(q) ||
          (act.milestone || "").toLowerCase().includes(q) ||
          (act.project_type || "").toLowerCase().includes(q) ||
          (act.intern_work_type || "").toLowerCase().includes(q)
      );
    }

    if (projectFilter) {
      result = result.filter(
        (act) => act.project_type === projectFilter || act.intern_work_type === projectFilter
      );
    }

    if (statusFilter) {
      result = result.filter((act) => {
        const actStatus = act.status || "Approved";
        return actStatus === statusFilter;
      });
    }

    if (sortBy === "newest") {
      result.sort((a, b) => b.activity_date.localeCompare(a.activity_date));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => a.activity_date.localeCompare(b.activity_date));
    } else if (sortBy === "hours") {
      result.sort((a, b) => getTotalHours(b) - getTotalHours(a));
    }

    return result;
  }, [activities, search, projectFilter, statusFilter, sortBy]);

  const projectOptions = useMemo(() => {
    return Array.from(
      new Set(
        activities.map((a) => a.project_type || a.intern_work_type).filter(Boolean)
      )
    ) as string[];
  }, [activities]);

  return (
    <div className="grid gap-6">
      {error && <div className="border border-clay bg-brand-light p-4 text-sm font-bold text-clay">{error}</div>}

      <WelcomeHero 
        name={displayName} 
        role={role} 
        status={currentStatus} 
        joinDate={formatDate(startDate)} 
        tsfId={member?.user_id || "N/A"} 
      />

      {loading ? (
        <div className="border border-border bg-white p-5 text-sm font-semibold text-mist">Loading your dashboard...</div>
      ) : (
        <>
          {/* Certificate Download Banner for Completed Members */}
          {currentStatus === "Completed" && (
            <section className="border border-[#167241] bg-[#e9f7ef] p-6 text-[#167241] font-display flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm rounded-2xl">
              <div>
                <h3 className="text-lg font-bold text-ink flex items-center gap-2">
                  <CheckCircle2 className="text-[#167241]" size={20} />
                  Tenure Completed Successfully!
                </h3>
                <p className="text-sm text-mist leading-relaxed mt-1">
                  Thank you for your valuable service and contribution. Your certificate of completion is now available.
                  {member?.certificate_number && (
                    <span className="block mt-1 font-mono text-xs font-bold text-[#167241]">
                      Certificate No: {member.certificate_number}
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (member) {
                    import("@/lib/export").then(({ exportMemberCertificate }) => {
                      exportMemberCertificate(member, {
                        hours: stats.myHours,
                        activities: stats.myActivities,
                        beneficiaries: stats.myBeneficiaries,
                      });
                    });
                  }
                }}
                className="inline-flex h-10 items-center justify-center bg-[#167241] px-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink transition-colors"
              >
                Download Certificate
              </button>
            </section>
          )}

          {/* Standard KPI Cards Grid */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <PersonalMetric label="My Hours" value={stats.myHours} icon={<Clock3 size={20} />} />
            <PersonalMetric label="My Activities" value={stats.myActivities} icon={<CheckCircle2 size={20} />} />
            <PersonalMetric label="My Beneficiaries" value={stats.myBeneficiaries} icon={<GraduationCap size={20} />} />
            <PersonalMetric label="My Projects" value={stats.myProjects} icon={<Briefcase size={20} />} />
          </section>

          {/* Main Visual Panels Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Charts & Timeline Column (col-span-8) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MonthlyHoursChart activities={activities} />
                <BeneficiaryTrendChart activities={activities} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ActivityDistributionChart activities={activities} />
                <RecentTimeline activities={activities} />
              </div>
            </div>

            {/* Sidebar Details Column (col-span-4) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <ContributionProgress totalHours={stats.myHours} />
              <ProfileSummaryCard 
                tsfId={member?.user_id || "N/A"} 
                role={role} 
                status={currentStatus} 
                startDate={startDate} 
                expectedEndDate={expectedCompletionDate} 
              />
              <AchievementGrid stats={stats} activities={activities} />
            </div>

          </div>

          {/* Activities History Section / Table */}
          <section className="border border-border bg-white p-5 rounded-2xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand">My Activities</p>
                <h2 className="mt-1 text-xl font-display font-bold text-ink">Personal Contribution Log</h2>
              </div>
              <p className="text-sm font-semibold text-mist">{filteredActivities.length.toLocaleString("en-IN")} records</p>
            </div>

            {/* Filter toolbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 border border-border p-4 bg-paper/30 mb-4 text-xs font-display">
              <label className="grid gap-1">
                <span className="font-bold text-mist uppercase tracking-wide">Search Activity</span>
                <input
                  className="h-8 border border-border bg-white px-2 focus:outline-brand focus:border-brand"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search project/milestone"
                />
              </label>
              <label className="grid gap-1">
                <span className="font-bold text-mist uppercase tracking-wide">Project / Work</span>
                <select
                  className="h-8 border border-border bg-white px-2 focus:outline-brand focus:border-brand"
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                >
                  <option value="">All</option>
                  {projectOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1">
                <span className="font-bold text-mist uppercase tracking-wide">Status</span>
                <select
                  className="h-8 border border-border bg-white px-2 focus:outline-brand focus:border-brand"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </label>
              <label className="grid gap-1">
                <span className="font-bold text-mist uppercase tracking-wide">Sort By</span>
                <select
                  className="h-8 border border-border bg-white px-2 focus:outline-brand focus:border-brand"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="hours">Hours (Highest)</option>
                </select>
              </label>
            </div>

            {activities.length === 0 ? (
              /* Custom dynamic onboarding empty state */
              <div className="grid gap-3 border border-dashed border-border bg-white p-12 text-center rounded-2xl">
                <span className="text-4xl" role="img" aria-label="rocket">🚀</span>
                <h3 className="font-display text-base font-bold text-ink">Your volunteering journey starts here.</h3>
                <p className="text-xs text-mist max-w-sm mx-auto">
                  Submit your first activity to begin tracking your impact dashboard metrics and unlocking performance badges.
                </p>
                <div className="mt-4 flex flex-col items-center gap-2">
                  {currentStatus === "Active" && (
                    <Link
                      href="/submit"
                      className="inline-flex h-9 items-center justify-center bg-brand px-5 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink transition-colors"
                    >
                      Submit Your First Activity
                    </Link>
                  )}
                  <button 
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="text-xs text-brand font-bold hover:underline"
                  >
                    {showGuide ? "Hide Reporting Guide" : "Learn how activity logging works"}
                  </button>
                </div>
                
                {showGuide && (
                  <div className="mt-6 border-t border-border pt-4 text-left max-w-md mx-auto text-xs text-mist leading-relaxed bg-paper/50 p-4 rounded-lg">
                    <p className="font-bold text-ink mb-1.5">How Logging Works:</p>
                    <ul className="list-disc pl-4 grid gap-1 text-[11px]">
                      <li>Volunteers record time spent teaching, cleanups, plantation drives, or corporate sessions.</li>
                      <li>Interns log hours against AI projects, dashboard dev, surveys, or deliverables.</li>
                      <li>Approved hours automatically update your progress track and unlock custom achievements.</li>
                      <li>Once your tenure completes, you can download your custom landscape completion certificate directly.</li>
                    </ul>
                  </div>
                )}
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="grid gap-3 border border-dashed border-border bg-paper p-6 text-center rounded-xl">
                <CalendarCheck className="mx-auto text-brand" size={28} />
                <p className="font-display text-sm font-bold text-ink">No matching activity reports found.</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-paper/70 text-[11px] uppercase tracking-wider text-mist">
                      <th className="p-3">Date</th>
                      <th className="p-3">Activity</th>
                      <th className="p-3">Hours</th>
                      <th className="p-3">Beneficiaries</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.map((activity) => {
                      const actStatus = activity.status || "Approved";
                      return (
                        <tr key={activity.id} className="border-b border-border last:border-0 hover:bg-paper/25 transition-colors">
                          <td className="p-3 font-semibold text-ink">{formatDate(activity.activity_date)}</td>
                          <td className="p-3">
                            <div className="font-bold text-ink">
                              {activity.programme_name || activity.milestone || "-"}
                            </div>
                            <div className="text-xs text-mist">
                              {activity.project_type || activity.intern_work_type || "-"}
                            </div>
                          </td>
                          <td className="p-3 font-bold text-ink">{getTotalHours(activity).toLocaleString("en-IN")}</td>
                          <td className="p-3">{Number(activity.beneficiaries_impacted ?? 0).toLocaleString("en-IN")}</td>
                          <td className="p-3"><ActivityStatusBadge status={actStatus} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function PersonalMetric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <article className="border border-border bg-white p-5 font-display rounded-2xl shadow-sm hover:shadow transition-shadow">
      <div className="flex items-center justify-between gap-3 text-brand">{icon}</div>
      <p className="mt-4 text-sm font-bold text-mist">{label}</p>
      <strong className="mt-1 block text-3xl font-black text-ink">{value.toLocaleString("en-IN")}</strong>
    </article>
  );
}

function ActivityStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Approved: "bg-[#e9f7ef] text-[#167241] border-[#167241]/20",
    Submitted: "bg-[#fff7e8] text-[#9a6500] border-[#9a6500]/20",
    Rejected: "bg-red-50 text-red-700 border-red-100",
  };

  return (
    <span
      className={`inline-block border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${
        styles[status] ?? "bg-paper text-mist"
      }`}
    >
      {status}
    </span>
  );
}

function filterPersonalActivities(activities: Activity[], user: CurrentUser, role: Exclude<UserRole, "admin">, member: Member | null) {
  const names = new Set(
    [
      member?.name,
      user.name,
      titleCase(user.email.split("@")[0] || ""),
      user.email.split("@")[0],
    ]
      .filter(Boolean)
      .map((value) => normalize(String(value)))
  );

  return activities.filter((activity) => {
    if (activity.entry_type !== role) return false;
    if (member?.user_id && activity.user_id === member.user_id) return true;
    if (member?.auth_user_id && activity.auth_user_id === member.auth_user_id) return true;
    return names.has(normalize(activity.volunteer_name));
  });
}

function normalize(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function titleCase(value: string) {
  return value
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function earliestDate(activities: Activity[]) {
  return activities.map((activity) => activity.activity_date).sort()[0] ?? "";
}

function latestExpectedDate(activities: Activity[]) {
  const dates = activities
    .map((activity) => activity.internship_end_date)
    .filter(Boolean)
    .sort();
  return dates[dates.length - 1] ?? "";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
