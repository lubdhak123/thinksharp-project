"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSession() {
      if (!supabase) {
        setError("Supabase is not configured. Please contact the administrator.");
        setChecking(false);
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        setError(sessionError.message);
        setChecking(false);
        return;
      }

      if (!data.session?.user) {
        setError("This invitation link is missing or expired. Ask the administrator to send a new invitation.");
        setChecking(false);
        return;
      }

      setEmail(data.session.user.email ?? "");
      setChecking(false);
    }

    loadSession();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }

    setSubmitting(true);

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setSubmitting(false);
      return;
    }

    router.replace("/agreement");
  }

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-display">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8 font-display">
      <section className="border border-border bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 grid gap-2 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded bg-brand text-sm font-bold tracking-tighter text-white">
            TF
          </div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Account Activation</p>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-ink">Set Your Password</h1>
          {email && <p className="text-xs font-semibold text-mist">{email}</p>}
        </div>

        {error && (
          <div role="alert" className="mb-5 border-l-4 border-red-500 bg-red-50 p-4 text-xs font-semibold text-red-800">
            {error}
          </div>
        )}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mist">New Password</span>
            <input
              required
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-10 w-full rounded-none border border-border px-3 text-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              disabled={submitting}
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mist">Confirm Password</span>
            <input
              required
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="h-10 w-full rounded-none border border-border px-3 text-sm focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              disabled={submitting}
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 inline-flex h-11 w-full items-center justify-center bg-brand text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Activate Account"}
          </button>
        </form>
      </section>
    </main>
  );
}
