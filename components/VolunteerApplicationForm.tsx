"use client";

import { useState } from "react";
import {
  DECLARATIONS,
  availabilityOptions,
  currentStatuses,
  durationOptions,
  genderOptions,
  internWorkTypes,
  modeOptions,
  projectTypes,
  referralSources,
  type ApplicationStatus,
  type AvailabilityOption,
  type CurrentStatus,
  type DeclarationId,
  type DurationOption,
  type ModeOption,
} from "@/lib/constants";
import { insertApplication, uploadApplicationResume } from "@/lib/applications";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s\-().]{7,20}$/;
const MAX_RESUME_BYTES = 5 * 1024 * 1024;

type ApplyingAs = "volunteer" | "intern";

type ValidationFields = {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  mobileNumber: string;
  email: string;
  currentCity: string;
  currentState: string;
  currentStatus: string;
  organizationName: string;
  preferredStartDate: string;
  preferredEndDate: string;
  expectedDuration: string;
  availability: string;
  hoursPerWeek: number | "";
  preferredMode: string;
  areaOfInterest: string;
  referralSource: string;
  referenceName: string;
  resumeFile: File | null;
  emergencyName: string;
  emergencyRelationship: string;
  emergencyMobile: string;
  allRequiredAccepted: boolean;
};

const initialDeclarations: Record<DeclarationId, boolean> = {
  accuracy: false,
  unpaid: false,
  safeguarding: false,
  codeOfConduct: false,
  mediaConsent: false,
};

function validate(f: ValidationFields): string | null {
  if (!f.fullName.trim()) return "Full Name is required.";
  if (!f.dateOfBirth) return "Date of Birth is required.";
  if (!f.gender) return "Gender is required.";
  if (!f.mobileNumber.trim()) return "Mobile Number is required.";
  if (!PHONE_RE.test(f.mobileNumber)) return "Please enter a valid mobile number.";
  if (!f.email.trim()) return "Email Address is required.";
  if (!EMAIL_RE.test(f.email)) return "Please enter a valid email address.";
  if (!f.currentCity.trim()) return "Current City is required.";
  if (!f.currentState.trim()) return "Current State is required.";
  if (!f.currentStatus) return "Current Status is required.";
  if (!f.organizationName.trim()) return "College / Company / Organization Name is required.";
  if (!f.preferredStartDate) return "Preferred Start Date is required.";
  if (!f.preferredEndDate) return "Preferred End Date is required.";
  if (f.preferredEndDate < f.preferredStartDate) return "Preferred End Date must be on or after the Preferred Start Date.";
  if (!f.expectedDuration) return "Expected Duration is required.";
  if (!f.availability) return "Availability is required.";
  if (f.hoursPerWeek === "" || Number(f.hoursPerWeek) <= 0) return "Hours Per Week must be a positive number.";
  if (!f.preferredMode) return "Preferred Mode is required.";
  if (!f.areaOfInterest) return "Area of Interest is required.";
  if (!f.referralSource) return "Please tell us how you heard about ThinkSharp Foundation.";
  if (!f.referenceName.trim()) return "Reference Name is required.";
  if (!f.resumeFile) return "Resume upload is required.";
  if (f.resumeFile.size > MAX_RESUME_BYTES) return "Resume must be 5 MB or smaller.";
  if (!f.emergencyName.trim()) return "Emergency Contact Name is required.";
  if (!f.emergencyRelationship.trim()) return "Emergency Contact Relationship is required.";
  if (!f.emergencyMobile.trim()) return "Emergency Contact Mobile Number is required.";
  if (!PHONE_RE.test(f.emergencyMobile)) return "Please enter a valid emergency contact mobile number.";
  if (!f.allRequiredAccepted) return "Please accept all required declarations to submit your application.";
  return null;
}

