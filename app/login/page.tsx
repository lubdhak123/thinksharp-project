"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { hasAcceptedTerms } from "@/lib/members";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingInvite, setProcessingInvite] = useState(false);
  const { user, role, signIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    async function handleInviteLanding() {
      if (!supabase || typeof window === "undefined") return;

      const url = new URL(window.location.href);
      const params = new URLSearchParams(url.search);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const code = params.get("code");
      const type = params.get("type") ?? hash.get("type");
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (!code && !accessToken && type !== "invite" && type !== "recovery") return;

      setProcessingInvite(true);
      setErrorMsg("");

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        }

        router.replace("/set-password");
      } catch (error) {
        setErrorMsg(error instanceof Error ? error.message : "Could not verify invitation link.");
        setProcessingInvite(false);
      }
    }

    handleInviteLanding();
  }, [router]);

  // Redirect if already logged in
  useEffect(() => {
    async function redirectLoggedInUser() {
      if (loading || !user || !role) return;

      if (role === "admin") {
        router.push("/admin");
        return;
      }

      try {
        const accepted = await hasAcceptedTerms(user);
        router.push(accepted ? "/dashboard" : "/agreement");
      } catch {
        router.push("/agreement");
      }
    }

    redirectLoggedInUser();
  }, [user, role, loading, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Invalid credentials.");
      setIsSubmitting(false);
    }
  }

  if (loading || processingInvite) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-display">
        <div className="text-center grid gap-3">
          <span className="mx-auto block h-8 w-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-mist uppercase tracking-wider">
            {processingInvite ? "Opening invitation..." : "Checking session..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8 font-display">
      <div className="rounded-none border border-border bg-white p-6 sm:p-8 shadow-sm">
        <div className="text-center grid gap-2 mb-6">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded bg-brand text-sm font-bold tracking-tighter text-white">
            TF
          </div>
          <h2 className="text-2xl font-bold uppercase tracking-tight text-ink mt-2">Sign In</h2>
          <p className="text-xs text-mist">ThinkSharp Impact & Onboarding Portal</p>
        </div>

        {errorMsg && (
          <div role="alert" className="border-l-4 border-red-500 bg-red-50 p-4 text-xs text-red-800 mb-5">
            <span className="font-bold">Login failed:</span> {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="grid gap-4" noValidate>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mist">Email Address</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@thinksharp.org"
              className="h-10 rounded-none border border-border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-brand w-full"
              disabled={isSubmitting}
            />
          </label>

          <label className="grid gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-mist">Password</span>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="h-10 rounded-none border border-border px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:border-brand w-full"
              disabled={isSubmitting}
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full rounded-none bg-brand hover:bg-ink text-white font-bold uppercase tracking-wider text-sm h-11 transition-colors inline-flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-border pt-5 text-center">
          <p className="text-[10px] font-bold text-mist uppercase tracking-widest mb-3">Demo Accounts</p>
          <div className="grid gap-2 text-left text-xs text-mist bg-paper/50 p-3.5 border border-border/80">
            <div>
              <span className="font-bold text-ink block">Admin:</span>
              email: <code className="bg-paper px-1 py-0.5 select-all">admin@thinksharp.org</code><br />
              pass: <code className="bg-paper px-1 py-0.5 select-all">Admin@123</code>
            </div>
            <div className="border-t border-border/40 pt-2">
              <span className="font-bold text-ink block">Volunteer:</span>
              email: <code className="bg-paper px-1 py-0.5 select-all">volunteer@thinksharp.org</code><br />
              pass: <code className="bg-paper px-1 py-0.5 select-all">Volunteer@123</code>
            </div>
            <div className="border-t border-border/40 pt-2">
              <span className="font-bold text-ink block">Intern:</span>
              email: <code className="bg-paper px-1 py-0.5 select-all">intern@thinksharp.org</code><br />
              pass: <code className="bg-paper px-1 py-0.5 select-all">Intern@123</code>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
