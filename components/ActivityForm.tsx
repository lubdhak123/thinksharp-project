"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  departments,
  internWorkTypes,
  projectTypes,
  staffMembers,
  volunteerTypes,
  type Department,
  type InternWorkType,
  type ProjectType,
  type StaffMember,
  type VolunteerType
} from "@/lib/constants";
import { fetchActivities, fetchActivityById, insertActivity } from "@/lib/queries";
import { hasSupabaseConfig } from "@/lib/supabase";
import { fetchCurrentMember } from "@/lib/members";
import type { Activity, ActivityInsert, Member } from "@/lib/types";
import { useLastEntry } from "@/hooks/useLastEntry";
import { useAuth } from "@/hooks/useAuth";

type EntryType = "volunteer" | "intern";
const DEMO_EMAILS = new Set(["admin@thinksharp.org", "volunteer@thinksharp.org", "intern@thinksharp.org"]);

const volunteerDefaults = {
  volunteer_type: "Individual Volunteer" as VolunteerType,
  organisation: "",
  programme_name: "",
  project_type: "Student Teaching" as ProjectType,
  num_volunteers: 1,
  volunteering_hours: 0,
  beneficiaries_impacted: 0,
  trees_planted: 0,
};

const internDefaults = {
  organisation: "",
  department: "Tech" as Department,
  intern_work_type: "Dashboard Development" as InternWorkType,
  milestone: "",
  supervisor_name: "",
  internship_hours: 0,
  deliverables_completed: 0,
  beneficiaries_impacted: 0,
  internship_start_date: "",
  internship_end_date: "",
};

const sharedDefaults = {
  activity_date: new Date().toISOString().slice(0, 10),
  volunteer_name: "",
  location: "",
  remarks: "",
  submitted_by: "",
  staff_in_charge: "",
};


