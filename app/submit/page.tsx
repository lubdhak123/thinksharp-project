"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ActivityForm } from "@/components/ActivityForm";
import { Suspense } from "react";
import type { Member } from "@/lib/types";

function SubmitContent() {
  const searchParams = useSearchParams();
  const repeatId = searchParams?.get("repeat") ?? undefined;
  return <ActivityForm repeatId={repeatId} />;
}

export default function SubmitPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [member, setMember] = useState<Member | null>(null);
  const [checkingMember, setCheckingMember] = useState(true);

  useEffect(() => {
    setCheckingMember(true);

    if (!loading) {
      if (!user) {
        router.push("/login");
        setCheckingMember(false);
      } else if (role === "admin") {
        setCheckingMember(false);
      } else {
        import("@/lib/members").then(({ fetchCurrentMember }) => {
          fetchCurrentMember(user)
            .then((m) => {
              setMember(m);
              if (!m || !m.accepted_terms) {
                router.push("/agreement");
              }
            })
            .catch(() => router.push("/agreement"))
            .finally(() => setCheckingMember(false));
        });
      }
    }
  }, [user, role, loading, router]);

  if (loading || checkingMember) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-display">
        <span className="h-8 w-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Intercept and show suspended view
  if (member && member.status === "Suspended") {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center font-display">
        <div className="border border-brand-light bg-[#fff7e8] p-8 shadow-soft">
          <h2 className="text-xl font-bold text-ink mb-2">Account Suspended</h2>
          <p className="text-sm text-mist leading-relaxed">
            Your account has been suspended.
          </p>
          <p className="text-sm text-mist leading-relaxed mt-1">
            Please contact{" "}
            <a href="mailto:admin@thinksharp.org" className="font-bold text-brand hover:underline">
              admin@thinksharp.org
            </a>
            .
          </p>
        </div>
      </main>
    );
  }

  // Intercept and show completed view
  if (member && member.status === "Completed") {
    return (
      <main className="mx-auto max-w-md px-4 py-20 text-center font-display">
        <div className="border border-border bg-white p-8 shadow-soft">
          <h2 className="text-xl font-bold text-ink mb-2">Tenure Completed</h2>
          <p className="text-sm text-mist leading-relaxed">
            Your volunteering or internship period has been completed.
          </p>
          <p className="text-sm text-mist leading-relaxed mt-1">
            Activity submissions are now closed. You can view your record on the{" "}
            <a href="/dashboard" className="font-bold text-brand hover:underline">
              Dashboard
            </a>
            .
          </p>
        </div>
      </main>
    );
  }

  if ((!member && role !== "admin") || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-display">
        <span className="h-8 w-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <div className="font-display">
        <p className="text-xs font-bold uppercase tracking-widest text-brand">Data Entry Form</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          Record a volunteer or intern activity
        </h2>
      </div>
      <Suspense fallback={null}>
        <SubmitContent />
      </Suspense>
    </main>
  );
}
