"use client";

import Link from "next/link";
import type { Activity } from "@/lib/types";
import { ArrowRight } from "lucide-react";

type ReuseActivityProps = {
  activities: Activity[];
  memberStatus: string;
};

export default function ReuseActivity({ activities, memberStatus }: ReuseActivityProps) {
  const sorted = [...activities].sort((a, b) => b.activity_date.localeCompare(a.activity_date));
  
  const desktopActivities = sorted.slice(0, 5);
  const mobileActivities = sorted.slice(0, 3);

  const getStatusColor = (status: string) => {
    const s = status || "Approved";
    if (s === "Approved") return "bg-[#e9f7ef] text-[#167241] border-[#167241]/20";
    if (s === "Submitted") return "bg-[#fff7e8] text-[#9a6500] border-[#9a6500]/20";
    return "bg-red-50 text-red-700 border border-red-100";
  };

  const formatDate = (val: string) => {
    if (!val) return "";
    return new Date(`${val}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const getHours = (act: Activity) => {
    return act.volunteering_hours || act.internship_hours || 0;
  };

  const renderCard = (act: Activity) => {
    const hours = getHours(act);
    const status = act.status || "Approved";
    const title = act.programme_name || act.milestone || "-";
    const sub = act.project_type || act.intern_work_type || "-";

    return (
      <div 
        key={act.id} 
        className="border border-border bg-white p-5 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow relative font-display text-left"
      >
        <div>
          <div className="flex justify-between items-start gap-2 mb-3">
            <span className={`inline-block border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${getStatusColor(status)}`}>
              {status}
            </span>
            <span className="text-xs font-mono font-bold text-ink bg-paper px-2 py-0.5 border border-border rounded">{hours} Hours</span>
          </div>
          
          <h4 className="text-sm font-bold text-ink leading-tight uppercase tracking-wide truncate">
            {title}
          </h4>
          <p className="text-xs text-mist mt-1 leading-normal font-semibold truncate">
            {sub}
          </p>
          
          <div className="mt-3 grid gap-1 text-[11px] text-mist border-t border-border/60 pt-3">
            <p><strong>Location:</strong> {act.location}</p>
            <p><strong>Logged Date:</strong> {formatDate(act.activity_date)}</p>
          </div>
        </div>

        {memberStatus === "Active" ? (
          <div className="mt-5">
            <Link
              href={`/submit?repeat=${act.id}`}
              className="inline-flex h-9 items-center justify-center gap-1.5 bg-brand hover:bg-[#c31e21] px-4 text-xs font-bold uppercase tracking-wider text-white transition-colors w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              Reuse Activity <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="mt-5">
            <button
              disabled
              className="inline-flex h-9 items-center justify-center gap-1.5 bg-paper border border-border px-4 text-xs font-bold uppercase tracking-wider text-mist cursor-not-allowed w-full"
            >
              Reuse Disabled
            </button>
          </div>
        )}
      </div>
    );
  };

  if (activities.length === 0) {
    return (
      <section className="border border-border bg-white p-5 rounded-2xl text-left">
        <p className="text-xs font-bold uppercase tracking-widest text-brand">Templates</p>
        <h3 className="mt-1 text-xl font-display font-bold text-ink">Reuse Previous Activity</h3>
        <div className="mt-4 border border-dashed border-border bg-paper p-6 text-center rounded-xl flex flex-col items-center gap-2">
          <p className="font-display text-sm font-bold text-ink">No previous activities available.</p>
          <p className="text-xs text-mist max-w-xs leading-relaxed text-center">
            Submit your first activity to begin building reusable templates.
          </p>
          <div className="mt-2">
            {memberStatus === "Active" && (
              <Link
                href="/submit"
                className="inline-flex h-9 items-center justify-center bg-brand px-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-ink transition-colors animate-pulse"
              >
                Submit Activity
              </Link>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="border border-border bg-white p-5 rounded-2xl text-left">
      <div className="mb-4">
        <p className="text-xs font-bold uppercase tracking-widest text-brand">Templates</p>
        <h3 className="mt-1 text-xl font-display font-bold text-ink">Reuse Previous Activity</h3>
        <p className="text-xs text-mist mt-1 leading-relaxed">
          Select a logged activity to preload as a draft template for your next submission.
        </p>
      </div>

      <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-4">
        {desktopActivities.map(renderCard)}
      </div>

      <div className="grid md:hidden grid-cols-1 gap-4">
        {mobileActivities.map(renderCard)}
      </div>
    </section>
  );
}
