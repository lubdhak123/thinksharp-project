"use client";

import { subDays } from "./time";
import { internWorkTypes, projectTypes, type Granularity, type ApplicationStatus } from "./constants";
import { demoActivities, demoApplications } from "./demo-data";
import { hasSupabaseConfig, supabase } from "./supabase";
import type { Activity, ActivityInsert, Filters, ImpactStats, NameValue, Summary, TrendPoint, VolunteerApplication, VolunteerApplicationInsert, ApplicationFilters } from "./types";

export async function fetchActivities(filters: Filters = {}) {
  if (!supabase) return applyFilters(demoActivities, filters);

  let query = supabase.from("activities").select("*").order("activity_date", { ascending: false });

  if (filters.search) query = query.ilike("volunteer_name", `%${filters.search}%`);
  if (filters.person) query = query.eq("volunteer_name", filters.person);
  if (filters.programme) query = query.eq("programme_name", filters.programme);
  if (filters.projectType) {
    const isVolunteerProject = projectTypes.includes(filters.projectType as never);
    const isInternWork = internWorkTypes.includes(filters.projectType as never);
    if (isVolunteerProject && isInternWork) {
      query = query.or(`project_type.eq.${filters.projectType},intern_work_type.eq.${filters.projectType}`);
    } else if (isInternWork) {
      query = query.eq("intern_work_type", filters.projectType);
    } else {
      query = query.eq("project_type", filters.projectType);
    }
  }
  if (filters.location) query = query.eq("location", filters.location);
  if (filters.staff) query = query.eq("staff_in_charge", filters.staff);
  if (filters.from) query = query.gte("activity_date", filters.from);
  if (filters.to) query = query.lte("activity_date", filters.to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as Activity[];
}

export async function fetchActivityById(id: string) {
  if (!supabase) return demoActivities.find((record) => record.id === id) ?? null;

  const { data, error } = await supabase.from("activities").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Activity | null;
}

export async function insertActivity(activity: ActivityInsert) {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  const { error } = await supabase.from("activities").insert(activity);
  if (error) throw new Error(error.message);
}

export function applyFilters(records: Activity[], filters: Filters) {
  const search = filters.search?.trim().toLowerCase();

  return records.filter((record) => {
    return (
      (!search || record.volunteer_name.toLowerCase().includes(search)) &&
      (!filters.person || record.volunteer_name === filters.person) &&
      (!filters.programme || record.programme_name === filters.programme || record.milestone === filters.programme) &&
      (!filters.projectType || record.project_type === filters.projectType || record.intern_work_type === filters.projectType) &&
      (!filters.location || record.location === filters.location) &&
      (!filters.from || record.activity_date >= filters.from) &&
      (!filters.to || record.activity_date <= filters.to) &&
      (!filters.staff || record.staff_in_charge === filters.staff)
    );
  });
}

export function staffOverseen(records: Activity[]): NameValue[] {
  return Object.entries(
    records.reduce<Record<string, number>>((groups, record) => {
      if (record.staff_in_charge) {
        groups[record.staff_in_charge] = (groups[record.staff_in_charge] ?? 0) + 1;
      }
      return groups;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}


export function filterByView(records: Activity[], view: "overall" | "volunteer" | "intern") {
  if (view === "volunteer") return records.filter((record) => record.entry_type === "volunteer");
  if (view === "intern") return records.filter((record) => record.entry_type === "intern");
  return records;
}

export function getTotalHours(record: Activity) {
  if (record.entry_type === "intern") return Number(record.internship_hours ?? 0);
  return Number(record.volunteering_hours ?? 0);
}

export function summarize(records: Activity[]): Summary {
  const activeCutoff = subDays(new Date(), 90).toISOString().slice(0, 10);
  const volunteers = records.filter((record) => record.entry_type === "volunteer");
  const interns = records.filter((record) => record.entry_type === "intern");

  return {
    totalVolunteers: new Set(volunteers.map((record) => record.volunteer_name)).size,
    totalInterns: new Set(interns.map((record) => record.volunteer_name)).size,
    activeVolunteers: new Set(volunteers.filter((record) => record.activity_date >= activeCutoff).map((record) => record.volunteer_name)).size,
    activeInterns: new Set(interns.filter((record) => record.activity_date >= activeCutoff).map((record) => record.volunteer_name)).size,
    volunteerHours: volunteers.reduce((sum, record) => sum + getTotalHours(record), 0),
    internHours: interns.reduce((sum, record) => sum + Number(record.internship_hours ?? 0), 0),
    beneficiariesImpacted: records.reduce((sum, record) => sum + Number(record.beneficiaries_impacted ?? 0), 0),
    activitiesConducted: volunteers.length + interns.reduce((sum, record) => sum + Number(record.deliverables_completed ?? 0), 0),
    volunteerActivitiesCompleted: volunteers.length,
    treesPlanted: volunteers.reduce((sum, record) => sum + Number(record.trees_planted ?? 0), 0),
    volunteerSessions: volunteers.length,
    internProjects: interns.reduce((sum, record) => sum + Number(record.deliverables_completed ?? 0), 0)
  };
}

export function topContributors(records: Activity[]): NameValue[] {
  return Object.entries(
    records.reduce<Record<string, number>>((groups, record) => {
      groups[record.volunteer_name] = (groups[record.volunteer_name] ?? 0) + getTotalHours(record);
      return groups;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
}

export function activitiesByType(records: Activity[]): NameValue[] {
  return Object.entries(
    records.reduce<Record<string, number>>((groups, record) => {
      if (record.entry_type === "intern") {
        const key = record.intern_work_type ?? "Other";
        groups[key] = (groups[key] ?? 0) + Number(record.deliverables_completed ?? 0);
      } else {
        const key = record.project_type ?? "Other";
        groups[key] = (groups[key] ?? 0) + 1;
      }
      return groups;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function trend(records: Activity[], granularity: Granularity): TrendPoint[] {
  const groups = records.reduce<Record<string, TrendPoint>>((acc, record) => {
    const period = granularity === "month" ? record.activity_date.slice(0, 7) : record.activity_date.slice(0, 4);
    acc[period] ??= { period, hours: 0, count: 0 };
    acc[period].hours += getTotalHours(record);
    acc[period].count += 1;
    return acc;
  }, {});

  return Object.values(groups).sort((a, b) => a.period.localeCompare(b.period));
}

export function impactStats(records: Activity[]): ImpactStats {
  return {
    beneficiariesReached: records.reduce((sum, record) => sum + Number(record.beneficiaries_impacted ?? 0), 0),
    treesPlanted: records.reduce((sum, record) => sum + Number(record.trees_planted ?? 0), 0),
    hoursGiven: records.reduce((sum, record) => sum + getTotalHours(record), 0),
    peopleInvolved: new Set(records.map((record) => record.volunteer_name)).size
  };
}

export function distinctOptions(records: Activity[]) {
  const unique = (field: keyof Activity) => [...new Set(records.map((record) => record[field]).filter(Boolean) as string[])].sort();

  const programmes = [...new Set([
    ...records.map(r => r.programme_name),
    ...records.map(r => r.milestone)
  ].filter(Boolean) as string[])].sort();

  const projectTypesList = [...new Set([
    ...records.map(r => r.project_type),
    ...records.map(r => r.intern_work_type)
  ].filter(Boolean) as string[])].sort();

  return {
    people: unique("volunteer_name"),
    programmes,
    projectTypes: projectTypesList,
    locations: unique("location"),
    staff: unique("staff_in_charge")
  };
}

export function useDemoMode() {
  return !hasSupabaseConfig;
}