export function ActivityForm({ repeatId }: { repeatId?: string }) {
  const { user, role } = useAuth();
  const { lastEntry, hasLastEntry, saveLastEntry } = useLastEntry();
  const [showRepeatedBanner, setShowRepeatedBanner] = useState(false);
  const [entryType, setEntryType] = useState<EntryType | "">("");
  const [shared, setShared] = useState(sharedDefaults);
  const [vol, setVol] = useState(volunteerDefaults);
  const [intern, setIntern] = useState(internDefaults);
  const [member, setMember] = useState<Member | null>(null);
  const [memberLoading, setMemberLoading] = useState(true);
  const [repeatSource, setRepeatSource] = useState<Activity | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const showOrganisation = entryType === "volunteer" && vol.volunteer_type !== "Individual Volunteer";

  useEffect(() => {
    let ignore = false;

    async function loadMember() {
      if (!user || role === "admin" || !role) {
        setMemberLoading(false);
        return;
      }

      try {
        const currentMember = await fetchCurrentMember(user);
        if (ignore) return;

        setMember(currentMember);
        if (currentMember) {
          setEntryType(currentMember.role);
          setShared((current) => ({
            ...current,
            volunteer_name: currentMember.name,
            submitted_by: currentMember.name,
          }));
        }
      } catch (error) {
        if (!ignore) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "Could not load your member profile.");
        }
      } finally {
        if (!ignore) setMemberLoading(false);
      }
    }

    loadMember();

    return () => {
      ignore = true;
    };
  }, [role, user]);

  function handleRepeatLastEntry() {
    if (!lastEntry) return;

    const lockedEntryType = member?.role ?? lastEntry.entryType;
    setEntryType(lockedEntryType);
    setShared({
      activity_date: new Date().toISOString().slice(0, 10),
      volunteer_name: member?.name ?? lastEntry.shared.volunteer_name,
      location: lastEntry.shared.location,
      remarks: lastEntry.shared.remarks,
      submitted_by: member?.name ?? lastEntry.shared.submitted_by,
      staff_in_charge: lastEntry.shared.staff_in_charge,
    });

    if (lockedEntryType === "volunteer") {
      setVol({
        volunteer_type: lastEntry.vol.volunteer_type as VolunteerType,
        organisation: lastEntry.vol.organisation,
        programme_name: lastEntry.vol.programme_name,
        project_type: lastEntry.vol.project_type as ProjectType,
        num_volunteers: 1,
        volunteering_hours: 0,
        beneficiaries_impacted: 0,
        trees_planted: 0,
      });
      setIntern(internDefaults);
    } else {
      setIntern({
        organisation: lastEntry.intern.organisation,
        department: lastEntry.intern.department as Department,
        intern_work_type: lastEntry.intern.intern_work_type as InternWorkType,
        milestone: lastEntry.intern.milestone,
        supervisor_name: lastEntry.intern.supervisor_name,
        internship_hours: 0,
        deliverables_completed: 0,
        beneficiaries_impacted: 0,
        internship_start_date: lastEntry.intern.internship_start_date,
        internship_end_date: lastEntry.intern.internship_end_date,
      });
      setVol(volunteerDefaults);
    }
    setShowRepeatedBanner(true);
    setStatus("idle");
    setMessage("");
  }

  function handleClearAndStartBlank() {
    handleClear();
    setShowRepeatedBanner(false);
  }

  function getIdentity() {
    const canUseAuthUserId = Boolean(user?.id && user?.email && !DEMO_EMAILS.has(user.email.toLowerCase()));
    return {
      user_id: member?.user_id ?? null,
      auth_user_id: member?.auth_user_id ?? (canUseAuthUserId ? user?.id ?? null : null),
      name: member?.name ?? shared.volunteer_name.trim(),
      role: member?.role ?? entryType,
    };
  }

  function updateShared<T extends keyof typeof shared>(key: T, value: (typeof shared)[T]) {
    setShared((s) => ({ ...s, [key]: value }));
  }
  function updateVol<T extends keyof typeof vol>(key: T, value: (typeof vol)[T]) {
    setVol((v) => ({ ...v, [key]: value }));
  }
  function updateIntern<T extends keyof typeof intern>(key: T, value: (typeof intern)[T]) {
    setIntern((i) => ({ ...i, [key]: value }));
  }

  useEffect(() => {
    let ignore = false;

    async function loadRepeatSource() {
      if (!repeatId) return;

      setStatus("idle");
      setMessage("");
      try {
        const record = await fetchActivityById(repeatId);
        if (!record || ignore) return;

        setRepeatSource(record);
        const lockedEntryType = member?.role ?? record.entry_type;
        setEntryType(lockedEntryType);
        setShared({
          activity_date: new Date().toISOString().slice(0, 10),
          volunteer_name: member?.name ?? record.volunteer_name,
          location: record.location,
          remarks: record.remarks ?? "",
          submitted_by: member?.name ?? record.submitted_by ?? "",
          staff_in_charge: normalizeStaff(record.staff_in_charge),
        });

        if (lockedEntryType === "volunteer") {
          setVol({
            volunteer_type: record.volunteer_type ?? volunteerDefaults.volunteer_type,
            organisation: record.organisation ?? "",
            programme_name: record.programme_name ?? "",
            project_type: normalizeProjectType(record.project_type),
            num_volunteers: 0,
            volunteering_hours: record.volunteering_hours ?? (Number(record.individual_hours ?? 0) + Number(record.group_hours ?? 0)),
            beneficiaries_impacted: 0,
            trees_planted: 0,
          });
          setIntern(internDefaults);
        } else {
          setIntern({
            organisation: record.organisation ?? "",
            department: (record.department as Department | null) ?? internDefaults.department,
            intern_work_type: normalizeInternWorkType(record.intern_work_type),
            milestone: record.milestone ?? "",
            supervisor_name: record.supervisor_name ?? "",
            internship_hours: 0,
            deliverables_completed: 0,
            beneficiaries_impacted: 0,
            internship_start_date: record.internship_start_date ?? "",
            internship_end_date: record.internship_end_date ?? "",
          });
          setVol(volunteerDefaults);
        }
      } catch (error) {
        if (!ignore) {
          setStatus("error");
          setMessage(error instanceof Error ? error.message : "Could not load repeated record.");
        }
      }
    }

    loadRepeatSource();
    return () => {
      ignore = true;
    };
  }, [member, repeatId]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");

    const identity = getIdentity();
    if (role !== "admin" && !identity.user_id) {
      setStatus("error");
      setMessage("Your member profile is not ready yet. Ask an admin to approve your application first.");
      return;
    }

    const payload: ActivityInsert = identity.role === "volunteer"
      ? {
          user_id: identity.user_id,
          auth_user_id: identity.auth_user_id,
          entry_type: "volunteer",
          activity_date: shared.activity_date,
          volunteer_name: identity.name,
          location: shared.location.trim(),
          remarks: shared.remarks.trim() || null,
          submitted_by: shared.submitted_by.trim() || null,
          staff_in_charge: shared.staff_in_charge.trim(),
          volunteer_type: vol.volunteer_type,
          organisation: showOrganisation ? vol.organisation.trim() || null : null,
          programme_name: vol.programme_name.trim(),
          project_type: vol.project_type,
          num_volunteers: Number(vol.num_volunteers),
          volunteering_hours: Number(vol.volunteering_hours),
          beneficiaries_impacted: Number(vol.beneficiaries_impacted),
          trees_planted: Number(vol.trees_planted),
          activities_completed: null,
          individual_hours: null,
          group_hours: null,
          // intern fields null
          department: null,
          supervisor_name: null,
          milestone: null,
          internship_hours: null,
          deliverables_completed: null,
          intern_work_type: null,
          internship_start_date: null,
          internship_end_date: null,
        }
      : {
          user_id: identity.user_id,
          auth_user_id: identity.auth_user_id,
          entry_type: "intern",
          activity_date: shared.activity_date,
          volunteer_name: identity.name,
          location: shared.location.trim(),
          remarks: shared.remarks.trim() || null,
          submitted_by: shared.submitted_by.trim() || null,
          staff_in_charge: shared.staff_in_charge.trim(),
          // volunteer fields null
          volunteer_type: null,
          programme_name: null,
          project_type: null,
          num_volunteers: null,
          individual_hours: null,
          group_hours: null,
          volunteering_hours: null,
          trees_planted: null,
          activities_completed: null,
          // intern fields
          organisation: intern.organisation.trim() || null,
          department: intern.department,
          intern_work_type: intern.intern_work_type,
          milestone: intern.milestone.trim(),
          supervisor_name: intern.supervisor_name.trim() || null,
          internship_hours: Number(intern.internship_hours),
          deliverables_completed: Number(intern.deliverables_completed),
          beneficiaries_impacted: Number(intern.beneficiaries_impacted),
          internship_start_date: intern.internship_start_date || null,
          internship_end_date: intern.internship_end_date || null,
        };

    try {
      const sameDay = await fetchActivities({ from: payload.activity_date, to: payload.activity_date });
      const isDuplicate = payload.user_id
        ? sameDay.some((record) => {
            if (record.user_id !== payload.user_id || record.entry_type !== payload.entry_type) return false;
            if (payload.entry_type === "volunteer") {
              return record.programme_name === payload.programme_name && record.project_type === payload.project_type;
            }
            return record.milestone === payload.milestone && record.intern_work_type === payload.intern_work_type;
          })
        : false;

      if (isDuplicate) {
        setStatus("error");
        setMessage("A similar activity has already been submitted for your profile on this date.");
        return;
      }

      await insertActivity(payload);
      saveLastEntry({
        entryType: identity.role as EntryType,
        shared: {
          volunteer_name: identity.name,
          location: shared.location,
          remarks: shared.remarks,
          submitted_by: shared.submitted_by,
          staff_in_charge: shared.staff_in_charge,
        },
        vol: {
          volunteer_type: vol.volunteer_type,
          organisation: vol.organisation,
          programme_name: vol.programme_name,
          project_type: vol.project_type,
        },
        intern: {
          organisation: intern.organisation,
          department: intern.department,
          intern_work_type: intern.intern_work_type,
          milestone: intern.milestone,
          supervisor_name: intern.supervisor_name,
          internship_start_date: intern.internship_start_date,
          internship_end_date: intern.internship_end_date,
        }
      });
      setStatus("success");
      setMessage("Activity submitted successfully.");
      setShared({
        ...sharedDefaults,
        activity_date: new Date().toISOString().slice(0, 10),
        volunteer_name: identity.name,
        submitted_by: identity.name,
      });
      setVol(volunteerDefaults);
      setIntern(internDefaults);
      setEntryType(identity.role as EntryType);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not submit activity.");
    }
  }

  function handleClear() {
    setShared({
      ...sharedDefaults,
      activity_date: new Date().toISOString().slice(0, 10),
      volunteer_name: member?.name ?? "",
      submitted_by: member?.name ?? "",
    });
    setVol(volunteerDefaults);
    setIntern(internDefaults);
    setEntryType(member?.role ?? "");
    setRepeatSource(null);
    setStatus("idle");
    setMessage("");
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6 rounded-none border border-border bg-white p-6">
      {!hasSupabaseConfig && (
        <div className="border border-border bg-brand-light p-4 text-sm font-semibold text-ink">
          Note: Supabase keys are not configured yet. Add them to .env.local before submitting real records.
        </div>
      )}

      {memberLoading && (
        <div className="border border-border bg-paper p-4 text-sm font-semibold text-mist">
          Loading your member profile...
        </div>
      )}

      {!memberLoading && !member && role !== "admin" && (
        <div className="border border-clay bg-brand-light p-4 text-sm font-bold text-clay">
          Your member profile is not active yet. Ask an admin to approve your application before submitting activity reports.
        </div>
      )}

      {repeatSource && (
        <div className="border border-brand bg-brand-light p-4 text-sm font-semibold text-ink">
          Repeating {repeatSource.entry_type === "intern" ? repeatSource.milestone : repeatSource.programme_name} from {repeatSource.activity_date} - update the date and numbers below.{" "}
          <Link className="font-bold text-brand underline underline-offset-2" href="/submit" onClick={handleClear}>
            Start blank instead
          </Link>
        </div>
      )}

      {showRepeatedBanner && (
        <div className="border-l-4 border-brand bg-brand-light p-4 text-xs font-semibold text-ink flex items-start justify-between font-display animate-fade-in relative">
          <div>
            <p className="font-bold text-brand flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand" />
              Repeated from your last entry.
            </p>
            <p className="text-mist mt-1">Please update today&apos;s date and reporting numbers before submitting.</p>
            <button
              type="button"
              onClick={handleClearAndStartBlank}
              className="mt-2 text-brand font-bold underline hover:text-ink block text-left"
            >
              Clear and start blank
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowRepeatedBanner(false)}
            className="text-mist hover:text-ink font-bold p-1 absolute top-2 right-2 text-sm"
            aria-label="Dismiss banner"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Repeat Last Entry Card ── */}
      {hasLastEntry && lastEntry && (
        <div className="border border-border bg-white p-5 shadow-sm font-display relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block" />
              Repeat Last Entry
            </p>
            <h3 className="text-sm font-bold text-ink mb-2">Copy details from your previous submission on this device.</h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-mist md:grid-cols-4 bg-paper/40 p-3 border border-border/60">
              <div>
                <span className="block font-bold text-[10px] uppercase text-ink/75 tracking-wider">Type</span>
                <span className="capitalize">{lastEntry.entryType}</span>
              </div>
              <div>
                <span className="block font-bold text-[10px] uppercase text-ink/75 tracking-wider">Name</span>
                <span className="truncate block font-semibold text-ink">{lastEntry.shared.volunteer_name}</span>
              </div>
              <div>
                <span className="block font-bold text-[10px] uppercase text-ink/75 tracking-wider">Location</span>
                <span>{lastEntry.shared.location}</span>
              </div>
              <div>
                <span className="block font-bold text-[10px] uppercase text-ink/75 tracking-wider">
                  {lastEntry.entryType === "volunteer" ? "Project" : "Work"}
                </span>
                <span className="truncate block">
                  {lastEntry.entryType === "volunteer" 
                    ? lastEntry.vol.project_type 
                    : lastEntry.intern.intern_work_type}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRepeatLastEntry}
              className="btn-press bg-brand text-white px-5 py-2.5 text-xs font-bold uppercase tracking-wide hover:bg-ink transition-colors h-11 font-display"
            >
              Repeat Last Entry
            </button>
          </div>
        </div>
      )}

      {/* ── Basic Information: Name & Entry Type selector ── */}
      <SectionTitle kicker="Basic Information" title="Identity & Type" />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label={entryType === "intern" ? "Intern Name" : "Volunteer Name"}>
          <input 
            required 
            value={shared.volunteer_name} 
            onChange={(e) => updateShared("volunteer_name", e.target.value)} 
            placeholder="Enter full name" 
            disabled={Boolean(member)}
          />
        </Field>
        
        <label className="grid gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-mist">Select Entry Type</span>
          <div className="grid grid-cols-2 gap-0 border border-border">
            <button
              type="button"
              onClick={() => !member && setEntryType("volunteer")}
              disabled={Boolean(member)}
              className={`h-10 text-xs font-bold uppercase tracking-wide font-display transition-colors duration-200 ${
                entryType === "volunteer"
                  ? "bg-brand text-white"
                  : "bg-paper text-mist hover:text-ink hover:bg-brand-light/10"
              }`}
            >
              Volunteer
            </button>
            <button
              type="button"
              onClick={() => !member && setEntryType("intern")}
              disabled={Boolean(member)}
              className={`h-10 text-xs font-bold uppercase tracking-wide font-display transition-colors duration-200 border-l border-border ${
                entryType === "intern"
                  ? "bg-brand text-white"
                  : "bg-paper text-mist hover:text-ink hover:bg-brand-light/10"
              }`}
            >
              Intern
            </button>
          </div>
        </label>
      </div>

      {/* ── Conditional Fields render ── */}
      {entryType === "" ? (
        <div className="border border-dashed border-border p-6 text-center text-sm font-semibold text-mist font-display bg-paper/50">
          Please enter a name and select Volunteer or Intern above to view the rest of the form.
        </div>
      ) : (
        <div className="grid gap-6 animate-fade-in">
          {/* ── Volunteer-only Fields ── */}
          {entryType === "volunteer" && (
            <>
              <SectionTitle kicker="Volunteer Details" title="Type, Organisation & Project" />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Volunteer Type">
                  <select required value={vol.volunteer_type} onChange={(e) => updateVol("volunteer_type", e.target.value as VolunteerType)}>
                    {volunteerTypes.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
                {showOrganisation && (
                  <Field label="Organisation / Company / College">
                    <input value={vol.organisation} onChange={(e) => updateVol("organisation", e.target.value)} placeholder="Company or institution name" />
                  </Field>
                )}
                <Field label="Programme / Project Name">
                  <input required value={vol.programme_name} onChange={(e) => updateVol("programme_name", e.target.value)} placeholder="e.g. Shiksha Mitra" />
                </Field>
                <Field label="Project Type">
                  <select required value={vol.project_type} onChange={(e) => updateVol("project_type", e.target.value as ProjectType)}>
                    {projectTypes.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <SectionTitle kicker="Impact Details" title="Numbers Captured for Reporting" />
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <NumberField label="Number of Volunteers" value={vol.num_volunteers} onChange={(v) => updateVol("num_volunteers", v)} />
                <NumberField label="Number of Volunteering Hours" value={vol.volunteering_hours} onChange={(v) => updateVol("volunteering_hours", v)} />
                <NumberField label="Number of Beneficiaries Impacted" value={vol.beneficiaries_impacted} onChange={(v) => updateVol("beneficiaries_impacted", v)} />
                <NumberField label="Trees Planted" value={vol.trees_planted} onChange={(v) => updateVol("trees_planted", v)} />
              </div>
            </>
          )}

          {/* ── Intern-only Fields ── */}
          {entryType === "intern" && (
            <>
              <SectionTitle kicker="Intern Details" title="College, Duration & Work Track" />
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Organisation / College">
                  <input value={intern.organisation} onChange={(e) => updateIntern("organisation", e.target.value)} placeholder="College or university name" />
                </Field>
                <Field label="Internship Start Date">
                  <input required type="date" value={intern.internship_start_date} onChange={(e) => updateIntern("internship_start_date", e.target.value)} />
                </Field>
                <Field label="Internship End Date">
                  <input required type="date" value={intern.internship_end_date} onChange={(e) => updateIntern("internship_end_date", e.target.value)} />
                </Field>
                <Field label="Department / Track">
                  <select required value={intern.department} onChange={(e) => updateIntern("department", e.target.value as Department)}>
                    {departments.map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Nature of Internship Work">
                  <select required value={intern.intern_work_type} onChange={(e) => updateIntern("intern_work_type", e.target.value as InternWorkType)}>
                    {internWorkTypes.map((workType) => (
                      <option key={workType}>{workType}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Project / Milestone Name">
                  <input required value={intern.milestone} onChange={(e) => updateIntern("milestone", e.target.value)} placeholder="e.g. Frontend Dashboard" />
                </Field>
                <Field label="Supervisor / Mentor Name">
                  <input value={intern.supervisor_name} onChange={(e) => updateIntern("supervisor_name", e.target.value)} placeholder="Optional" />
                </Field>
              </div>

              <SectionTitle kicker="Impact Details" title="Hours and activities" />
              <div className="grid gap-4 md:grid-cols-3">
                <NumberField label="Internship Hours" value={intern.internship_hours} onChange={(v) => updateIntern("internship_hours", v)} />
                <NumberField label="Number of Activities Completed" value={intern.deliverables_completed} onChange={(v) => updateIntern("deliverables_completed", v)} />
                <NumberField label="Number of Beneficiaries Impacted" value={intern.beneficiaries_impacted} onChange={(v) => updateIntern("beneficiaries_impacted", v)} />
              </div>
            </>
          )}

          {/* ── Shared Details (Date, Location, Supervisor, Remarks, Submitter) ── */}
          <SectionTitle kicker="Oversight & Verification" title="Date, Place and Supervisor" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Date of Activity">
              <input required type="date" value={shared.activity_date} onChange={(e) => updateShared("activity_date", e.target.value)} />
            </Field>
            <Field label="Location of Activity">
              <input required value={shared.location} onChange={(e) => updateShared("location", e.target.value)} placeholder="e.g. Pune School" />
            </Field>
            <Field label="Staff In-Charge">
              <select required value={shared.staff_in_charge} onChange={(e) => updateShared("staff_in_charge", e.target.value)}>
                <option value="">Select staff member</option>
                {staffMembers.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Submitted By">
              <input value={shared.submitted_by} onChange={(e) => updateShared("submitted_by", e.target.value)} placeholder="e.g. Sneha G. (Optional)" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Remarks (Optional)">
                <textarea
                  rows={3}
                  value={shared.remarks}
                  onChange={(e) => updateShared("remarks", e.target.value)}
                  placeholder="Describe what you worked on, achievements, challenges, or any additional information."
                />
              </Field>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              disabled={status === "saving"}
              className="rounded-none bg-brand px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-white transition-colors duration-200 hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:opacity-50 h-11 font-display"
              type="submit"
            >
              {status === "saving" ? "Submitting..." : "Submit Activity"}
            </button>
            <button
              className="rounded-none border border-border bg-white px-6 py-2.5 text-sm font-bold uppercase tracking-wide text-ink hover:border-brand hover:text-brand transition-all h-11 font-display"
              type="button"
              onClick={handleClear}
            >
              Clear
            </button>
            {message && <p className={`text-sm font-bold ${status === "error" ? "text-clay" : "text-brand"}`}>{message}</p>}
          </div>
        </div>
      )}
    </form>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="border-b border-border pb-2 mt-4 first:mt-0 font-display">
      <p className="text-xs font-bold uppercase tracking-widest text-brand">{kicker}</p>
      <h2 className="mt-0.5 text-lg font-bold text-ink uppercase tracking-wide">{title}</h2>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-mist">{label}</span>
      <div className="[&_input]:h-10 [&_input]:rounded-none [&_input]:border [&_input]:border-border [&_input]:px-3 [&_input]:text-sm [&_input]:bg-white
                      [&_select]:h-10 [&_select]:rounded-none [&_select]:border [&_select]:border-border [&_select]:px-3 [&_select]:text-sm [&_select]:bg-white
                      [&_textarea]:rounded-none [&_textarea]:border [&_textarea]:border-border [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm [&_textarea]:bg-white">
        {children}
      </div>
    </label>
  );
}

function NumberField({ label, value, onChange, required = true }: { label: string; value: number; onChange: (value: number) => void; required?: boolean }) {
  return (
    <Field label={label}>
      <input required={required} min={0} step="0.5" type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </Field>
  );
}

function normalizeProjectType(value: string | null): ProjectType {
  if (value && projectTypes.includes(value as ProjectType)) return value as ProjectType;
  if (value === "Student Session" || value === "STEM Activity" || value === "Computer Session") return "Student Teaching";
  if (value === "Donation Drive") return "Fundraising";
  return volunteerDefaults.project_type;
}

function normalizeInternWorkType(value: string | null): InternWorkType {
  if (value && internWorkTypes.includes(value as InternWorkType)) return value as InternWorkType;
  return internDefaults.intern_work_type;
}

function normalizeStaff(value: string | null): "" | StaffMember {
  if (value && staffMembers.includes(value as StaffMember)) return value as StaffMember;
  return "";
}
