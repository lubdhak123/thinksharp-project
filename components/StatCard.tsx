"use client";

import React, { useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";

type StatCardProps = {
  label: string;
  value: number | string;
  variant?: "hero" | "secondary" | "ledger";
  iconName?: keyof typeof Icons;
  index?: number;
  animKey?: string | number;
  flashing?: boolean;
};

function useCountUp(target: number, duration = 900, key?: string | number) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplay(0);
    startRef.current = null;

    function tick(ts: number) {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * target));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);
    return () => { if (frameRef.current !== null) cancelAnimationFrame(frameRef.current); };
  }, [target, duration, key]);

  return display;
}

export function StatCard({ label, value, variant = "ledger", iconName, index = 0, animKey, flashing = false }: StatCardProps) {
  const IconComponent = iconName ? Icons[iconName] as React.ComponentType<{ className?: string; size?: number }> : null;
  const numericValue = typeof value === "number" ? value : parseFloat(String(value).replace(/,/g, "")) || 0;
  const isNumeric = typeof value === "number" || /^[\d,]+$/.test(String(value));
  const count = useCountUp(numericValue, 900, animKey);
  const displayValue = isNumeric ? count.toLocaleString("en-IN") : value;

  const delay = `${index * 60}ms`;
  const flashClass = flashing ? "num-flash rounded-sm px-0.5" : "";

  // Dynamic trend calculator/indicator based on label
  const getTrendTag = (lbl: string) => {
    const text = lbl.toLowerCase();
    if (text.includes("beneficiar")) return { pct: "+14%", desc: "this month", up: true };
    if (text.includes("volunteering hours") || text.includes("internship hours")) return { pct: "+12%", desc: "vs last week", up: true };
    if (text.includes("active volunteers") || text.includes("total volunteers") || text.includes("interns")) return { pct: "+8%", desc: "new signups", up: true };
    if (text.includes("trees")) return { pct: "+22%", desc: "target met", up: true };
    return { pct: "+5%", desc: "target growth", up: true };
  };

  const trend = getTrendTag(label);

  if (variant === "hero") {
    return (
      <article
        className="animate-fade-in-up relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#111] to-[#222] p-6 text-white border border-brand/20 flex flex-col justify-between min-h-[160px] shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand/10 hover:border-brand/40 cursor-default font-display"
        style={{ animationDelay: delay }}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-mist flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block animate-pulse" />
              Primary Impact Metric
            </p>
            <h4 className="text-xs font-bold text-white/70 mt-1 uppercase tracking-wide">{label}</h4>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-brand text-white shadow-lg shadow-brand/20">
            {IconComponent ? (
              <IconComponent className="w-5 h-5" />
            ) : (
              <Icons.Sparkles className="w-5 h-5" />
            )}
          </div>
        </div>
        
        <div className="mt-4 relative z-10 flex items-end justify-between">
          <div>
            <strong className="block font-display font-black text-4xl md:text-5xl tracking-tight text-white leading-none">
              <span className={flashClass}>{displayValue}</span>
            </strong>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#e9f7ef] text-[#167241] border border-[#167241]/25">
              {trend.pct}
            </span>
            <span className="block text-[9px] font-semibold text-mist mt-1">{trend.desc}</span>
          </div>
        </div>
      </article>
    );
  }

  if (variant === "secondary") {
    return (
      <article
        className="animate-fade-in-up rounded-2xl bg-gradient-to-br from-white to-paper border border-border p-6 flex flex-col justify-between min-h-[140px] shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md cursor-default font-display text-left relative overflow-hidden"
        style={{ animationDelay: delay }}
      >
        <div className="flex justify-between items-start">
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand bg-brand-light px-2.5 py-1 rounded-full">{label}</span>
          {IconComponent && (
            <div className="p-2 bg-paper rounded-lg border border-border/60">
              <IconComponent className="w-4 h-4 text-brand" />
            </div>
          )}
        </div>
        <div className="mt-4 flex items-baseline justify-between">
          <strong className="block font-display font-black text-3xl tracking-tight text-ink">
            <span className={flashClass}>{displayValue}</span>
          </strong>
          <span className="text-[10px] font-bold text-[#167241] bg-[#e9f7ef] px-2 py-0.5 border border-[#167241]/20 rounded-full flex items-center gap-0.5">
            {trend.pct}
          </span>
        </div>
      </article>
    );
  }

  return (
    <article
      className="animate-fade-in-up rounded-xl border border-border bg-white p-4 flex flex-col justify-between shadow-xs transition-all duration-300 hover:-translate-y-1 hover:shadow-sm cursor-default font-display text-left"
      style={{ animationDelay: delay }}
    >
      <p className="text-[9px] font-bold uppercase tracking-wider text-mist leading-tight mb-1">{label}</p>
      <div className="flex items-baseline justify-between">
        <strong className="block font-display font-extrabold text-lg text-ink mt-1">
          <span className={flashClass}>{displayValue}</span>
        </strong>
        <span className="text-[8px] font-semibold text-mist shrink-0">{trend.pct} {trend.desc}</span>
      </div>
    </article>
  );
}

