"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

type ContributionProgressProps = {
  totalHours: number;
  goal?: number;
};

export const DEFAULT_CONTRIBUTION_GOAL = 100;

export default function ContributionProgress({ totalHours, goal = DEFAULT_CONTRIBUTION_GOAL }: ContributionProgressProps) {
  const [percent, setPercent] = useState(0);

  const calculatedPercent = Math.min(Math.round((totalHours / goal) * 100), 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPercent(calculatedPercent);
    }, 150);
    return () => clearTimeout(timer);
  }, [calculatedPercent]);

  return (
    <article className="border border-border bg-white p-5 rounded-2xl font-display flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between text-brand">
          <span className="text-xs font-bold uppercase tracking-widest text-mist">Tenure Progress</span>
          <Clock size={18} />
        </div>
        <h3 className="mt-2 text-base font-bold text-ink">Contribution Progress</h3>
        <p className="mt-1 text-xs text-mist leading-relaxed">
          Logged hours compared against target goal of <strong>{goal} hours</strong>.
        </p>
      </div>

      <div className="mt-5">
        <div className="flex justify-between items-end mb-1">
          <span className="text-2xl font-black text-ink tracking-tight">{totalHours} hrs</span>
          <span className="text-sm font-bold text-brand">{percent}% Complete</span>
        </div>
        
        {/* Progress track */}
        <div className="w-full h-3 bg-paper border border-border rounded-full overflow-hidden">
          <div 
            className="h-full bg-brand rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </article>
  );
}
