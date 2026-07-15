"use client";

import { useMemo } from "react";
import { GraduationCap } from "lucide-react";
import type { Activity } from "@/lib/types";

type BeneficiaryTrendChartProps = {
  activities: Activity[];
};

export default function BeneficiaryTrendChart({ activities }: BeneficiaryTrendChartProps) {
  const monthlyData = useMemo(() => {
    const groups: Record<string, number> = {};
    activities.forEach((act) => {
      const dateStr = act.activity_date;
      if (!dateStr) return;
      const monthKey = dateStr.substring(0, 7);
      const bens = Number(act.beneficiaries_impacted ?? 0);
      groups[monthKey] = (groups[monthKey] || 0) + bens;
    });

    return Object.keys(groups)
      .sort()
      .slice(-6)
      .map((key) => {
        const display = new Date(`${key}-02T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        return {
          month: key,
          displayMonth: display,
          beneficiaries: groups[key]
        };
      });
  }, [activities]);

  const chartParams = useMemo(() => {
    if (monthlyData.length === 0) return null;

    const maxBens = Math.max(...monthlyData.map(d => d.beneficiaries), 10);
    const width = 400;
    const height = 200;
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const points = monthlyData.map((d, index) => {
      const x = paddingLeft + (monthlyData.length > 1 
        ? index * (chartWidth / (monthlyData.length - 1)) 
        : chartWidth / 2);
      const y = height - paddingBottom - (d.beneficiaries / maxBens) * chartHeight;
      return { x, y, label: d.displayMonth, val: d.beneficiaries };
    });

    let pathD = "";
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        pathD += ` L ${points[i].x} ${points[i].y}`;
      }
    }

    let areaD = "";
    if (points.length > 0) {
      areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;
    }

    return { points, pathD, areaD, maxBens, paddingLeft, paddingBottom, width, height };
  }, [monthlyData]);

  if (monthlyData.length === 0) {
    return (
      <article className="border border-border bg-white p-5 rounded-2xl font-display flex flex-col justify-between min-h-[260px] h-full">
        <div className="flex items-center gap-2 border-b border-border pb-3 mb-4">
          <GraduationCap size={18} className="text-brand" />
          <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Beneficiaries Reached</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-paper/30 border border-dashed border-border rounded-xl">
          <p className="text-xs font-bold text-mist">No beneficiary impact records logged.</p>
          <p className="text-[10px] text-mist mt-1">Submit activity logs to populate impact charts.</p>
        </div>
      </article>
    );
  }

  const params = chartParams!;

  return (
    <article className="border border-border bg-white p-5 rounded-2xl font-display flex flex-col justify-between min-h-[260px] h-full">
      <div className="flex items-center gap-2 border-b border-border pb-3 mb-2">
        <GraduationCap size={18} className="text-brand" />
        <h3 className="text-sm font-bold text-ink uppercase tracking-wider">Beneficiaries Impacted Over Time</h3>
      </div>

      <div className="w-full relative mt-2">
        <svg viewBox={`0 0 ${params.width} ${params.height}`} className="w-full h-auto overflow-visible" aria-label="Beneficiary impact area chart tracking student outreach.">
          <title>Beneficiary Impact Chart</title>
          <desc>This area chart shows total student outreach counts mapped by month.</desc>

          <line x1={params.paddingLeft} y1={20} x2={params.width - 20} y2={20} className="stroke-border/40 stroke-1 stroke-dasharray-[3]" />
          <line x1={params.paddingLeft} y1={90} x2={params.width - 20} y2={90} className="stroke-border/40 stroke-1 stroke-dasharray-[3]" />
          <line x1={params.paddingLeft} y1={params.height - params.paddingBottom} x2={params.width - 20} y2={params.height - params.paddingBottom} className="stroke-border stroke-1" />

          <text x={params.paddingLeft - 8} y={24} textAnchor="end" className="text-[9px] fill-mist font-bold font-mono">{params.maxBens.toLocaleString("en-IN")}</text>
          <text x={params.paddingLeft - 8} y={94} textAnchor="end" className="text-[9px] fill-mist font-bold font-mono">{Math.round(params.maxBens / 2).toLocaleString("en-IN")}</text>
          <text x={params.paddingLeft - 8} y={params.height - params.paddingBottom + 3} textAnchor="end" className="text-[9px] fill-mist font-bold font-mono">0</text>

          {params.areaD && (
            <path d={params.areaD} className="fill-brand/5 stroke-none" />
          )}

          {params.pathD && (
            <path d={params.pathD} className="stroke-brand fill-none stroke-[2.5]" />
          )}

          {params.points.map((pt, idx) => (
            <g key={idx} className="group/node">
              <circle
                cx={pt.x}
                cy={pt.y}
                r={4}
                className="fill-brand stroke-white stroke-2 hover:r-5 transition-all cursor-pointer"
              />
              <text
                x={pt.x}
                y={pt.y - 10}
                textAnchor="middle"
                className="text-[9px] font-mono font-bold fill-brand bg-white hidden group-hover/node:block"
              >
                {pt.val}
              </text>
              <text
                x={pt.x}
                y={params.height - 8}
                textAnchor="middle"
                className="text-[9px] fill-mist font-bold uppercase tracking-wider"
              >
                {pt.label}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </article>
  );
}
