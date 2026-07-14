"use client";

import Link from "next/link";
import { Briefcase, CalendarCheck, CheckCircle2, Clock3, FilePlus2, GraduationCap, UserRound } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchCurrentMember } from "@/lib/members";
import { fetchActivities, getTotalHours } from "@/lib/queries";
import type { UserRole, CurrentUser } from "@/hooks/useAuth";
import type { Activity, Member } from "@/lib/types";

type PersonalDashboardClientProps = {
  user: CurrentUser;
  role: Exclude<UserRole, "admin">;
};

export function PersonalDashboardClient({ user, role }: PersonalDashboardClientProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [allApplications, allActivities] = await Promise.all([
        fetchCurrentMember(user),
        fetchActivities(),
      ]);

      setMember(allApplications);
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

  const stats = useMemo(() => {
    const myHours = activities.reduce((total, activity) => total + getTotalHours(activity), 0);
    const beneficiaries = activities.reduce((total, activity) => total + Number(activity.beneficiaries_impacted ?? 0), 0);
    const projects = new Set(
      activities
        .map((activity) => activity.milestone || activity.programme_name || activity.project_type || activity.intern_work_type)
        .filter(Boolean)
    ).size;

    return {
      myHours,
      myActivities: activities.length,
      myBeneficiaries: beneficiaries,
      myProjects: projects,
    };
  }, [activities]);

  const startDate = member?.start_date || earliestDate(activities);
  const expectedCompletionDate = member?.expected_end_date || latestExpectedDate(activities);
  const currentStatus = member?.status ?? "Active";

  return (
    <div className="grid gap-6">
      {error && <div className="border border-clay bg-brand-light p-4 text-sm font-bold text-clay">{error}</div>}

      <section className="border border-border bg-ink p-6 text-white sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="font-display">
            <p className="text-xs font-bold uppercase tracking-widest text-brand">Welcome,</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Hi {displayName}</h1>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/85">
              <UserRound size={14} />
              {roleLabel}
            </div>
          </div>

          {currentStatus === "Active" && (
            <Link
              href="/submit"
              className="inline-flex h-11 items-center justify-center gap-2 bg-brand px-5 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-white hover:text-ink"
            >
              <FilePlus2 size={16} />
              Submit Activity
            </Link>
          )}
        </div>
      </section>

      {loading ? (
        <div className="border border-border bg-white p-5 text-sm font-semibold text-mist">Loading your dashboard...</div>
      ) : (
        <>
          {/* Certificate Download Banner */}
          {currentStatus === "Completed" && (
            <section className="border border-[#167241] bg-[#e9f7ef] p-6 text-[#167241] font-display flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
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

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <PersonalMetric label="My Hours" value={stats.myHours} icon={<Clock3 size={20} />} />
            <PersonalMetric label="My Activities" value={stats.myActivities} icon={<CheckCircle2 size={20} />} />
            <PersonalMetric label="My Beneficiaries" value={stats.myBeneficiaries} icon={<GraduationCap size={20} />} />
            <PersonalMetric label="My Projects" value={stats.myProjects} icon={<Briefcase size={20} />} />
          </section>

          <section className="grid gap-4 lg:grid-cols-4">
            <ProfileField label="Current Status" value={currentStatus} />
            <ProfileField label="Volunteer/Intern Type" value={roleLabel} />
            <ProfileField label="Start Date" value={formatDate(startDate)} />
            <ProfileField label="Expected Completion Date" value={formatDate(expectedCompletionDate)} />
          </section>

          <section className="border border-border bg-white p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand">My Activity Log</p>
                <h2 className="mt-1 text-xl font-display font-bold text-ink">Recent submissions</h2>
              </div>
              <p className="text-sm font-semibold text-mist">{activities.length.toLocaleString("en-IN")} records</p>
            </div>

            {activities.length === 0 ? (
              <div className="grid gap-3 border border-dashed border-border bg-paper p-6 text-center">
                <CalendarCheck className="mx-auto text-brand" size={28} />
                <p className="font-display text-sm font-bold text-ink">No activity reports found for your profile yet.</p>
                <p className="text-sm text-mist">Submit your first activity to start building your contribution summary.</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-border bg-paper/70 text-[11px] uppercase tracking-wider text-mist">
                      <th className="p-3">Date</th>
                      <th className="p-3">Programme</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Hours</th>
                      <th className="p-3">Beneficiaries</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.slice(0, 8).map((activity) => (
                      <tr key={activity.id} className="border-b border-border last:border-0">
                        <td className="p-3 font-semibold text-ink">{formatDate(activity.activity_date)}</td>
                        <td className="p-3">{activity.programme_name || activity.milestone || "-"}</td>
                        <td className="p-3">{activity.project_type || activity.intern_work_type || "-"}</td>
                        <td className="p-3">{getTotalHours(activity).toLocaleString("en-IN")}</td>
                        <td className="p-3">{Number(activity.beneficiaries_impacted ?? 0).toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
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
    <article className="border border-border bg-white p-5 font-display">
      <div className="flex items-center justify-between gap-3 text-brand">{icon}</div>
      <p className="mt-4 text-sm font-bold text-mist">{label}</p>
      <strong className="mt-1 block text-3xl font-black text-ink">{value.toLocaleString("en-IN")}</strong>
    </article>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <article className="border border-border bg-white p-5 font-display">
      <p className="text-[11px] font-bold uppercase tracking-wider text-mist">{label}</p>
      <p className="mt-2 text-lg font-bold text-ink">{value}</p>
    </article>
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
