"use client";

import { useMemo } from "react";
import { PieChart } from "lucide-react";
import type { Activity } from "@/lib/types";

type ActivityDistributionChartProps = {
  activities: Activity[];
};

export default function ActivityDistributionChart({ activities }: ActivityDistributionChartProps) {
  const distributionData = useMemo(() => {
    const groups: Record<string, number> = {};
    activities.forEach((act) => {
      const type = act.project_type || act.intern_work_type || "Other";
      groups[type] = (groups[type] || 0) + 1;
    });

    const total = activities.length;

    return Object.keys(groups)
      .map((key) => ({
        category: key,
        count: groups[key],
        percent: total > 0 ? Math.round((groups[key] / total) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count);
  }, [activities]);

  if (distributionData.length === 0) {
    return (
      <article className="border border-border bg-white p-5 rounded-2xl font-display flex flex-col justify-between min-h-[260px] h-full">
        <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
          <PieChart size={18} className="text-brand" />
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Activity Share</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-paper/30 border border-dashed border-border rounded-xl">
          <p className="text-xs font-bold text-mist">No activities logged yet.</p>
          <p className="text-[10px] text-mist mt-1">Submit activity logs to view distribution.</p>
        </div>
      </article>
    );
  }

  const colors = ["bg-brand", "bg-[#3498db]", "bg-[#2ecc71]", "bg-[#f1c40f]", "bg-[#9b59b6]", "bg-mist"];

  return (
    <article className="border border-border bg-white p-5 rounded-2xl font-display flex flex-col justify-between min-h-[260px] h-full">
      <div>
        <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
          <PieChart size={18} className="text-brand" />
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Activity Distribution</h3>
        </div>

        <div className="grid gap-3.5 mt-2">
          {distributionData.slice(0, 5).map((item, idx) => {
            const barColor = colors[idx % colors.length];
            return (
              <div key={item.category} className="text-xs leading-normal">
                <div className="flex justify-between items-center font-bold text-ink mb-1">
                  <span>{item.category}</span>
                  <span className="font-mono text-mist">{item.count} logs ({item.percent}%)</span>
                </div>
                
                <div className="w-full h-2.5 bg-paper border border-border rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
