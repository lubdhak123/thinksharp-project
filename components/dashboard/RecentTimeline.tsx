"use client";

import type { Activity } from "@/lib/types";
import { Clock } from "lucide-react";

type RecentTimelineProps = {
  activities: Activity[];
};

export default function RecentTimeline({ activities }: RecentTimelineProps) {
  const sorted = [...activities].sort((a, b) => b.activity_date.localeCompare(a.activity_date));
  
  const desktopActivities = sorted.slice(0, 5);
  const mobileActivities = sorted.slice(0, 3);

  const getStatusColor = (status: string) => {
    const s = status || "Approved";
    if (s === "Approved") return "bg-[#e9f7ef]/60 text-[#167241] border-[#167241]/20";
    if (s === "Submitted") return "bg-[#fff7e8]/60 text-[#9a6500] border-[#9a6500]/20";
    return "bg-red-50 text-red-700 border-red-100";
  };

  const formatDate = (val: string) => {
    if (!val) return "";
    return new Date(`${val}T00:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  const renderTimelineItems = (items: Activity[]) => {
    return items.map((act, index) => {
      const status = act.status || "Approved";
      return (
        <div key={act.id} className="relative flex items-start gap-4 pb-5 last:pb-0 group">
          {/* Connector bar */}
          {index < items.length - 1 && (
            <div className="absolute left-[9px] top-[24px] bottom-0 w-0.5 bg-border" />
          )}

          {/* Node dot */}
          <div className="w-5 h-5 rounded-full border-2 border-brand bg-[#fff5f5] flex items-center justify-center shrink-0 z-10 group-hover:scale-110 transition-transform">
            <div className="w-1.5 h-1.5 rounded-full bg-brand" />
          </div>

          <div className="text-left font-display w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div>
              <span className="text-[10px] text-mist font-bold uppercase tracking-wider">{formatDate(act.activity_date)}</span>
              <h4 className="text-xs font-bold text-ink leading-tight">
                {act.programme_name || act.milestone || "-"}
              </h4>
              <p className="text-[10px] text-mist leading-normal">
                {act.project_type || act.intern_work_type || "-"} · {act.volunteering_hours || act.internship_hours || 0} hrs
              </p>
            </div>
            
            <span className={`inline-block border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full w-fit ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>
        </div>
      );
    });
  };

  return (
    <article className="border border-border bg-white p-5 rounded-2xl font-display h-full">
      <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
        <Clock size={18} className="text-brand" />
        <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Recent Log Timeline</h3>
      </div>

      {activities.length === 0 ? (
        <p className="text-xs text-mist py-4">No recent activity logs available.</p>
      ) : (
        <div>
          {/* Desktop timeline (max 5) */}
          <div className="hidden md:block">
            {renderTimelineItems(desktopActivities)}
          </div>
          
          {/* Mobile timeline (max 3) */}
          <div className="block md:hidden">
            {renderTimelineItems(mobileActivities)}
          </div>
        </div>
      )}
    </article>
  );
}
