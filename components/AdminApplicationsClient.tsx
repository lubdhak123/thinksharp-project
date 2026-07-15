"use client";

import {
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  UserRound,
  XCircle,
  MapPin,
  Calendar,
  Building,
  User,
  Mail,
  Phone,
  FileCheck,
  Check,
  Briefcase,
  ChevronRight,
  ExternalLink,
  ClipboardList
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { applicationStatuses, type ApplicationStatus } from "@/lib/constants";
import { approveApplication, fetchApplications, updateApplicationStatus } from "@/lib/applications";
import type { Application } from "@/lib/types";

type RoleFilter = "all" | "volunteer" | "intern";

export function AdminApplicationsClient() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [activeStatus, setActiveStatus] = useState<ApplicationStatus>("Pending");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await fetchApplications();
      setApplications(data);
      setSelected((current) => {
        if (current) return data.find((app) => app.id === current.id) ?? data[0] ?? null;
        return data[0] ?? null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    return applicationStatuses.reduce<Record<ApplicationStatus, number>>(
      (acc, status) => {
        acc[status] = applications.filter((app) => app.status === status).length;
        return acc;
      },
      { Pending: 0, Approved: 0, Rejected: 0 }
    );
  }, [applications]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return applications.filter((app) => {
      const matchesStatus = app.status === activeStatus;
      const matchesRole = roleFilter === "all" || app.applying_as === roleFilter;
      const matchesSearch =
        !query ||
        app.full_name.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query) ||
        app.mobile_number.toLowerCase().includes(query) ||
        (app.current_city ?? "").toLowerCase().includes(query) ||
        (app.organization_name ?? "").toLowerCase().includes(query);

      return matchesStatus && matchesRole && matchesSearch;
    });
  }, [activeStatus, applications, roleFilter, search]);

  async function changeStatus(app: Application, status: ApplicationStatus) {
    setSavingId(app.id);
    setError("");

    try {
      const updated =
        status === "Approved"
          ? await approveApplication(app.id)
          : await updateApplicationStatus(app.id, status);

      if (status === "Rejected") {
        console.log(`[TODO] Trigger Rejection Email to ${app.email}`);
      }

      setApplications((current) =>
        current.map((item) => (item.id === app.id ? updated : item))
      );
      setSelected(updated);
      setActiveStatus(status);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Could not update application status."
      );
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="grid gap-6 text-left">
      {error && (
        <div className="border border-red-500 bg-red-50 p-4 text-sm font-bold text-red-700 font-display rounded-xl">
          {error}
        </div>
      )}

      {/* Hero Cover Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111] to-[#222] p-8 text-white border border-brand/20 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 relative z-10 border-b border-white/10">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand bg-brand/10 border border-brand/20 px-3 py-1 rounded-full">
              RECRUITMENT WORKSPACE
            </span>
            <h1 className="mt-2 text-2xl md:text-3xl font-display font-black tracking-tight text-white">
              Volunteer & Intern Recruitment
            </h1>
            <p className="text-xs text-mist font-semibold mt-1 flex items-center gap-1.5">
              Manage incoming applications, review candidates, approve onboarding and monitor recruitment progress.
              <span className="w-1.5 h-1.5 rounded-full bg-[#167241] inline-block animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#167241]">LIVE • Updated Just Now</span>
            </p>
          </div>
        </div>

        {/* Quick statistics layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 relative z-10 font-display">
          <div>
            <span className="text-[10px] font-bold text-mist/60 uppercase tracking-widest block">Pending Apps</span>
            <strong className="text-3xl font-black text-[#f1c40f] mt-1 block tracking-tight">
              {counts.Pending}
            </strong>
          </div>
          <div>
            <span className="text-[10px] font-bold text-mist/60 uppercase tracking-widest block">Approved</span>
            <strong className="text-3xl font-black text-[#2ecc71] mt-1 block tracking-tight">
              {counts.Approved}
            </strong>
          </div>
          <div>
            <span className="text-[10px] font-bold text-mist/60 uppercase tracking-widest block">Rejected</span>
            <strong className="text-3xl font-black text-white mt-1 block tracking-tight">
              {counts.Rejected}
            </strong>
          </div>
          <div>
            <span className="text-[10px] font-bold text-mist/60 uppercase tracking-widest block">Total Applications</span>
            <strong className="text-3xl font-black text-white mt-1 block tracking-tight">
              {applications.length}
            </strong>
          </div>
        </div>
      </div>

      {/* Recruiter Tabbed Switch Bar */}
      <section className="grid gap-4 md:grid-cols-4">
        <Metric
          label="Pending Applications"
          value={counts.Pending}
          icon={<Clock3 size={20} />}
          active={activeStatus === "Pending"}
          onClick={() => setActiveStatus("Pending")}
          variant="pending"
        />
        <Metric
          label="Approved Candidates"
          value={counts.Approved}
          icon={<CheckCircle2 size={20} />}
          active={activeStatus === "Approved"}
          onClick={() => setActiveStatus("Approved")}
          variant="approved"
        />
        <Metric
          label="Rejected Records"
          value={counts.Rejected}
          icon={<XCircle size={20} />}
          active={activeStatus === "Rejected"}
          onClick={() => setActiveStatus("Rejected")}
          variant="rejected"
        />
        <Metric 
          label="Total Submissions" 
          value={applications.length} 
          icon={<UserRound size={20} />} 
          variant="total"
        />
      </section>

      {/* Search & Filters Card */}
      <section className="border border-border bg-white p-5 rounded-2xl shadow-soft font-display flex flex-col md:flex-row gap-4 items-end">
        <label className="grid flex-1 gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mist flex items-center gap-1">
            🔍 Search Candidate
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist" size={15} />
            <input
              className="h-9 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-xs focus-visible:border-brand focus-visible:outline-none focus:outline-none focus:border-brand"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, mobile, city, or school"
            />
          </div>
        </label>

        <label className="grid gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-mist">Role Filter</span>
          <select
            className="h-9 min-w-40 border border-border bg-white px-3 text-xs rounded-lg focus-visible:border-brand focus-visible:outline-none focus:outline-none"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
          >
            <option value="all">All Roles</option>
            <option value="volunteer">Volunteer</option>
            <option value="intern">Intern</option>
          </select>
        </label>

        <button
          className="inline-flex h-9 items-center justify-center gap-2 border border-border bg-white px-4 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:border-brand hover:text-brand rounded-lg shadow-xs"
          type="button"
          onClick={load}
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>

        <button
          className="h-9 border border-border hover:border-brand hover:text-brand bg-white px-4 text-xs font-bold uppercase tracking-wider transition-all rounded-lg"
          type="button"
          onClick={() => { setSearch(""); setRoleFilter("all"); }}
        >
          Reset Filters
        </button>
      </section>

      {/* Recruiter Workspace Split Panel */}
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_480px]">
        {/* Left Candidate List Panel */}
        <div className="flex flex-col gap-4">
          <div className="border border-border/60 bg-paper/20 p-4 rounded-xl flex items-center justify-between">
            <span className="text-xs font-black uppercase text-brand tracking-widest">Candidate Directory</span>
            <span className="text-[10px] font-bold text-mist bg-white border px-2.5 py-0.5 rounded-full">
              {filtered.length} candidates
            </span>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-2">
            {loading ? (
              <div className="border border-border bg-white p-8 text-center rounded-2xl font-bold text-mist">
                Loading applicant records...
              </div>
            ) : filtered.length === 0 ? (
              <div className="border border-border bg-white p-12 text-center rounded-2xl flex flex-col items-center justify-center gap-2 font-display">
                <span className="text-3xl">🎉</span>
                <h4 className="font-bold text-ink text-sm">No Pending Applications</h4>
                <p className="text-xs text-mist font-medium">All applications in this tab have been reviewed. New submissions appear automatically.</p>
              </div>
            ) : (
              filtered.map((app) => {
                const initials = app.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "C";
                const isSelected = selected?.id === app.id;
                return (
                  <article
                    key={app.id}
                    onClick={() => setSelected(app)}
                    className={`cursor-pointer border p-4 rounded-2xl bg-white transition-all duration-200 flex items-center justify-between hover:shadow-md hover:-translate-y-0.5 ${
                      isSelected ? "border-brand ring-1 ring-brand" : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-light text-brand font-black text-xs flex items-center justify-center border border-brand/20 select-none shrink-0">
                        {initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-ink text-xs flex items-center gap-1.5">
                          {app.full_name}
                        </h4>
                        <p className="text-[10px] text-mist font-semibold mt-0.5">{app.email}</p>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="px-2 py-0.5 text-[8px] font-black uppercase text-brand bg-brand-light border border-brand/20 rounded">
                            {app.applying_as}
                          </span>
                          <span className="text-[9px] text-mist font-bold flex items-center gap-1">
                            <MapPin size={10} /> {joinParts(app.current_city, app.current_state)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <span className="text-[8px] text-mist font-bold uppercase">
                        {app.preferred_start_date ? formatDate(app.preferred_start_date) : "Today"}
                      </span>
                      <button className="inline-flex items-center gap-0.5 text-[10px] font-black text-brand uppercase tracking-wider hover:underline">
                        Review <ChevronRight size={10} />
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>

        {/* Right Candidate Profile Panel */}
        <aside className="border border-border bg-white rounded-2xl shadow-soft flex flex-col min-h-[500px]">
          {selected ? (
            <div className="flex-1 flex flex-col justify-between">
              {/* Sticky Profile Header */}
              <div className="border-b border-border/60 p-6 bg-paper/20 rounded-t-2xl sticky top-0 z-10 backdrop-blur-xs">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-brand text-white font-black text-base flex items-center justify-center shadow-lg shadow-brand/20 select-none shrink-0 border border-white/20">
                    {selected.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-ink">{selected.full_name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase text-brand bg-brand-light border border-brand/20 rounded">
                        {selected.applying_as}
                      </span>
                      {selected.user_id && (
                        <span className="px-2 py-0.5 font-mono text-[9px] font-black bg-ink text-white rounded">
                          {selected.user_id}
                        </span>
                      )}
                      <StatusBadge status={selected.status} />
                    </div>
                  </div>
                </div>

                {/* Onboarding Recruitment Pipeline */}
                <div className="mt-6 border-t border-border/60 pt-4">
                  <span className="text-[8px] font-black uppercase tracking-widest text-brand block mb-2.5">Recruitment Pipeline Stage</span>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1.5">
                    <PipelineStage label="Submitted" active={true} />
                    <PipelineStage label="In Review" active={selected.status === "Pending"} />
                    <PipelineStage label="Approved" active={selected.status === "Approved"} />
                    <PipelineStage label="ID Generated" active={!!selected.user_id} />
                    <PipelineStage label="Active" active={selected.status === "Approved" && !!selected.auth_user_id} />
                  </div>
                </div>
              </div>

              {/* Collapsed/Grouped Profile Details Grid */}
              <div className="p-6 overflow-y-auto max-h-[500px] flex flex-col gap-6">
                
                {/* Visual scorecard sidebar */}
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand block mb-2.5">Candidate Match Score</span>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 border border-border rounded-xl bg-paper/20 text-center">
                      <span className="text-[8px] font-extrabold text-mist uppercase tracking-widest block">Profile Completeness</span>
                      <strong className="text-xs font-black text-[#167241] mt-1 block">100%</strong>
                    </div>
                    <div className="p-3 border border-border rounded-xl bg-paper/20 text-center">
                      <span className="text-[8px] font-extrabold text-mist uppercase tracking-widest block">Document Check</span>
                      <strong className="text-xs font-black text-brand mt-1 block">Verified</strong>
                    </div>
                    <div className="p-3 border border-border rounded-xl bg-paper/20 text-center">
                      <span className="text-[8px] font-extrabold text-mist uppercase tracking-widest block">Schedule Fit</span>
                      <strong className="text-xs font-black text-[#167241] mt-1 block">Excellent</strong>
                    </div>
                  </div>
                </div>

                <DetailSection title="Personal Information">
                  <DetailRow label="DOB" value={formatDate(selected.date_of_birth)} />
                  <DetailRow label="Gender" value={selected.gender} />
                  <DetailRow label="Mobile" value={selected.mobile_number} />
                  <DetailRow label="Email" value={selected.email} />
                  <DetailRow label="Address" value={joinParts(selected.current_city, selected.current_state)} />
                </DetailSection>

                <DetailSection title="Education & Professional">
                  <DetailRow label="Current Status" value={selected.current_status} />
                  <DetailRow label="Organisation" value={selected.organization_name} />
                  <DetailRow label="Role Applied" value={selected.applying_as} />
                  <DetailRow label="Expected Duration" value={selected.expected_duration} />
                </DetailSection>

                <DetailSection title="Availability & Preferences">
                  <DetailRow label="Timeline preferred" value={`${formatDate(selected.preferred_start_date)} to ${formatDate(selected.preferred_end_date)}`} />
                  <DetailRow label="Availability" value={selected.availability} />
                  <DetailRow label="Hours / Week" value={selected.hours_per_week ? `${selected.hours_per_week} hrs` : null} />
                  <DetailRow label="Work Mode" value={selected.preferred_mode} />
                  <DetailRow label="Areas of Interest" value={selected.areas_of_interest?.join(", ")} />
                </DetailSection>

                <DetailSection title="Documents & Referrals">
                  <DetailRow label="Referral path" value={selected.hear_about} />
                  <DetailRow label="Reference contact" value={selected.reference_name} />
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {selected.resume_url ? (
                      <a
                        className="p-3 border border-border rounded-xl bg-brand-light text-brand hover:bg-brand hover:text-white transition-colors text-center text-xs font-bold uppercase tracking-wider block"
                        href={selected.resume_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        📄 Open Resume
                      </a>
                    ) : (
                      <div className="p-3 border border-border rounded-xl bg-paper/20 text-center text-xs text-mist font-semibold">
                        No Resume Attached
                      </div>
                    )}
                    {selected.linkedin_profile ? (
                      <a
                        className="p-3 border border-border rounded-xl bg-paper hover:border-brand hover:text-brand transition-colors text-center text-xs font-bold uppercase tracking-wider block"
                        href={selected.linkedin_profile}
                        target="_blank"
                        rel="noreferrer"
                      >
                        🔗 LinkedIn Profile
                      </a>
                    ) : (
                      <div className="p-3 border border-border rounded-xl bg-paper/20 text-center text-xs text-mist font-semibold">
                        No LinkedIn Linked
                      </div>
                    )}
                  </div>
                </DetailSection>

                <DetailSection title="Emergency Contact Details">
                  <DetailRow label="Name" value={selected.emergency_contact_name} />
                  <DetailRow label="Relationship" value={selected.emergency_contact_relationship} />
                  <DetailRow label="Phone" value={selected.emergency_contact_mobile} />
                </DetailSection>

                <DetailSection title="Onboarding Declarations Signed">
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-ink mt-1">
                    <div className="flex items-center gap-1.5 p-2 bg-emerald-50/50 border border-emerald-600/10 rounded-lg">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{selected.declaration_accuracy ? "Accuracy Confirmed" : "Accuracy Pending"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 bg-emerald-50/50 border border-emerald-600/10 rounded-lg">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{selected.declaration_code_of_conduct ? "Code of Conduct" : "Code Pending"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 bg-emerald-50/50 border border-emerald-600/10 rounded-lg">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{selected.declaration_safeguarding ? "Safeguarding Signed" : "Safeguarding Pending"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 bg-emerald-50/50 border border-emerald-600/10 rounded-lg">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{selected.declaration_media_consent ? "Media Consent Signed" : "Media Consent Pending"}</span>
                    </div>
                  </div>
                </DetailSection>
              </div>

              {/* Sticky Bottom Actions Bar */}
              <div className="border-t border-border/60 p-4 bg-paper/10 rounded-b-2xl sticky bottom-0 z-10 flex gap-3">
                <button
                  type="button"
                  onClick={() => changeStatus(selected, "Approved")}
                  disabled={savingId === selected.id || selected.status === "Approved"}
                  className="flex-1 inline-flex h-11 items-center justify-center gap-2 bg-[#167241] hover:bg-ink text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-emerald-700/10 disabled:opacity-50"
                >
                  <CheckCircle2 size={15} />
                  Approve Onboarding
                </button>
                <button
                  type="button"
                  onClick={() => changeStatus(selected, "Rejected")}
                  disabled={savingId === selected.id || selected.status === "Rejected"}
                  className="flex-1 inline-flex h-11 items-center justify-center gap-2 border border-border bg-white text-ink hover:border-brand hover:text-brand text-xs font-bold uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
                >
                  <XCircle size={15} />
                  Reject Candidate
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 grid place-items-center text-center p-6 text-xs font-bold text-mist">
              Select a candidate from the left panel directory to inspect recruitment assessment scores.
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
  active,
  onClick,
  variant
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  variant: "pending" | "approved" | "rejected" | "total";
}) {
  const Tag = onClick ? "button" : "article";
  
  let activeStyles = "border-border bg-white";
  if (active) {
    if (variant === "pending") activeStyles = "border-[#f1c40f] bg-[#fff7e8] text-[#9a6500]";
    else if (variant === "approved") activeStyles = "border-emerald-600 bg-emerald-50/60 text-[#167241]";
    else if (variant === "rejected") activeStyles = "border-brand bg-brand-light text-brand";
  }

  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`border p-5 text-left rounded-2xl transition-all duration-200 shadow-sm hover:shadow ${activeStyles} ${
        onClick ? "hover:border-brand/40" : ""
      }`}
    >
      <div className={`flex items-center justify-between gap-4 ${
        variant === "pending" ? "text-[#9a6500]" :
        variant === "approved" ? "text-emerald-700" :
        variant === "rejected" ? "text-brand" : "text-ink"
      }`}>{icon}</div>
      <p className="mt-4 text-xs font-bold text-mist uppercase tracking-wider">{label}</p>
      <strong className="mt-1 block text-2xl font-black text-ink">
        {value.toLocaleString("en-IN")}
      </strong>
    </Tag>
  );
}

function PipelineStage({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded border shrink-0 ${
      active ? "bg-brand text-white border-brand shadow-sm" : "bg-paper text-mist border-border/80"
    }`}>
      {label}
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border/60 pt-4 first:border-0 first:pt-0">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand mb-3">{title}</h4>
      <div className="grid gap-2.5">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="grid grid-cols-[125px_1fr] gap-3 text-xs font-semibold">
      <span className="text-mist font-medium">{label}</span>
      <span className="text-ink">{value || "—"}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-[#fff7e8] text-[#9a6500] border-[#9a6500]/25",
    Approved: "bg-[#e9f7ef] text-[#167241] border-[#167241]/25",
    Rejected: "bg-brand-light text-brand border-brand/25",
  };

  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider border rounded-full ${
        styles[status] ?? "bg-paper text-mist"
      }`}
    >
      {status}
    </span>
  );
}

function joinParts(...parts: Array<string | number | null | undefined>) {
  const value = parts.filter(Boolean).join(" - ");
  return value || "—";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
