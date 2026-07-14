import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Application } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "Account activation needs SUPABASE_SERVICE_ROLE_KEY in .env.local. Add the service role key, restart the server, then approve again.",
      },
      { status: 501 }
    );
  }

  const { applicationId } = (await request.json().catch(() => ({}))) as { applicationId?: string };
  if (!applicationId) {
    return NextResponse.json({ error: "Application ID is required." }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: application, error: applicationError } = await admin
    .from("applications")
    .select("*")
    .eq("id", applicationId)
    .single();

  if (applicationError || !application) {
    return NextResponse.json({ error: applicationError?.message ?? "Application not found." }, { status: 404 });
  }

  const app = application as Application;
  const role = app.applying_as;
  const email = app.email.trim().toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      {
        error: `Cannot create login account because this application has an invalid email: ${app.email}. Update the application email and try again.`,
      },
      { status: 400 }
    );
  }

  const redirectTo = new URL("/auth/callback", request.url).toString();

  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      full_name: app.full_name,
      role,
      application_id: app.id,
    },
    redirectTo,
  });

  if (inviteError) {
    const message = inviteError.message.toLowerCase();
    if (!message.includes("already") && !message.includes("registered")) {
      return NextResponse.json({ error: inviteError.message }, { status: 500 });
    }
  }

  const authUserId = inviteData.user?.id ?? null;

  if (authUserId) {
    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: authUserId,
        email,
        role,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }
  }

  const { error: approvalError } = await admin.rpc("approve_application", {
    target_application_id: app.id,
  });

  if (approvalError) {
    return NextResponse.json({ error: approvalError.message }, { status: 500 });
  }

  // TODO: Trigger Onboarding/Activation Email to the applicant containing congratulations message, their new TSF User ID, and set-password redirect link.

  await admin
    .from("applications")
    .update({ email })
    .eq("id", app.id);

  const { data: updatedApplication, error: fetchError } = await admin
    .from("applications")
    .select("*")
    .eq("id", app.id)
    .single();

  if (fetchError || !updatedApplication) {
    return NextResponse.json({ error: fetchError?.message ?? "Could not fetch approved application." }, { status: 500 });
  }

  return NextResponse.json({ application: updatedApplication });
}
