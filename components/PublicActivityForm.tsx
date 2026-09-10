"use client";

import Link from "next/link";
import { useState } from "react";
import {
  projectTypes,
  staffMembers,
  volunteerTypes,
  type ProjectType,
  type StaffMember,
  type VolunteerType
} from "@/lib/constants";
import { insertActivity } from "@/lib/queries";
import { insertApplication } from "@/lib/applications";

export function PublicActivityForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [city, setCity] = useState("");
  
  const [volunteerType, setVolunteerType] = useState<VolunteerType>("Individual Volunteer");
  const [organisation, setOrganisation] = useState("");
  const [activityDate, setActivityDate] = useState(new Date().toISOString().slice(0, 10));
  const [programmeName, setProgrammeName] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("Student Teaching");
  const [volunteeringHours, setVolunteeringHours] = useState<number | "">("");
  const [beneficiariesImpacted, setBeneficiariesImpacted] = useState<number | "">("");
  const [treesPlanted, setTreesPlanted] = useState<number | "">("");
  const [staffInCharge, setStaffInCharge] = useState<StaffMember | "">("");
  const [remarks, setRemarks] = useState("");

  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const isSaving = status === "saving";

  function validate() {
    if (!fullName.trim()) return "Full Name is required.";
    if (!email.trim() || !email.includes("@")) return "A valid Email Address is required.";
    if (!mobileNumber.trim()) return "Mobile Number is required.";
    if (!city.trim()) return "City/Location is required.";
    if (!activityDate) return "Activity Date is required.";
    if (!programmeName.trim()) return "Programme Name is required.";
    if (volunteeringHours === "" || Number(volunteeringHours) <= 0) return "Please enter valid Volunteering Hours.";
    if (!staffInCharge) return "Please select Staff In-Charge.";
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const err = validate();
    if (err) {
      setStatus("error");
      setMessage(err);
      return;
    }

    setStatus("saving");
    setMessage("");

    try {
      // 1. Submit basic account info as public volunteer application/profile if new
      try {
        await insertApplication({
          full_name: fullName.trim(),
          date_of_birth: "2000-01-01",
          gender: "Prefer not to say",
          mobile_number: mobileNumber.trim(),
          email: email.trim().toLowerCase(),
          current_city: city.trim(),
          current_state: "Maharashtra",
          applying_as: "volunteer",
          current_status: "Working Professional",
          organization_name: organisation.trim() || "Independent Volunteer",
          preferred_start_date: activityDate,
          preferred_end_date: activityDate,
          expected_duration: "1 Month",
          availability: "Weekends",
          hours_per_week: Number(volunteeringHours),
          preferred_mode: "Offline",
          areas_of_interest: [projectType],
          hear_about: "Public Activity Link",
          reference_name: null,
          resume_url: null,
          linkedin_profile: null,
          emergency_contact_name: fullName.trim(),
          emergency_contact_relationship: "Self",
          emergency_contact_mobile: mobileNumber.trim(),
          declaration_accuracy: true,
          declaration_unpaid: true,
          declaration_safeguarding: true,
          declaration_code_of_conduct: true,
          declaration_media_consent: true,
        });
      } catch (appErr) {
        console.log("Application creation skipped or already registered:", appErr);
      }

      // 2. Submit activity record with status 'Submitted' (awaiting Admin Approval)
      await insertActivity({
        user_id: null,
        auth_user_id: null,
        activity_date: activityDate,
        volunteer_name: fullName.trim(),
        entry_type: "volunteer",
        volunteer_type: volunteerType,
        organisation: organisation.trim() || null,
        location: city.trim(),
        programme_name: programmeName.trim(),
        project_type: projectType,
        num_volunteers: 1,
        volunteering_hours: Number(volunteeringHours),
        beneficiaries_impacted: Number(beneficiariesImpacted || 0),
        trees_planted: Number(treesPlanted || 0),
        activities_completed: 1,
        remarks: remarks.trim() || null,
        submitted_by: `${fullName.trim()} (Public Link)`,
        department: null,
        intern_work_type: null,
        supervisor_name: null,
        milestone: null,
        internship_hours: null,
        deliverables_completed: null,
        internship_start_date: null,
        internship_end_date: null,
        staff_in_charge: staffInCharge,
        status: "Submitted" // Awaiting Admin verification before going live
      });

      setStatus("success");
    } catch (saveError) {
      setStatus("error");
      setMessage(saveError instanceof Error ? saveError.message : "Could not submit activity report.");
    }
  }

  function handleReset() {
    setFullName("");
    setEmail("");
    setMobileNumber("");
    setCity("");
    setOrganisation("");
    setProgrammeName("");
    setVolunteeringHours("");
    setBeneficiariesImpacted("");
    setTreesPlanted("");
    setRemarks("");
    setStaffInCharge("");
    setStatus("idle");
    setMessage("");
  }

  if (status === "success") {
    return (
      <div className="grid gap-6 border border-[#167241]/30 bg-white p-8 text-center font-display sm:p-12 rounded-3xl shadow-xl">
        <div className="mx-auto w-16 h-16 rounded-full bg-[#e9f7ef] text-[#167241] flex items-center justify-center text-3xl font-black shadow-inner">
          🎉
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#167241] bg-[#e9f7ef] px-3 py-1 rounded-full border border-[#167241]/20">
            Submission Received
          </span>
          <h3 className="mt-3 text-2xl font-black text-ink">Thank you, {fullName}!</h3>
          <p className="mt-2 max-w-lg mx-auto text-xs font-semibold text-mist leading-relaxed">
            Your volunteer activity report for <strong className="text-ink">{programmeName}</strong> has been received and is currently under <strong className="text-brand">Admin Review</strong>.
          </p>
        </div>

        <div className="border border-border/80 bg-paper/40 p-4 rounded-2xl text-left text-xs font-semibold grid gap-2 max-w-md mx-auto">
          <div className="flex justify-between border-b border-border/60 pb-1.5">
            <span className="text-mist font-medium">Verification Status:</span>
            <span className="text-amber-700 bg-amber-50 font-bold px-2 py-0.5 rounded text-[10px] uppercase border border-amber-600/20">
              Pending Admin Approval
            </span>
          </div>
          <div className="flex justify-between border-b border-border/60 pb-1.5">
            <span className="text-mist font-medium">Submitted Hours:</span>
            <span className="text-ink font-bold">{volunteeringHours} hrs</span>
          </div>
          <div className="flex justify-between">
            <span className="text-mist font-medium">Impact Recorded:</span>
            <span className="text-brand font-bold">{beneficiariesImpacted || 0} Beneficiaries</span>
          </div>
        </div>

        <p className="text-[11px] text-mist font-medium max-w-md mx-auto">
          Once verified by the ThinkSharp team, your hours and impact will be reflected live on the public foundation dashboard.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button
            onClick={handleReset}
            className="inline-flex h-10 items-center justify-center bg-brand px-6 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink rounded-xl transition-all shadow-md shadow-brand/20"
          >
            Submit Another Report
          </button>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center border border-border bg-white px-6 text-xs font-bold uppercase tracking-wider text-ink hover:border-brand hover:text-brand rounded-xl transition-all"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 font-display">
      {status === "error" && message && (
        <div className="border border-red-500 bg-red-50 p-4 text-xs font-bold text-red-700 rounded-2xl shadow-xs">
          ⚠️ {message}
        </div>
      )}

      {/* Basic Contact Info Section */}
      <section className="border border-border bg-white p-6 sm:p-8 rounded-3xl shadow-soft grid gap-6">
        <div className="border-b border-border/60 pb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand bg-brand-light border border-brand/20 px-3 py-1 rounded-full">
            Step 1 of 2
          </span>
          <h3 className="mt-2 text-lg font-black text-ink">Basic Account & Contact Details</h3>
          <p className="text-xs text-mist font-medium mt-0.5">
            Enter your details so we can credit your volunteer activity to your profile.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs font-bold text-ink">
              Full Name <span className="text-brand">*</span>
            </span>
            <input
              type="text"
              required
              placeholder="e.g. Rahul Sharma"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10 border border-border bg-white px-3 text-xs rounded-xl focus:border-brand focus:outline-none"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-bold text-ink">
              Email Address <span className="text-brand">*</span>
            </span>
            <input
              type="email"
              required
              placeholder="rahul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 border border-border bg-white px-3 text-xs rounded-xl focus:border-brand focus:outline-none"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-bold text-ink">
              Mobile Number <span className="text-brand">*</span>
            </span>
            <input
              type="tel"
              required
              placeholder="e.g. 9876543210"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              className="h-10 border border-border bg-white px-3 text-xs rounded-xl focus:border-brand focus:outline-none"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-bold text-ink">
              City / Location <span className="text-brand">*</span>
            </span>
            <input
              type="text"
              required
              placeholder="e.g. Pune / Mumbai"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="h-10 border border-border bg-white px-3 text-xs rounded-xl focus:border-brand focus:outline-none"
            />
          </label>
        </div>
      </section>

      {/* Activity Details Section */}
      <section className="border border-border bg-white p-6 sm:p-8 rounded-3xl shadow-soft grid gap-6">
        <div className="border-b border-border/60 pb-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand bg-brand-light border border-brand/20 px-3 py-1 rounded-full">
            Step 2 of 2
          </span>
          <h3 className="mt-2 text-lg font-black text-ink">Volunteer Activity Report</h3>
          <p className="text-xs text-mist font-medium mt-0.5">
            Log the work completed, hours spent, and beneficiaries impacted.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1">
            <span className="text-xs font-bold text-ink">Category / Volunteer Type</span>
            <select
              value={volunteerType}
              onChange={(e) => setVolunteerType(e.target.value as VolunteerType)}
              className="h-10 border border-border bg-white px-3 text-xs rounded-xl focus:border-brand focus:outline-none"
            >
              {volunteerTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          {volunteerType !== "Individual Volunteer" && (
            <label className="grid gap-1">
              <span className="text-xs font-bold text-ink">Organisation / Group Name</span>
              <input
                type="text"
                placeholder="e.g. TCS CSR / Rotary Club"
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                className="h-10 border border-border bg-white px-3 text-xs rounded-xl focus:border-brand focus:outline-none"
              />
            </label>
          )}

          <label className="grid gap-1">
            <span className="text-xs font-bold text-ink">
              Activity Date <span className="text-brand">*</span>
            </span>
            <input
              type="date"
              required
              value={activityDate}
              onChange={(e) => setActivityDate(e.target.value)}
              className="h-10 border border-border bg-white px-3 text-xs rounded-xl focus:border-brand focus:outline-none"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-bold text-ink">
              Programme / Village Name <span className="text-brand">*</span>
            </span>
            <input
              type="text"
              required
              placeholder="e.g. StudyMitra / Digital Library Nashik"
              value={programmeName}
              onChange={(e) => setProgrammeName(e.target.value)}
              className="h-10 border border-border bg-white px-3 text-xs rounded-xl focus:border-brand focus:outline-none"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-bold text-ink">Project Type</span>
            <select
              value={projectType}
              onChange={(e) => setProjectType(e.target.value as ProjectType)}
              className="h-10 border border-border bg-white px-3 text-xs rounded-xl focus:border-brand focus:outline-none"
            >
              {projectTypes.map((pt) => (
                <option key={pt} value={pt}>{pt}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-bold text-ink">
              Volunteering Hours Spent <span className="text-brand">*</span>
            </span>
            <input
              type="number"
              min="0.5"
              step="0.5"
              required
              placeholder="e.g. 4"
              value={volunteeringHours}
              onChange={(e) => setVolunteeringHours(e.target.value === "" ? "" : Number(e.target.value))}
              className="h-10 border border-border bg-white px-3 text-xs rounded-xl focus:border-brand focus:outline-none"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-bold text-ink">Beneficiaries Impacted</span>
            <input
              type="number"
              min="0"
              placeholder="e.g. 25 students"
              value={beneficiariesImpacted}
              onChange={(e) => setBeneficiariesImpacted(e.target.value === "" ? "" : Number(e.target.value))}
              className="h-10 border border-border bg-white px-3 text-xs rounded-xl focus:border-brand focus:outline-none"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs font-bold text-ink">Trees Planted (Optional)</span>
            <input
              type="number"
              min="0"
              placeholder="e.g. 5"
              value={treesPlanted}
              onChange={(e) => setTreesPlanted(e.target.value === "" ? "" : Number(e.target.value))}
              className="h-10 border border-border bg-white px-3 text-xs rounded-xl focus:border-brand focus:outline-none"
            />
          </label>

          <label className="grid gap-1 sm:col-span-2">
            <span className="text-xs font-bold text-ink">
              ThinkSharp Staff In-Charge <span className="text-brand">*</span>
            </span>
            <select
              required
              value={staffInCharge}
              onChange={(e) => setStaffInCharge(e.target.value as StaffMember)}
              className="h-10 border border-border bg-white px-3 text-xs rounded-xl focus:border-brand focus:outline-none"
            >
              <option value="">Select staff supervisor...</option>
              {staffMembers.map((sm) => (
                <option key={sm} value={sm}>{sm}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-1 sm:col-span-2">
            <span className="text-xs font-bold text-ink">Remarks / Description of Work Done</span>
            <textarea
              rows={3}
              placeholder="Briefly describe what you taught, built, or organized..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="border border-border bg-white p-3 text-xs rounded-xl focus:border-brand focus:outline-none"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t border-border/60 pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 items-center justify-center bg-brand px-8 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink rounded-xl transition-all shadow-md shadow-brand/20 disabled:opacity-50"
          >
            {isSaving ? "Submitting Report..." : "Submit Report for Review"}
          </button>
        </div>
      </section>
    </form>
  );
}
