"use client";

import { Calendar, User, ShieldAlert, Award } from "lucide-react";

type ProfileSummaryCardProps = {
  tsfId: string;
  role: string;
  status: string;
  startDate: string;
  expectedEndDate: string;
};

export default function ProfileSummaryCard({ tsfId, role, status, startDate, expectedEndDate }: ProfileSummaryCardProps) {
  const roleLabel = role === "intern" ? "Intern" : "Volunteer";

  const calculateTenure = () => {
    if (!startDate || !expectedEndDate) return "N/A";
    try {
      const s = new Date(startDate);
      const e = new Date(expectedEndDate);
      const diffTime = Math.abs(e.getTime() - s.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const months = Math.round(diffDays / 30.4);
      return `${months} Month${months !== 1 ? "s" : ""} (${diffDays} days)`;
    } catch {
      return "N/A";
    }
  };

  return (
    <article className="border border-border bg-white p-5 rounded-2xl font-display h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
          <Award size={18} className="text-brand" />
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Profile Summary</h3>
        </div>

        <div className="grid gap-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-mist font-semibold">TSF Member ID</span>
            <span className="font-mono font-bold text-ink bg-paper px-2 py-0.5 border border-border rounded">{tsfId || "N/A"}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-mist font-semibold">Engagement Type</span>
            <span className="font-bold text-ink flex items-center gap-1">
              <User size={12} className="text-brand" />
              {roleLabel}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-mist font-semibold">Account Status</span>
            <span className="font-bold text-ink flex items-center gap-1">
              <ShieldAlert size={12} className="text-brand" />
              {status}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-mist font-semibold">Start Date</span>
            <span className="font-bold text-ink flex items-center gap-1">
              <Calendar size={12} className="text-mist" />
              {startDate || "Not set"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-mist font-semibold">Target End Date</span>
            <span className="font-bold text-ink flex items-center gap-1">
              <Calendar size={12} className="text-mist" />
              {expectedEndDate || "Not set"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 mt-4">
        <span className="text-mist font-bold uppercase tracking-wider text-[10px]">Total Tenure</span>
        <span className="font-black text-ink">{calculateTenure()}</span>
      </div>
    </article>
  );
}
