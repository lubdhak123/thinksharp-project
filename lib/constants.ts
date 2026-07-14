export const volunteerTypes = [
  "Individual Volunteer",
  "Group Volunteer",
  "Corporate Volunteer",
  "Student Volunteer"
] as const;

export const projectTypes = [
  "Student Teaching",
  "School Cleaning",
  "Plantation Drive",
  "Fundraising",
  "School Painting",
  "Other"
] as const;

export const internWorkTypes = [
  "AI Project",
  "Dashboard Development",
  "Curriculum Development",
  "Survey",
  "Data Analysis",
  "Student Teaching",
  "Research",
  "Documentation",
  "Other"
] as const;

export const departments = [
  "Tech",
  "Content",
  "Research",
  "Design",
  "Outreach",
  "Other"
] as const;

export const staffMembers = [
  "Rameshwar Khairnar",
  "Santosh Phad",
  "ThinkSharp Foundation Staff",
  "ThinkSharp Fellow"
] as const;

export type VolunteerType = (typeof volunteerTypes)[number];
export type ProjectType = (typeof projectTypes)[number];
export type InternWorkType = (typeof internWorkTypes)[number];
export type Department = (typeof departments)[number];
export type StaffMember = (typeof staffMembers)[number];
export type DashboardView = "overall" | "volunteer" | "intern";
export type Granularity = "month" | "year";
export type EntryType = "volunteer" | "intern";

export const applicationStatuses = ["Pending", "Approved", "Rejected"] as const;

export const currentStatuses = [
  "Student",
  "Working Professional",
  "Self-employed",
  "Freelancer",
  "Other"
] as const;

export const durationOptions = [
  "Less than 1 Month",
  "1 Month",
  "2 Months",
  "3 Months",
  "6 Months",
  "Flexible"
] as const;

export const availabilityOptions = ["Weekdays", "Weekends", "Flexible"] as const;
export const modeOptions = ["Offline", "Remote", "Hybrid"] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];
export type CurrentStatus = (typeof currentStatuses)[number];
export type DurationOption = (typeof durationOptions)[number];
export type AvailabilityOption = (typeof availabilityOptions)[number];
export type ModeOption = (typeof modeOptions)[number];

export const genderOptions = [
  "Male",
  "Female",
  "Non-Binary",
  "Prefer not to say",
] as const;
export type GenderOption = (typeof genderOptions)[number];

export const referralSources = [
  "Website",
  "LinkedIn",
  "Instagram",
  "Friend",
  "College",
  "Employee",
  "Volunteer",
  "Event",
  "Other",
] as const;
export type ReferralSource = (typeof referralSources)[number];

export const DECLARATIONS = [
  {
    id: "accuracy" as const,
    required: true,
    text: "I confirm that all the information provided in this application is accurate and complete to the best of my knowledge.",
  },
  {
    id: "unpaid" as const,
    required: true,
    text: "I understand that this is a voluntary / unpaid role and I am not entitled to any remuneration from ThinkSharp Foundation.",
  },
  {
    id: "safeguarding" as const,
    required: true,
    text: "I agree to abide by ThinkSharp Foundation's Safeguarding Policy and will report any concerns through the appropriate channels.",
  },
  {
    id: "codeOfConduct" as const,
    required: true,
    text: "I agree to follow ThinkSharp Foundation's Code of Conduct and represent the organisation with integrity and respect.",
  },
  {
    id: "mediaConsent" as const,
    required: true,
    text: "I consent to ThinkSharp Foundation using photographs or videos of me taken during activities for promotional and reporting purposes.",
  },
] as const;

export type DeclarationId = (typeof DECLARATIONS)[number]["id"];
