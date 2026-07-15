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
            num_volunteers: 1,
            volunteering_hours: 0,
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
          trees_planted: vol.project_type === "Plantation Drive" ? Number(vol.trees_planted) : 0,
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
    <form onSubmit={onSubmit} className="grid gap-6 max-w-full font-display">
      {!hasSupabaseConfig && (
        <div className="border border-border bg-brand-light p-4 text-sm font-semibold text-ink rounded-2xl">
          Note: Supabase keys are not configured yet. Add them to .env.local before submitting real records.
        </div>
      )}

      {memberLoading && (
        <div className="border border-border bg-paper p-4 text-sm font-semibold text-mist rounded-2xl">
          Loading your member profile...
        </div>
      )}

      {!memberLoading && !member && role !== "admin" && (
        <div className="border border-clay bg-brand-light p-4 text-sm font-bold text-clay rounded-2xl">
          Your member profile is not active yet. Ask an admin to approve your application before submitting activity reports.
        </div>
      )}

      {repeatSource && (
        <div className="border-l-4 border-brand bg-brand-light p-4 text-xs font-semibold text-ink flex flex-col gap-2 font-display rounded-2xl">
          <div>
            <p className="font-bold text-brand uppercase tracking-wider text-[10px]">Using a previous activity as a template.</p>
            <p className="text-mist mt-1 leading-relaxed">Please review the information and update the date and activity numbers before submitting.</p>
          </div>
          <div>
            <button
              type="button"
              onClick={handleClear}
              className="text-brand font-bold underline hover:text-ink text-[11px]"
            >
              Clear Template
            </button>
          </div>
        </div>
      )}

      {showRepeatedBanner && (
        <div className="border-l-4 border-brand bg-brand-light p-4 text-xs font-semibold text-ink flex items-start justify-between font-display animate-fade-in relative rounded-2xl">
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
        <div className="border border-border bg-white p-6 shadow-soft font-display relative flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl text-left">
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-brand mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block animate-pulse" />
              Repeat Last Entry
            </p>
            <h3 className="text-sm font-bold text-ink mb-2">Copy details from your previous submission on this device.</h3>
            <div className="grid grid-cols-2 gap-3 text-xs text-mist md:grid-cols-4 bg-paper/50 p-4 border border-border rounded-xl">
              <div>
                <span className="block font-bold text-[9px] uppercase text-ink/75 tracking-wider mb-0.5">Type</span>
                <span className="capitalize font-semibold text-ink">{lastEntry.entryType}</span>
              </div>
              <div>
                <span className="block font-bold text-[9px] uppercase text-ink/75 tracking-wider mb-0.5">Name</span>
                <span className="truncate block font-semibold text-ink">{lastEntry.shared.volunteer_name}</span>
              </div>
              <div>
                <span className="block font-bold text-[9px] uppercase text-ink/75 tracking-wider mb-0.5">Location</span>
                <span className="truncate block font-semibold text-ink">{lastEntry.shared.location}</span>
              </div>
              <div>
                <span className="block font-bold text-[9px] uppercase text-ink/75 tracking-wider mb-0.5">
                  {lastEntry.entryType === "volunteer" ? "Project" : "Work"}
                </span>
                <span className="truncate block font-semibold text-ink">
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

      {/* ── Basic Information Card ── */}
      <div className="border border-border bg-white p-6 shadow-soft rounded-2xl flex flex-col gap-5 text-left">
        <SectionTitle 
          kicker="Basic Information" 
          title="Identity & Type" 
          description="Enter your full name and select volunteer or intern role classification."
          icon="👤"
        />
        <div className="grid gap-6 md:grid-cols-2">
          <Field label={entryType === "intern" ? "Intern Name" : "Volunteer Name"} icon="👤">
            <input 
              required 
              value={shared.volunteer_name} 
              onChange={(e) => updateShared("volunteer_name", e.target.value)} 
              placeholder="Enter full name" 
              disabled={Boolean(member)}
            />
          </Field>
          
          <label className="grid gap-1.5 text-left font-display">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mist flex items-center gap-1.5">
              <span>⚡</span> Select Entry Type
            </span>
            <div className="grid grid-cols-2 gap-0 border border-border rounded-lg overflow-hidden">
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
      </div>

      {/* ── Conditional Fields render ── */}
      {entryType === "" ? (
        <div className="border border-dashed border-border p-6 text-center text-sm font-semibold text-mist font-display bg-paper/50 rounded-2xl">
          Please enter a name and select Volunteer or Intern above to view the rest of the form.
        </div>
      ) : (
        <div className="grid gap-6 animate-fade-in">
          {/* ── Volunteer-only Fields ── */}
          {entryType === "volunteer" && (
            <>
              {/* Card 1: Type, Organisation & Project */}
              <div className="border border-border bg-white p-6 shadow-soft rounded-2xl flex flex-col gap-5 text-left">
                <SectionTitle 
                  kicker="Volunteer Details" 
                  title="Type, Organisation & Project" 
                  description="Specify your affiliation type, programme assignment, and core project role."
                  icon="📁"
                />
                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Volunteer Type" icon="👥">
                    <select required value={vol.volunteer_type} onChange={(e) => updateVol("volunteer_type", e.target.value as VolunteerType)}>
                      {volunteerTypes.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </Field>
                  
                  <Field label="Programme / Project Name" icon="📁">
                    <input required value={vol.programme_name} onChange={(e) => updateVol("programme_name", e.target.value)} placeholder="e.g. Shiksha Mitra" />
                  </Field>

                  <Field label="Project Type" icon="⚡">
                    <select required value={vol.project_type} onChange={(e) => updateVol("project_type", e.target.value as ProjectType)}>
                      {projectTypes.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </Field>

                  {showOrganisation ? (
                    <Field label="Organisation / Company / College" icon="🏢">
                      <input value={vol.organisation} onChange={(e) => updateVol("organisation", e.target.value)} placeholder="Company or institution name" />
                    </Field>
                  ) : (
                    <div className="hidden md:block" />
                  )}
                </div>
              </div>

              {/* Card 2: Impact Details */}
              <div className="border border-border bg-white p-6 shadow-soft rounded-2xl flex flex-col gap-5 text-left">
                <SectionTitle 
                  kicker="Impact Details" 
                  title="Numbers Captured for Reporting" 
                  description="Record the measurable contribution metrics from this volunteer activity."
                  icon="📊"
                />
                <div className="grid gap-6 md:grid-cols-2">
                  <NumberField label="Number of Volunteers" value={vol.num_volunteers} onChange={(v) => updateVol("num_volunteers", v)} icon="👥" />
                  <NumberField label="Volunteering Hours" value={vol.volunteering_hours} onChange={(v) => updateVol("volunteering_hours", v)} icon="⏰" />
                  <NumberField label="Number of Beneficiaries Impacted" value={vol.beneficiaries_impacted} onChange={(v) => updateVol("beneficiaries_impacted", v)} icon="👥" />
                  {vol.project_type === "Plantation Drive" && (
                    <NumberField label="Trees Planted" value={vol.trees_planted} onChange={(v) => updateVol("trees_planted", v)} icon="🌳" />
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Intern-only Fields ── */}
          {entryType === "intern" && (
            <>
              {/* Card 1: College, Duration & Work Track */}
              <div className="border border-border bg-white p-6 shadow-soft rounded-2xl flex flex-col gap-5 text-left">
                <SectionTitle 
                  kicker="Intern Details" 
                  title="College, Duration & Work Track" 
                  description="Log your organization affiliation, department track, and internship period."
                  icon="📁"
                />
                <div className="grid gap-6 md:grid-cols-2">
                  <Field label="Organisation / College" icon="🏢">
                    <input value={intern.organisation} onChange={(e) => updateIntern("organisation", e.target.value)} placeholder="College or university name" />
                  </Field>
                  <Field label="Department / Track" icon="💻">
                    <select required value={intern.department} onChange={(e) => updateIntern("department", e.target.value as Department)}>
                      {departments.map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Internship Start Date" icon="📅">
                    <input required type="date" value={intern.internship_start_date} onChange={(e) => updateIntern("internship_start_date", e.target.value)} />
                  </Field>
                  <Field label="Internship End Date" icon="📅">
                    <input required type="date" value={intern.internship_end_date} onChange={(e) => updateIntern("internship_end_date", e.target.value)} />
                  </Field>
                  <Field label="Nature of Internship Work" icon="📁">
                    <select required value={intern.intern_work_type} onChange={(e) => updateIntern("intern_work_type", e.target.value as InternWorkType)}>
                      {internWorkTypes.map((workType) => (
                        <option key={workType}>{workType}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Project / Milestone Name" icon="🎯">
                    <input required value={intern.milestone} onChange={(e) => updateIntern("milestone", e.target.value)} placeholder="e.g. Frontend Dashboard" />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Supervisor / Mentor Name" icon="👤">
                      <input value={intern.supervisor_name} onChange={(e) => updateIntern("supervisor_name", e.target.value)} placeholder="Optional" />
                    </Field>
                  </div>
                </div>
              </div>

              {/* Card 2: Impact Details */}
              <div className="border border-border bg-white p-6 shadow-soft rounded-2xl flex flex-col gap-5 text-left">
                <SectionTitle 
                  kicker="Impact Details" 
                  title="Hours and activities" 
                  description="Record completed activities and hours spent during this reporting block."
                  icon="📊"
                />
                <div className="grid gap-6 md:grid-cols-3">
                  <NumberField label="Internship Hours" value={intern.internship_hours} onChange={(v) => updateIntern("internship_hours", v)} icon="⏰" />
                  <NumberField label="Number of Activities Completed" value={intern.deliverables_completed} onChange={(v) => updateIntern("deliverables_completed", v)} icon="📊" />
                  <NumberField label="Number of Beneficiaries Impacted" value={intern.beneficiaries_impacted} onChange={(v) => updateIntern("beneficiaries_impacted", v)} icon="👥" />
                </div>
              </div>
            </>
          )}

          {/* ── Oversight & Verification Card ── */}
          <div className="border border-border bg-white p-6 shadow-soft rounded-2xl flex flex-col gap-5 text-left">
            <SectionTitle 
              kicker="Oversight & Verification" 
              title="Date, Place and Supervisor" 
              description="Complete verification details including target date, location and in-charge supervisor."
              icon="📅"
            />
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Date of Activity" icon="📅">
                <input required type="date" value={shared.activity_date} onChange={(e) => updateShared("activity_date", e.target.value)} />
              </Field>
              <Field label="Location of Activity" icon="📍">
                <input required value={shared.location} onChange={(e) => updateShared("location", e.target.value)} placeholder="e.g. Pune School" />
              </Field>
              <Field label="Staff In-Charge" icon="👤">
                <select required value={shared.staff_in_charge} onChange={(e) => updateShared("staff_in_charge", e.target.value)}>
                  <option value="">Select staff member</option>
                  {staffMembers.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Submitted By" icon="👤">
                <input value={shared.submitted_by} onChange={(e) => updateShared("submitted_by", e.target.value)} placeholder="e.g. Sneha G. (Optional)" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Remarks (Optional)" icon="📝">
                  <textarea
                    rows={4}
                    className="min-h-[110px] w-full"
                    value={shared.remarks}
                    onChange={(e) => updateShared("remarks", e.target.value)}
                    placeholder="Describe what you worked on, achievements, challenges, or any additional information."
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 w-full">
            <button
              disabled={status === "saving"}
              className="btn-press bg-brand text-white px-8 py-3.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:bg-ink hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 h-12 flex items-center justify-center gap-2 font-display w-full sm:w-auto rounded-lg"
              type="submit"
            >
              {status === "saving" ? "Submitting..." : "🚀 Submit Activity"}
            </button>
            <button
              className="border border-border bg-white text-ink px-6 py-3.5 text-xs font-bold uppercase tracking-wider hover:border-brand hover:text-brand transition-all h-12 flex items-center justify-center gap-2 font-display w-full sm:w-auto rounded-lg"
              type="button"
              onClick={handleClear}
            >
              Clear
            </button>
            {message && (
              <p className={`text-xs font-bold font-display px-2 py-1 ${status === "error" ? "text-clay" : "text-[#167241]"}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </form>
  );
}

function SectionTitle({ kicker, title, description, icon }: { kicker: string; title: string; description?: string; icon?: React.ReactNode }) {
  return (
    <div className="font-display text-left">
      <p className="text-[10px] font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
        {icon && <span>{icon}</span>}
        {kicker}
      </p>
      <h3 className="mt-0.5 text-lg font-black text-ink uppercase tracking-wide">{title}</h3>
      {description && <p className="text-xs text-mist mt-0.5 font-semibold">{description}</p>}
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-left font-display">
      <span className="text-[11px] font-bold uppercase tracking-wider text-mist flex items-center gap-1.5">
        {icon && <span>{icon}</span>}
        {label}
      </span>
      <div className="[&_input]:h-10 [&_input]:border [&_input]:border-border [&_input]:px-3 [&_input]:text-sm [&_input]:bg-white [&_input]:w-full [&_input]:transition-all [&_input:focus]:border-brand [&_input:focus]:outline-none [&_input:focus]:ring-1 [&_input:focus]:ring-brand [&_input]:rounded-lg
                      [&_select]:h-10 [&_select]:border [&_select]:border-border [&_select]:px-3 [&_select]:text-sm [&_select]:bg-white [&_select]:w-full [&_select]:transition-all [&_select:focus]:border-brand [&_select:focus]:outline-none [&_select:focus]:ring-1 [&_select:focus]:ring-brand [&_select]:rounded-lg
                      [&_textarea]:border [&_textarea]:border-border [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm [&_textarea]:bg-white [&_textarea]:w-full [&_textarea]:transition-all [&_textarea:focus]:border-brand [&_textarea:focus]:outline-none [&_textarea:focus]:ring-1 [&_textarea:focus]:ring-brand [&_textarea]:rounded-lg">
        {children}
      </div>
    </label>
  );
}

function NumberField({ label, value, onChange, icon, required = true }: { label: string; value: number; onChange: (value: number) => void; icon?: string; required?: boolean }) {
  return (
    <Field label={label} icon={icon}>
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
