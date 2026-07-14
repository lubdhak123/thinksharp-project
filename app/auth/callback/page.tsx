"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Preparing your onboarding session...");

  useEffect(() => {
    async function handleCallback() {
      if (!supabase) {
        setMessage("Supabase is not configured. Please contact the administrator.");
        return;
      }

      const url = new URL(window.location.href);
      const params = new URLSearchParams(url.search);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const code = params.get("code");
      const type = params.get("type") ?? hash.get("type");
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

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

        if (type === "invite" || type === "recovery" || accessToken || code) {
          router.replace("/set-password");
          return;
        }

        router.replace("/dashboard");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not verify your invitation link.");
      }
    }

    handleCallback();
  }, [router]);

  return (
    <main className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-4 py-16 font-display">
      <section className="grid gap-4 border border-border bg-white p-8 text-center">
        <span className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand">Invitation</p>
          <h1 className="mt-1 text-2xl font-black text-ink">Opening your account</h1>
          <p className="mt-2 text-sm font-semibold text-mist">{message}</p>
        </div>
      </section>
    </main>
  );
}
