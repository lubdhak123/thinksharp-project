"use client";

import { CheckCircle2, Clock3, RefreshCw, Search, UserRound, XCircle } from "lucide-react";
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

      // TODO: Trigger Rejection Email to the applicant (e.g. "Thank you for applying...")
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
    <div className="grid gap-6">
      {error && (
        <div className="border border-clay bg-brand-light p-4 text-sm font-bold text-clay">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-4">
        <Metric
          label="Pending"
          value={counts.Pending}
          icon={<Clock3 size={20} />}
          active={activeStatus === "Pending"}
          onClick={() => setActiveStatus("Pending")}
        />
        <Metric
          label="Approved"
          value={counts.Approved}
          icon={<CheckCircle2 size={20} />}
          active={activeStatus === "Approved"}
          onClick={() => setActiveStatus("Approved")}
        />
        <Metric
          label="Rejected"
          value={counts.Rejected}
          icon={<XCircle size={20} />}
          active={activeStatus === "Rejected"}
          onClick={() => setActiveStatus("Rejected")}
        />
        <Metric label="Total" value={applications.length} icon={<UserRound size={20} />} />
      </section>

      <section className="flex flex-col gap-3 border border-border bg-white p-4 md:flex-row md:items-end md:justify-between">
        <label className="grid flex-1 gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-mist">
            Search
          </span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mist"
              size={16}
            />
            <input
              className="h-10 w-full border border-border bg-white pl-9 pr-3 text-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, mobile, city, organisation"
            />
          </div>
        </label>

        <label className="grid gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-mist">
            Filter
          </span>
          <select
            className="h-10 min-w-40 border border-border bg-white px-3 text-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
          >
            <option value="all">All</option>
            <option value="volunteer">Volunteer</option>
            <option value="intern">Intern</option>
          </select>
        </label>

        <button
          className="inline-flex h-10 items-center justify-center gap-2 border border-border bg-white px-4 text-sm font-bold text-ink transition-colors hover:border-brand hover:text-brand"
          type="button"
          onClick={load}
        >
          <RefreshCw size={15} />
          Refresh
        </button>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="overflow-auto border border-border bg-white">
          <table className="w-full min-w-[920px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-paper/60 text-[11px] uppercase tracking-wider text-mist">
                <th className="p-4">Applicant</th>
                <th className="p-4">Applying As</th>
                <th className="p-4">Location</th>
                <th className="p-4">Availability</th>
                <th className="p-4">Interest</th>
                <th className="p-4">User ID</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="p-6 text-center font-bold text-mist" colSpan={7}>
                    Loading applications...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="p-6 text-center font-bold text-mist" colSpan={7}>
                    No matching {activeStatus.toLowerCase()} applications.
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr
                    key={app.id}
                    className={`cursor-pointer border-b border-border transition-colors last:border-0 hover:bg-brand-light/40 ${
                      selected?.id === app.id ? "bg-brand-light/60" : ""
                    }`}
                    onClick={() => setSelected(app)}
                  >
                    <td className="p-4">
                      <div className="font-bold text-ink">{app.full_name}</div>
                      <div className="text-xs text-mist">{app.email}</div>
                    </td>
                    <td className="p-4 text-xs font-bold uppercase tracking-wide text-brand">
                      {app.applying_as}
                    </td>
                    <td className="p-4">{joinParts(app.current_city, app.current_state)}</td>
                    <td className="p-4">
                      {joinParts(
                        app.availability,
                        app.hours_per_week ? `${app.hours_per_week} hrs/wk` : null
                      )}
                    </td>
                    <td className="p-4 text-xs font-semibold text-mist">
                      {app.areas_of_interest?.join(", ") || "-"}
                    </td>
                    <td className="p-4 text-xs font-bold text-ink">{app.user_id || "-"}</td>
                    <td className="p-4">
                      <StatusBadge status={app.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <aside className="border border-border bg-white p-5">
          {selected ? (
            <ApplicationDetails
              application={selected}
              saving={savingId === selected.id}
              onApprove={() => changeStatus(selected, "Approved")}
              onReject={() => changeStatus(selected, "Rejected")}
            />
          ) : (
            <div className="grid min-h-64 place-items-center text-center text-sm font-semibold text-mist">
              Select an application to view details.
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
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "article";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`border p-5 text-left transition-colors ${
        active ? "border-brand bg-brand-light" : "border-border bg-white"
      } ${onClick ? "hover:border-brand" : ""}`}
    >
      <div className="flex items-center justify-between gap-4 text-brand">{icon}</div>
      <p className="mt-4 text-sm font-bold text-mist">{label}</p>
      <strong className="mt-1 block text-3xl font-black text-ink">
        {value.toLocaleString("en-IN")}
      </strong>
    </Tag>
  );
}

function ApplicationDetails({
  application,
  saving,
  onApprove,
  onReject,
}: {
  application: Application;
  saving: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="grid gap-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-brand">View Application</p>
        <h2 className="mt-1 text-2xl font-display font-bold tracking-tight text-ink">
          {application.full_name}
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <StatusBadge status={application.status} />
          <span className="bg-paper px-2 py-1 text-[10px] font-bold uppercase text-mist">
            {application.applying_as}
          </span>
          {application.user_id && (
            <span className="bg-paper px-2 py-1 text-[10px] font-bold uppercase text-mist">
              User ID: {application.user_id}
            </span>
          )}
        </div>
      </div>

      <DetailGroup title="Personal">
        <Detail label="DOB" value={formatDate(application.date_of_birth)} />
        <Detail label="Gender" value={application.gender} />
        <Detail label="Mobile" value={application.mobile_number} />
        <Detail label="Email" value={application.email} />
        <Detail label="City / State" value={joinParts(application.current_city, application.current_state)} />
      </DetailGroup>

      <DetailGroup title="Professional">
        <Detail label="User ID" value={application.user_id} />
        <Detail label="Auth Link" value={application.auth_user_id ? "Linked" : "Not linked yet"} />
        <Detail label="Current Status" value={application.current_status} />
        <Detail label="Organisation" value={application.organization_name} />
      </DetailGroup>

      <DetailGroup title="Preference">
        <Detail
          label="Dates"
          value={`${formatDate(application.preferred_start_date)} to ${formatDate(
            application.preferred_end_date
          )}`}
        />
        <Detail label="Duration" value={application.expected_duration} />
        <Detail label="Availability" value={application.availability} />
        <Detail label="Hours / Week" value={application.hours_per_week} />
        <Detail label="Mode" value={application.preferred_mode} />
        <Detail label="Interest" value={application.areas_of_interest?.join(", ")} />
      </DetailGroup>

      <DetailGroup title="Referral & Documents">
        <Detail label="Heard About" value={application.hear_about} />
        <Detail label="Reference" value={application.reference_name} />
        <Detail label="LinkedIn" value={application.linkedin_profile} />
        {application.resume_url ? (
          <a
            className="text-sm font-bold text-brand underline underline-offset-2"
            href={application.resume_url}
            target="_blank"
            rel="noreferrer"
          >
            Open resume
          </a>
        ) : (
          <Detail label="Resume" value={null} />
        )}
      </DetailGroup>

      <DetailGroup title="Emergency Contact">
        <Detail label="Name" value={application.emergency_contact_name} />
        <Detail label="Relationship" value={application.emergency_contact_relationship} />
        <Detail label="Mobile" value={application.emergency_contact_mobile} />
      </DetailGroup>

      <DetailGroup title="Declarations">
        <Detail label="Accuracy Info" value={application.declaration_accuracy ? "Yes" : "No"} />
        <Detail label="Unpaid Role" value={application.declaration_unpaid ? "Yes" : "No"} />
        <Detail label="Safeguarding" value={application.declaration_safeguarding ? "Yes" : "No"} />
        <Detail label="Code of Conduct" value={application.declaration_code_of_conduct ? "Yes" : "No"} />
        <Detail label="Media Consent" value={application.declaration_media_consent ? "Yes (Optional)" : "No"} />
      </DetailGroup>

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          className="inline-flex items-center justify-center gap-2 bg-brand px-4 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-ink disabled:opacity-50"
          type="button"
          onClick={onApprove}
          disabled={saving || application.status === "Approved"}
        >
          <CheckCircle2 size={16} />
          Approve
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 border border-border bg-white px-4 py-3 text-sm font-bold uppercase tracking-wide text-ink hover:border-brand hover:text-brand disabled:opacity-50"
          type="button"
          onClick={onReject}
          disabled={saving || application.status === "Rejected"}
        >
          <XCircle size={16} />
          Reject
        </button>
      </div>
    </div>
  );
}

function DetailGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-4">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-brand">{title}</h3>
      <div className="grid gap-2">{children}</div>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 text-sm">
      <span className="font-bold text-mist">{label}</span>
      <span className="text-ink">{value || "-"}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: "bg-[#fff7e8] text-[#9a6500]",
    Approved: "bg-[#e9f7ef] text-[#167241]",
    Rejected: "bg-brand-light text-brand",
  };

  return (
    <span
      className={`inline-block px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
        styles[status] ?? "bg-paper text-mist"
      }`}
    >
      {status}
    </span>
  );
}

function joinParts(...parts: Array<string | number | null | undefined>) {
  const value = parts.filter(Boolean).join(" - ");
  return value || "-";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
