"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { DashboardClient } from "@/components/DashboardClient";
import { PersonalDashboardClient } from "@/components/PersonalDashboardClient";
import type { Member } from "@/lib/types";

export default function DashboardPage() {
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
      } else if (role) {
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

  if ((!member && role !== "admin") || !user || !role) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-display">
        <span className="h-8 w-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <div className="font-display">
        <p className="text-xs font-bold uppercase tracking-widest text-brand">
          {role === "admin" ? "Organisation Analytics" : "Personal Dashboard"}
        </p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          {role === "admin" ? "Dashboard" : "My Contribution Summary"}
        </h2>
      </div>
      {role === "admin" ? <DashboardClient /> : <PersonalDashboardClient user={user} role={role} />}
    </main>
  );
}
