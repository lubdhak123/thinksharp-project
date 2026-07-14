"use client";

import React, { useEffect, useRef, useState } from "react";
import * as Icons from "lucide-react";

type StatCardProps = {
  label: string;
  value: number | string;
  variant?: "hero" | "secondary" | "ledger";
  iconName?: keyof typeof Icons;
  /** 0-based stagger index → multiplied by 60ms */
  index?: number;
  /** Change this to replay the count-up (tab switch / refresh) */
  animKey?: string | number;
  /** Flash the number after a refresh */
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  if (variant === "hero") {
    return (
      <article
        className="animate-fade-in-up relative overflow-hidden rounded-none bg-ink p-6 text-white border border-ink flex flex-col justify-between min-h-[160px] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/25 cursor-default"
        style={{ animationDelay: delay }}
      >
        <div className="flex justify-between items-start">
          <p className="text-[11px] font-bold uppercase tracking-wider text-mist">{label}</p>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand text-white shadow-sm">
            {IconComponent ? (
              <IconComponent className="w-5 h-5" />
            ) : (
              <Icons.Sparkles className="w-5 h-5" />
            )}
          </div>
        </div>
        <div className="mt-4">
          <strong className="block font-display font-bold text-4xl md:text-5xl tracking-tight text-white leading-none">
            <span className={flashClass}>{displayValue}</span>
          </strong>
          <span className="text-xs font-semibold text-brand mt-2 block tracking-wide uppercase">Primary Impact Metric</span>
        </div>
      </article>
    );
  }

  if (variant === "secondary") {
    const isBrandLight = label.toLowerCase().includes("active") || label.toLowerCase().includes("intern") || label.toLowerCase().includes("hours");
    const bgClass = isBrandLight ? "bg-brand-light/75" : "bg-[#F0F0F0]";

    return (
      <article
        className={`animate-fade-in-up rounded-none ${bgClass} p-5 border border-border flex flex-col justify-between min-h-[130px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-default`}
        style={{ animationDelay: delay }}
      >
        <p className="text-[11px] font-bold uppercase tracking-wider text-mist">{label}</p>
        <div className="mt-3 flex items-baseline justify-between">
          <strong className="block font-display font-bold text-3xl tracking-tight text-ink">
            <span className={flashClass}>{displayValue}</span>
          </strong>
          {IconComponent && (
            <IconComponent className="w-5 h-5 text-mist/60" />
          )}
        </div>
      </article>
    );
  }

  // default: ledger
  return (
    <article
      className="animate-fade-in-up rounded-none border border-border bg-white p-3 flex flex-col justify-between transition-all duration-200 hover:-translate-y-px hover:shadow-md cursor-default"
      style={{ animationDelay: delay }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-mist leading-tight mb-1">{label}</p>
      <strong className="block font-display font-bold text-xl text-ink mt-1">
        <span className={flashClass}>{displayValue}</span>
      </strong>
    </article>
  );
}
