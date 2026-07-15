import type { CurrentUser, UserRole } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Member } from "@/lib/types";

const DEMO_TERMS_PREFIX = "thinksharp_accepted_terms_";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEMO_EMAILS = new Set(["admin@thinksharp.org", "volunteer@thinksharp.org", "intern@thinksharp.org"]);

function canUseAuthUserId(user: CurrentUser) {
  return UUID_RE.test(user.id) && !DEMO_EMAILS.has(user.email.toLowerCase());
}

export async function fetchMembers() {
  if (!supabase) {
    return [
      demoMember({
        id: "00000000-0000-4000-8000-000000000002",
        email: "volunteer@thinksharp.org",
        name: "Lubdhak",
      }),
      demoMember({
        id: "00000000-0000-4000-8000-000000000003",
        email: "intern@thinksharp.org",
        name: "Lubdhak",
      }),
    ];
  }

  const { data, error } = await supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Member[];
}

export async function fetchCurrentMember(user: CurrentUser) {
  if (!supabase) {
    return demoMember(user);
  }

  if (canUseAuthUserId(user)) {
    const byAuth = await supabase
      .from("members")
      .select("*")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (byAuth.error) throw new Error(byAuth.error.message);
    if (byAuth.data) return byAuth.data as Member;
  }

  const byEmail = await supabase
    .from("members")
    .select("*")
    .eq("email", user.email)
    .maybeSingle();

  if (byEmail.error) throw new Error(byEmail.error.message);
  return (byEmail.data ?? null) as Member | null;
}

export async function hasAcceptedTerms(user: CurrentUser) {
  if (!supabase) {
    return localStorage.getItem(`${DEMO_TERMS_PREFIX}${user.id}`) === "true";
  }

  const member = await fetchCurrentMember(user);
  return Boolean(member?.accepted_terms);
}

export async function acceptTerms(user: CurrentUser, role: Exclude<UserRole, "admin">) {
  if (!supabase) {
    localStorage.setItem(`${DEMO_TERMS_PREFIX}${user.id}`, "true");
    return;
  }

  const member = await fetchCurrentMember(user);
  if (member) {
    const { error } = await supabase
      .from("members")
      .update({
        accepted_terms: true,
        accepted_terms_at: new Date().toISOString(),
        auth_user_id: canUseAuthUserId(user) ? member.auth_user_id ?? user.id : member.auth_user_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", member.id);

    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("members").insert({
    auth_user_id: canUseAuthUserId(user) ? user.id : null,
    role,
    name: user.name || user.email.split("@")[0] || "Member",
    status: "Active",
    email: user.email,
    accepted_terms: true,
    accepted_terms_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);
}

export async function updateMemberStatus(
  memberId: string,
  status: Member["status"],
  certificateNumber?: string | null
) {
  let currentStatus: Member["status"] = "Active";

  if (!supabase) {
    currentStatus = (localStorage.getItem(`thinksharp_demo_member_status_${memberId}`) as Member["status"]) || "Active";
    
    const isValidTransition = 
      (currentStatus === "Active" && status === "Completed") ||
      (currentStatus === "Active" && status === "Suspended") ||
      (currentStatus === "Suspended" && status === "Active");

    if (!isValidTransition && currentStatus !== status) {
      throw new Error(`Invalid lifecycle transition: Cannot change status from '${currentStatus}' to '${status}'.`);
    }

    // In demo mode, save status and certificate in localStorage
    localStorage.setItem(`thinksharp_demo_member_status_${memberId}`, status);
    if (status === "Completed" && certificateNumber) {
      localStorage.setItem(`thinksharp_demo_member_cert_${memberId}`, certificateNumber);
    }
    return;
  }

  // Fetch current status from DB to validate transition rules
  const { data: member, error: fetchError } = await supabase
    .from("members")
    .select("status")
    .eq("id", memberId)
    .single();

  if (fetchError || !member) {
    throw new Error(fetchError?.message || "Member not found.");
  }

  currentStatus = member.status as Member["status"];

  const isValidTransition = 
    (currentStatus === "Active" && status === "Completed") ||
    (currentStatus === "Active" && status === "Suspended") ||
    (currentStatus === "Suspended" && status === "Active");

  if (!isValidTransition && currentStatus !== status) {
    throw new Error(`Invalid lifecycle transition: Cannot change status from '${currentStatus}' to '${status}'.`);
  }

  const payload: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "Completed") {
    payload.completed_at = new Date().toISOString();
    if (certificateNumber) {
      payload.certificate_number = certificateNumber;
    }
  } else if (status === "Suspended") {
    payload.suspended_at = new Date().toISOString();
  } else if (status === "Active") {
    payload.reactivated_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("members")
    .update(payload)
    .eq("id", memberId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Member;
}

function demoMember(user: CurrentUser): Member {
  const accepted = localStorage.getItem(`${DEMO_TERMS_PREFIX}${user.id}`) === "true";
  const isIntern = user.email.toLowerCase() === "intern@thinksharp.org";
  
  // Use user.id as key for localStorage to link properly
  const storedStatus = localStorage.getItem(`thinksharp_demo_member_status_${user.id}`) || "Active";
  const storedCert = localStorage.getItem(`thinksharp_demo_member_cert_${user.id}`);

  return {
    id: user.id,
    created_at: new Date().toISOString(),
    updated_at: null,
    application_id: null,
    user_id: isIntern ? "TSF0002" : "TSF0001",
    auth_user_id: canUseAuthUserId(user) ? user.id : null,
    role: isIntern ? "intern" : "volunteer",
    name: user.name || "Lubdhak",
    status: storedStatus as any,
    start_date: null,
    expected_end_date: null,
    email: user.email,
    accepted_terms: accepted,
    accepted_terms_at: accepted ? new Date().toISOString() : null,
    completed_at: storedStatus === "Completed" ? new Date().toISOString() : null,
    suspended_at: storedStatus === "Suspended" ? new Date().toISOString() : null,
    reactivated_at: null,
    certificate_number: storedCert || null,
  };
}