export function VolunteerApplicationForm() {
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [currentCity, setCurrentCity] = useState("");
  const [currentState, setCurrentState] = useState("");
  const [applyingAs, setApplyingAs] = useState<ApplyingAs>("volunteer");
  const [currentStatus, setCurrentStatus] = useState<CurrentStatus | "">("");
  const [organizationName, setOrganizationName] = useState("");
  const [preferredStartDate, setPreferredStartDate] = useState("");
  const [preferredEndDate, setPreferredEndDate] = useState("");
  const [expectedDuration, setExpectedDuration] = useState<DurationOption | "">("");
  const [availability, setAvailability] = useState<AvailabilityOption | "">("");
  const [hoursPerWeek, setHoursPerWeek] = useState<number | "">("");
  const [preferredMode, setPreferredMode] = useState<ModeOption | "">("");
  const [areaOfInterest, setAreaOfInterest] = useState("");
  const [referralSource, setReferralSource] = useState("");
  const [referenceName, setReferenceName] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [linkedinProfile, setLinkedinProfile] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelationship, setEmergencyRelationship] = useState("");
  const [emergencyMobile, setEmergencyMobile] = useState("");
  const [declarations, setDeclarations] = useState<Record<DeclarationId, boolean>>(initialDeclarations);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const allRequiredAccepted = DECLARATIONS.filter((item) => item.required).every((item) => declarations[item.id]);
  const interestOptions = applyingAs === "volunteer" ? projectTypes : internWorkTypes;
  const isSubmitting = status === "submitting";

  function handleApplyingAsChange(role: ApplyingAs) {
    setApplyingAs(role);
    setAreaOfInterest("");
  }

  function resetForm() {
    setFullName("");
    setDateOfBirth("");
    setGender("");
    setMobileNumber("");
    setEmail("");
    setCurrentCity("");
    setCurrentState("");
    setApplyingAs("volunteer");
    setCurrentStatus("");
    setOrganizationName("");
    setPreferredStartDate("");
    setPreferredEndDate("");
    setExpectedDuration("");
    setAvailability("");
    setHoursPerWeek("");
    setPreferredMode("");
    setAreaOfInterest("");
    setReferralSource("");
    setReferenceName("");
    setResumeFile(null);
    setLinkedinProfile("");
    setEmergencyName("");
    setEmergencyRelationship("");
    setEmergencyMobile("");
    setDeclarations(initialDeclarations);
    setErrorMsg("");
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const validationError = validate({
      fullName,
      dateOfBirth,
      gender,
      mobileNumber,
      email,
      currentCity,
      currentState,
      currentStatus,
      organizationName,
      preferredStartDate,
      preferredEndDate,
      expectedDuration,
      availability,
      hoursPerWeek,
      preferredMode,
      areaOfInterest,
      referralSource,
      referenceName,
      resumeFile,
      emergencyName,
      emergencyRelationship,
      emergencyMobile,
      allRequiredAccepted,
    });

    if (validationError) {
      setErrorMsg(validationError);
      setStatus("error");
      document.getElementById("form-error-banner")?.focus();
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    try {
      const resumeUrl = await uploadApplicationResume(resumeFile!, email);

      await insertApplication({
        full_name: fullName.trim(),
        date_of_birth: dateOfBirth,
        gender,
        mobile_number: mobileNumber.trim(),
        email: email.trim().toLowerCase(),
        current_city: currentCity.trim(),
        current_state: currentState.trim(),
        applying_as: applyingAs,
        current_status: currentStatus as CurrentStatus,
        organization_name: organizationName.trim(),
        preferred_start_date: preferredStartDate,
        preferred_end_date: preferredEndDate,
        expected_duration: expectedDuration as DurationOption,
        availability: availability as AvailabilityOption,
        hours_per_week: Number(hoursPerWeek),
        preferred_mode: preferredMode as ModeOption,
        areas_of_interest: [areaOfInterest],
        hear_about: referralSource,
        reference_name: referenceName.trim(),
        resume_url: resumeUrl,
        linkedin_profile: linkedinProfile.trim() || null,
        emergency_contact_name: emergencyName.trim(),
        emergency_contact_relationship: emergencyRelationship.trim(),
        emergency_contact_mobile: emergencyMobile.trim(),
        declaration_accuracy: declarations.accuracy,
        declaration_unpaid: declarations.unpaid,
        declaration_safeguarding: declarations.safeguarding,
        declaration_code_of_conduct: declarations.codeOfConduct,
        declaration_media_consent: declarations.mediaConsent,
      });

      setStatus("success");
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Submission failed. Please check your connection and try again.");
      setStatus("error");
      document.getElementById("form-error-banner")?.focus();
    }
  }

  if (status === "success") {
    return (
      <div role="status" aria-live="polite" className="grid gap-6 border border-brand bg-white p-8 text-center font-display sm:p-12">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-brand text-4xl font-black text-white">✓</div>
        <div className="grid gap-3">
          <h2 className="text-2xl font-bold uppercase tracking-tight text-ink">Application Submitted Successfully</h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-mist">
            Thank you for applying to ThinkSharp Foundation. Your request is now pending admin review.
          </p>
        </div>
        <div className="border-t border-border pt-6">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setStatus("idle");
            }}
            className="h-11 bg-brand px-8 text-sm font-bold uppercase tracking-wide text-white hover:bg-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className="grid gap-8 border border-border bg-white p-5 sm:p-8" onSubmit={handleSubmit} noValidate aria-label="Volunteer and Intern Application Form">
      {status === "error" && errorMsg && (
        <div
          id="form-error-banner"
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          className="flex items-start gap-3 border-l-4 border-red-500 bg-red-50 p-4 text-sm font-display text-red-800 focus-visible:outline-none"
        >
          <span className="mt-0.5 shrink-0 text-lg font-bold leading-none text-red-500" aria-hidden="true">x</span>
          <div>
            <p className="mb-0.5 font-bold">Please fix the following before submitting:</p>
            <p>{errorMsg}</p>
          </div>
        </div>
      )}

      <fieldset className="grid gap-5" disabled={isSubmitting}>
        <SectionTitle kicker="Step 1 of 7" title="Personal Information" id="section-personal" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="full-name" label="Full Name" required>
            <input id="full-name" required type="text" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="e.g. Priya Sharma" />
          </Field>
          <Field id="date-of-birth" label="Date of Birth" required>
            <input id="date-of-birth" required type="date" autoComplete="bday" value={dateOfBirth} onChange={(event) => setDateOfBirth(event.target.value)} />
          </Field>
          <Field id="gender" label="Gender" required>
            <select id="gender" required value={gender} onChange={(event) => setGender(event.target.value)}>
              <option value="">Select gender...</option>
              {genderOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Field>
          <Field id="mobile-number" label="Mobile Number" required hint="Include country code if outside India.">
            <input id="mobile-number" required type="tel" autoComplete="tel" value={mobileNumber} onChange={(event) => setMobileNumber(event.target.value)} placeholder="e.g. +91 98765 43210" />
          </Field>
          <Field id="email" label="Email Address" required>
            <input id="email" required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="e.g. name@example.com" />
          </Field>
          <Field id="current-city" label="Current City" required>
            <input id="current-city" required type="text" autoComplete="address-level2" value={currentCity} onChange={(event) => setCurrentCity(event.target.value)} placeholder="e.g. Pune" />
          </Field>
          <Field id="current-state" label="Current State" required>
            <input id="current-state" required type="text" autoComplete="address-level1" value={currentState} onChange={(event) => setCurrentState(event.target.value)} placeholder="e.g. Maharashtra" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-5" disabled={isSubmitting}>
        <SectionTitle kicker="Step 2 of 7" title="Professional / Educational Details" id="section-professional" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 border border-brand bg-brand-light/30 p-4" role="group" aria-labelledby="applying-as-label">
            <p id="applying-as-label" className="mb-1 text-sm font-black uppercase tracking-wider text-ink">
              Choose Applicant Type <span className="text-brand">*</span>
            </p>
            <p className="mb-3 text-xs font-semibold text-mist">
              Select whether this registration is for a volunteer or an intern. The interest options below change based on this choice.
            </p>
            <div className="grid grid-cols-2 border border-border" role="radiogroup">
              {(["volunteer", "intern"] as const).map((role, index) => (
                <button
                  key={role}
                  type="button"
                  role="radio"
                  aria-checked={applyingAs === role}
                  onClick={() => handleApplyingAsChange(role)}
                  className={`h-10 text-xs font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${index > 0 ? "border-l border-border" : ""} ${applyingAs === role ? "bg-brand text-white" : "bg-paper text-mist hover:bg-brand-light/10 hover:text-ink"}`}
                >
                  {role === "volunteer" ? "Volunteer" : "Intern"}
                </button>
              ))}
            </div>
          </div>
          <Field id="current-status" label="Current Status" required>
            <select id="current-status" required value={currentStatus} onChange={(event) => setCurrentStatus(event.target.value as CurrentStatus)}>
              <option value="">Select status...</option>
              {currentStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field id="organization-name" label="College / Company / Organization Name" required>
              <input id="organization-name" required type="text" autoComplete="organization" value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} placeholder="Enter institution or employer name" />
            </Field>
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-5" disabled={isSubmitting}>
        <SectionTitle kicker="Step 3 of 7" title="Internship / Volunteer Details" id="section-availability" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="start-date" label="Preferred Start Date" required>
            <input id="start-date" required type="date" value={preferredStartDate} onChange={(event) => setPreferredStartDate(event.target.value)} />
          </Field>
          <Field id="end-date" label="Preferred End Date" required hint={preferredStartDate ? `Must be on or after ${preferredStartDate}` : undefined}>
            <input id="end-date" required type="date" value={preferredEndDate} min={preferredStartDate || undefined} onChange={(event) => setPreferredEndDate(event.target.value)} />
          </Field>
          <Field id="expected-duration" label="Expected Duration" required>
            <select id="expected-duration" required value={expectedDuration} onChange={(event) => setExpectedDuration(event.target.value as DurationOption)}>
              <option value="">Select duration...</option>
              {durationOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Field>
          <div role="group" aria-labelledby="availability-label">
            <p id="availability-label" className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-mist">Availability <span className="text-brand">*</span></p>
            <div className="grid grid-cols-3 border border-border" role="radiogroup">
              {availabilityOptions.map((item, index) => (
                <button
                  key={item}
                  type="button"
                  role="radio"
                  aria-checked={availability === item}
                  onClick={() => setAvailability(item)}
                  className={`h-10 text-[11px] font-bold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand ${index > 0 ? "border-l border-border" : ""} ${availability === item ? "bg-brand text-white" : "bg-paper text-mist hover:bg-brand-light/10 hover:text-ink"}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <Field id="hours-per-week" label="Hours You Can Commit Per Week" required hint="Enter a positive number, e.g. 10">
            <input id="hours-per-week" required type="number" inputMode="numeric" min={1} max={168} value={hoursPerWeek} onChange={(event) => setHoursPerWeek(event.target.value === "" ? "" : Number(event.target.value))} placeholder="e.g. 10" />
          </Field>
          <Field id="preferred-mode" label="Preferred Mode" required>
            <select id="preferred-mode" required value={preferredMode} onChange={(event) => setPreferredMode(event.target.value as ModeOption)}>
              <option value="">Select mode...</option>
              {modeOptions.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field id="area-of-interest" label={applyingAs === "volunteer" ? "Area of Interest - Volunteer" : "Area of Interest - Intern"} required hint={`Showing ${applyingAs} options. Switch role above to see different options.`}>
              <select id="area-of-interest" key={applyingAs} required value={areaOfInterest} onChange={(event) => setAreaOfInterest(event.target.value)}>
                <option value="">Select an area...</option>
                {interestOptions.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </Field>
          </div>
        </div>
      </fieldset>

      <fieldset className="grid gap-5" disabled={isSubmitting}>
        <SectionTitle kicker="Step 4 of 7" title="Referral" id="section-referral" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="referral-source" label="How did you hear about ThinkSharp Foundation?" required>
            <select id="referral-source" required value={referralSource} onChange={(event) => setReferralSource(event.target.value)}>
              <option value="">Select source...</option>
              {referralSources.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Field>
          <Field id="reference-name" label="Reference Name" required>
            <input id="reference-name" required type="text" value={referenceName} onChange={(event) => setReferenceName(event.target.value)} placeholder="Name of person who referred you" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-5" disabled={isSubmitting}>
        <SectionTitle kicker="Step 5 of 7" title="Documents" id="section-documents" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mist">Resume / CV <span className="text-brand">*</span></span>
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="resume-upload" className="inline-flex h-10 cursor-pointer items-center gap-2 border border-border bg-paper px-4 text-xs font-bold uppercase tracking-wide text-ink transition-colors hover:bg-brand-light/10 focus-within:ring-2 focus-within:ring-brand">
                <span className="font-bold text-brand" aria-hidden="true">Upload</span>
                {resumeFile ? <span className="max-w-[160px] truncate normal-case">{resumeFile.name}</span> : "Choose File"}
              </label>
              <input id="resume-upload" required type="file" accept=".pdf,.doc,.docx" className="sr-only" aria-label="Upload your resume. PDF, DOC or DOCX accepted." onChange={(event) => setResumeFile(event.target.files?.[0] ?? null)} />
              {resumeFile && (
                <button type="button" onClick={() => setResumeFile(null)} className="text-xs font-semibold text-mist underline underline-offset-2 hover:text-brand">
                  Remove
                </button>
              )}
            </div>
            <p className="text-[11px] text-mist">PDF, DOC, or DOCX - max 5 MB</p>
          </div>
          <Field id="linkedin-profile" label="LinkedIn Profile (Optional)">
            <input id="linkedin-profile" type="url" autoComplete="url" value={linkedinProfile} onChange={(event) => setLinkedinProfile(event.target.value)} placeholder="https://linkedin.com/in/yourname" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-5" disabled={isSubmitting}>
        <SectionTitle kicker="Step 6 of 7" title="Emergency Contact" id="section-emergency" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="emergency-name" label="Name" required>
            <input id="emergency-name" required type="text" value={emergencyName} onChange={(event) => setEmergencyName(event.target.value)} placeholder="Full name" />
          </Field>
          <Field id="emergency-relationship" label="Relationship" required>
            <input id="emergency-relationship" required type="text" value={emergencyRelationship} onChange={(event) => setEmergencyRelationship(event.target.value)} placeholder="e.g. Parent, Sibling, Friend" />
          </Field>
          <Field id="emergency-mobile" label="Mobile Number" required>
            <input id="emergency-mobile" required type="tel" autoComplete="tel" value={emergencyMobile} onChange={(event) => setEmergencyMobile(event.target.value)} placeholder="e.g. +91 98765 43210" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="grid gap-5" disabled={isSubmitting}>
        <SectionTitle kicker="Step 7 of 7" title="Declaration" id="section-declaration" />
        <div className="grid gap-3" role="group" aria-labelledby="section-declaration">
          {DECLARATIONS.map((item) => (
            <label key={item.id} htmlFor={`decl-${item.id}`} className={`flex cursor-pointer items-start gap-3 border p-3.5 transition-colors ${declarations[item.id] ? "border-brand bg-brand-light/30" : "border-border bg-paper/40 hover:bg-paper"}`}>
              <input
                id={`decl-${item.id}`}
                type="checkbox"
                checked={declarations[item.id]}
                onChange={() => setDeclarations((current) => ({ ...current, [item.id]: !current[item.id] }))}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1"
                aria-required={item.required}
              />
              <span className="select-none text-sm leading-snug text-ink">
                {item.text}
                {item.required && <span className="ml-1 font-bold text-brand" aria-label="required">*</span>}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex h-11 items-center gap-2.5 bg-brand px-8 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {isSubmitting ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" aria-hidden="true" />
              <span>Submitting...</span>
            </>
          ) : (
            "Submit Application"
          )}
        </button>
        {allRequiredAccepted && !isSubmitting && <p className="text-xs font-bold text-brand">Ready to submit</p>}
      </div>
    </form>
  );
}

function SectionTitle({ kicker, title, id }: { kicker: string; title: string; id: string }) {
  return (
    <div className="border-b border-border pb-2 font-display">
      <p className="text-xs font-bold uppercase tracking-widest text-brand">{kicker}</p>
      <h2 id={id} className="mt-0.5 text-lg font-bold uppercase tracking-wide text-ink">{title}</h2>
    </div>
  );
}

function Field({
  id,
  label,
  required,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-[11px] font-bold uppercase tracking-wider text-mist">
        {label}
        {required && <span className="ml-1 text-brand" aria-label="required">*</span>}
      </label>
      <div
        className="
          [&_input]:h-10 [&_input]:w-full [&_input]:rounded-none [&_input]:border [&_input]:border-border
          [&_input]:bg-white [&_input]:px-3 [&_input]:text-sm [&_input]:focus-visible:border-brand
          [&_input]:focus-visible:outline-none [&_input]:focus-visible:ring-2 [&_input]:focus-visible:ring-brand
          [&_select]:h-10 [&_select]:w-full [&_select]:rounded-none [&_select]:border [&_select]:border-border
          [&_select]:bg-white [&_select]:px-3 [&_select]:text-sm [&_select]:focus-visible:border-brand
          [&_select]:focus-visible:outline-none [&_select]:focus-visible:ring-2 [&_select]:focus-visible:ring-brand
        "
        aria-describedby={hintId}
      >
        {children}
      </div>
      {hint && <p id={hintId} className="text-[11px] text-mist">{hint}</p>}
    </div>
  );
}
