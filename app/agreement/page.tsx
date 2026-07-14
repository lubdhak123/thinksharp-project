"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { acceptTerms, hasAcceptedTerms } from "@/lib/members";

const agreementItems = [
  "I understand that there is no stipend unless it is specifically confirmed in writing by ThinkSharp Foundation.",
  "I agree to follow all programme SOPs, reporting processes, and instructions shared by the Foundation team.",
  "I will maintain confidentiality of beneficiary, school, programme, and internal Foundation information.",
  "I will follow child protection and safeguarding expectations at all times while working with students or communities.",
  "I will maintain professional behaviour in person, online, and while representing ThinkSharp Foundation.",
  "I will use Foundation property, documents, data, devices, and access responsibly and only for approved work.",
];

export default function AgreementPage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/login");
      setChecking(false);
      return;
    }

    if (role === "admin") {
      router.push("/admin");
      setChecking(false);
      return;
    }

    if (!role) {
      setChecking(false);
      return;
    }

    async function checkAccess() {
      try {
        const accepted = await hasAcceptedTerms(user!);
        if (accepted) {
          router.push("/dashboard");
          return;
        }
      } catch (checkError) {
        setError(checkError instanceof Error ? checkError.message : "Could not check agreement status.");
      } finally {
        setChecking(false);
      }
    }

    checkAccess();
  }, [loading, role, router, user]);

  async function handleAccept() {
    if (!user || role === "admin" || !role) return;

    setSubmitting(true);
    setError("");

    try {
      await acceptTerms(user, role);
      router.push("/dashboard");
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Could not save agreement acceptance.");
      setSubmitting(false);
    }
  }

  if (loading || checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-display">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (!user || !role || role === "admin") return null;

  const roleLabel = role === "intern" ? "Internship" : "Volunteer";

  return (
    <main className="mx-auto grid max-w-4xl gap-6 px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <section className="border border-border bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="grid h-12 w-12 shrink-0 place-items-center bg-brand text-white">
            <ShieldCheck size={24} />
          </div>
          <div className="font-display">
            <p className="text-xs font-bold uppercase tracking-widest text-brand">First Login Agreement</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">Volunteer / Internship Agreement</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist">
              Please accept these terms before continuing to your personal dashboard.
            </p>
          </div>
        </div>

        {error && <div className="mt-6 border border-clay bg-brand-light p-4 text-sm font-bold text-clay">{error}</div>}

        <div className="mt-8 grid gap-4">
          <div className="border border-border bg-paper p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-mist">Agreement Type</p>
            <p className="mt-1 text-lg font-bold text-ink">{roleLabel} Agreement</p>
          </div>

          <div className="grid gap-3">
            {agreementItems.map((item, index) => (
              <div key={item} className="flex gap-3 border border-border bg-white p-4">
                <span className="grid h-6 w-6 shrink-0 place-items-center bg-brand text-xs font-black text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-relaxed text-ink">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-5">
          <button
            type="button"
            onClick={handleAccept}
            disabled={submitting}
            className="inline-flex h-11 items-center justify-center bg-brand px-6 text-sm font-bold uppercase tracking-wide text-white transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Saving..." : "I Accept the Terms & Conditions"}
          </button>
        </div>
      </section>
    </main>
  );
}
