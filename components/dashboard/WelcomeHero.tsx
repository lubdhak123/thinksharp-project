"use client";

import Link from "next/link";
import { UserRound, FilePlus2 } from "lucide-react";

type WelcomeHeroProps = {
  name: string;
  role: string;
  status: string;
  joinDate: string;
  tsfId: string;
};

export default function WelcomeHero({ name, role, status, joinDate, tsfId }: WelcomeHeroProps) {
  const roleLabel = role === "intern" ? "Intern" : "Volunteer";

  const statusStyles: Record<string, string> = {
    Active: "bg-[#e9f7ef]/10 text-[#2ecc71] border-[#2ecc71]/20",
    Completed: "bg-blue-500/10 text-[#3498db] border-blue-500/20",
    Suspended: "bg-red-500/10 text-[#e74c3c] border-red-500/20",
  };

  return (
    <section className="border border-border bg-ink p-6 text-white sm:p-8 rounded-2xl relative overflow-hidden" style={{
      backgroundImage: "radial-gradient(800px 300px at 10% 20%, rgba(228,39,43,0.12), transparent 50%), linear-gradient(160deg, #141414, #1f1f1f)"
    }}>
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between relative z-10">
        <div className="font-display">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-white/50 tracking-wider">
            <span>MEMBERSHIP ID:</span>
            <strong className="text-white font-mono">{tsfId || "N/A"}</strong>
            <span>·</span>
            <span>JOINED {joinDate || "N/A"}</span>
          </div>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Hi {name} 👋
          </h1>
          
          <p className="mt-2 text-sm text-white/70 italic max-w-xl leading-relaxed">
            "Thank you for helping ThinkSharp Foundation create measurable impact in education and community development."
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/80">
              <UserRound size={12} />
              {roleLabel}
            </span>
            <span className={`inline-flex items-center rounded-full border px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusStyles[status] || "bg-paper text-mist"}`}>
              {status} Member
            </span>
          </div>
        </div>

        {status === "Active" && (
          <Link
            href="/submit"
            className="inline-flex h-11 items-center justify-center gap-2 bg-brand hover:bg-[#c31e21] px-5 text-sm font-bold uppercase tracking-wide text-white transition-colors shrink-0 shadow-[0_4px_12px_rgba(228,39,43,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
          >
            <FilePlus2 size={16} />
            Submit Activity
          </Link>
        )}
      </div>
    </section>
  );
}
