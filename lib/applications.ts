"use client";

import { demoApplications } from "./demo-applications";
import { supabase } from "./supabase";
import type { Application, ApplicationInsert } from "./types";
import type { ApplicationStatus } from "./constants";

const RESUME_BUCKET = "application-resumes";
const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_RESUME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);

export async function fetchApplications() {
  if (!supabase) return demoApplications;

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01" || error.message.toLowerCase().includes("schema cache")) return demoApplications;
    throw new Error(error.message);
  }

  return (data ?? []) as Application[];
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus, adminNotes?: string) {
  if (!supabase) {
    const application = demoApplications.find((item) => item.id === id);
    if (!application) throw new Error("Application not found.");
    return {
      ...application,
      status,
      admin_notes: adminNotes ?? application.admin_notes,
      user_id: status === "Approved" ? application.user_id ?? generateUserId(application.mobile_number) : application.user_id,
      reviewed_at: new Date().toISOString(),
      reviewed_by: "Admin"
    } satisfies Application;
  }

  const payload = {
    status,
    admin_notes: adminNotes ?? null,
    user_id: status === "Approved" ? generateUserId() : null,
    reviewed_at: new Date().toISOString(),
    reviewed_by: "Admin",
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("applications")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Application;
}

export function generateUserId(seed?: string) {
  if (seed) return `TSF${seed.slice(-4).padStart(4, "0")}`;
  return `TSF${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function uploadApplicationResume(file: File, email: string) {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  if (file.size > MAX_RESUME_BYTES) {
    throw new Error("Resume must be 5 MB or smaller.");
  }

  if (!ALLOWED_RESUME_TYPES.has(file.type)) {
    throw new Error("Resume must be a PDF, DOC, or DOCX file.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
  const safeEmail = email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const path = `${safeEmail || "applicant"}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(RESUME_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(RESUME_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function insertApplication(application: ApplicationInsert) {
  if (!supabase) {
    console.log("Demo Mode: Inserting application:", application);
    return;
  }

  const { error } = await supabase.from("applications").insert(application);
  if (error) throw new Error(error.message);
}

export async function approveApplication(id: string) {
  if (!supabase) {
    const app = demoApplications.find((item) => item.id === id);
    if (!app) throw new Error("Application not found.");
    app.status = "Approved";
    app.user_id = generateUserId(app.mobile_number);
    app.reviewed_at = new Date().toISOString();
    app.reviewed_by = "Admin";
    return app;
  }

  const response = await fetch("/api/admin/approve-application", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ applicationId: id }),
  });

  const result = (await response.json().catch(() => null)) as { application?: Application; inviteLink?: string | null; error?: string } | null;

  if (!response.ok) {
    throw new Error(result?.error ?? "Could not approve application.");
  }

  if (!result?.application) {
    throw new Error("Approval completed but the updated application was not returned.");
  }

  return {
    ...result.application,
    inviteLink: result.inviteLink ?? null
  };
}
