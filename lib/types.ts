import type {
  ApplicationStatus,
  AvailabilityOption,
  CurrentStatus,
  DurationOption,
  EntryType,
  InternWorkType,
  ModeOption,
  ProjectType,
  VolunteerType
} from "./constants";

export type Activity = {
  id: string;
  created_at: string;
  user_id: string | null;
  auth_user_id: string | null;
  activity_date: string;
  volunteer_name: string;
  entry_type: "volunteer" | "intern";
  volunteer_type: VolunteerType | null;
  organisation: string | null;
  location: string;
  programme_name: string | null;
  project_type: ProjectType | null;
  num_volunteers: number | null;
  individual_hours?: number | null;
  group_hours?: number | null;
  volunteering_hours: number | null;
  beneficiaries_impacted: number;
  trees_planted: number | null;
  activities_completed: number | null;
  remarks: string | null;
  submitted_by: string | null;

  // Intern-specific fields
  department: string | null;
  intern_work_type: InternWorkType | null;
  supervisor_name: string | null;
  milestone: string | null;
  internship_hours: number | null;
  deliverables_completed: number | null;
  internship_start_date: string | null;
  internship_end_date: string | null;

  // Staff In-Charge
  staff_in_charge: string | null;
  status?: "Submitted" | "Approved" | "Rejected";
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
};


export type ActivityInsert = Omit<Activity, "id" | "created_at">;

export type Filters = {
  search?: string;
  person?: string;
  programme?: string;
  projectType?: string;
  location?: string;
  from?: string;
  to?: string;
  staff?: string;
};

export type Summary = {
  totalVolunteers: number;
  totalInterns: number;
  activeVolunteers: number;
  activeInterns: number;
  volunteerHours: number;
  internHours: number;
  beneficiariesImpacted: number;
  activitiesConducted: number;
  volunteerActivitiesCompleted: number;
  treesPlanted: number;
  volunteerSessions: number;
  internProjects: number;
};

export type NameValue = {
  name: string;
  value: number;
};

export type TrendPoint = {
  period: string;
  hours: number;
  count: number;
};

export type ImpactStats = {
  beneficiariesReached: number;
  treesPlanted: number;
  hoursGiven: number;
  peopleInvolved: number;
};

// ── Module 3: Volunteer / Intern Application Portal ──────────────────────────

export type VolunteerApplication = {
  // Identity
  id: string;
  created_at: string;

  // Personal Information
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  mobile_number: string;
  email: string;
  current_city: string | null;
  current_state: string | null;

  // Professional Information
  applying_as: "volunteer" | "intern";
  current_status: CurrentStatus | null;
  organization_name: string | null;

  // Availability
  preferred_start_date: string | null;
  preferred_end_date: string | null;
  expected_duration: DurationOption | null;
  availability: AvailabilityOption | null;
  hours_per_week: number | null;

  // Working Preference
  preferred_mode: ModeOption | null;

  // Area of Interest (comma-separated string)
  area_of_interest: string | null;

  // Referral
  referral_source: string | null;
  reference_name: string | null;

  // Documents
  resume_url: string | null;
  linkedin_profile: string | null;

  // Emergency Contact
  emergency_contact_name: string | null;
  emergency_relationship: string | null;
  emergency_mobile: string | null;

  // Declaration
  declaration_accepted: boolean;

  // Status (auto-assigned: 'Pending' on insert)
  status: ApplicationStatus;
  user_id?: string | null;
  auth_user_id?: string | null;
};

export type VolunteerApplicationInsert = Omit<VolunteerApplication, "id" | "created_at" | "status">;

export type ApplicationFilters = {
  search?: string;
  applying_as?: "volunteer" | "intern";
  status?: ApplicationStatus;
  from?: string;
  to?: string;
};

export type Application = {
  id: string;
  created_at: string;
  updated_at: string | null;
  full_name: string;
  date_of_birth: string;
  gender: string;
  mobile_number: string;
  email: string;
  current_city: string;
  current_state: string;
  applying_as: EntryType;
  current_status: CurrentStatus;
  organization_name: string;
  preferred_start_date: string;
  preferred_end_date: string;
  expected_duration: DurationOption;
  availability: AvailabilityOption;
  hours_per_week: number;
  preferred_mode: ModeOption;
  areas_of_interest: string[];
  hear_about: string;
  reference_name: string | null;
  resume_url: string | null;
  linkedin_profile: string | null;
  emergency_contact_name: string;
  emergency_contact_relationship: string;
  emergency_contact_mobile: string;
  declaration_accuracy: boolean;
  declaration_unpaid: boolean;
  declaration_safeguarding: boolean;
  declaration_code_of_conduct: boolean;
  declaration_media_consent: boolean;
  status: ApplicationStatus;
  user_id: string | null;
  auth_user_id?: string | null;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

export type ApplicationInsert = Omit<
  Application,
  "id" | "created_at" | "updated_at" | "status" | "user_id" | "admin_notes" | "reviewed_at" | "reviewed_by"
>;

export type Member = {
  id: string;
  created_at: string;
  updated_at: string | null;
  application_id: string | null;
  user_id: string;
  auth_user_id: string | null;
  role: EntryType;
  name: string;
  status: "Active" | "Completed" | "Suspended";
  start_date: string | null;
  expected_end_date: string | null;
  email: string;
  accepted_terms: boolean;
  accepted_terms_at: string | null;
  completed_at: string | null;
  suspended_at: string | null;
  reactivated_at: string | null;
  certificate_number: string | null;
};
