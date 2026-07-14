"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { AdminMembersClient } from "@/components/AdminMembersClient";

export default function AdminMembersPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [user, role, loading, router]);

  if (loading || !user || role !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-display">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <div className="font-display">
        <p className="text-xs font-bold uppercase tracking-widest text-brand">Admin Members</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-ink">Volunteer & Intern Members</h2>
        <p className="mt-2 max-w-2xl text-sm font-medium text-mist">
          Track onboarded members, their TSF IDs, lifecycle status, dates, and contribution totals.
        </p>
      </div>
      <AdminMembersClient />
    </main>
  );
}
