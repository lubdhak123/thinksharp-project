"use client";

import { Download, Share2 } from "lucide-react";
import { forwardRef } from "react";
import type { ImpactStats } from "@/lib/types";

type ImpactCardProps = {
  periodLabel: string;
  stats: ImpactStats;
  onDownload?: () => void;
  onShare?: () => void;
  canShare?: boolean;
  busy?: boolean;
};

export const ImpactCard = forwardRef<HTMLDivElement, ImpactCardProps>(function ImpactCard(
  { periodLabel, stats, onDownload, onShare, canShare = false, busy = false },
  ref
) {
  return (
    <div className="grid gap-4">
      <div
        ref={ref}
        className="w-full max-w-[560px] rounded-xl bg-gradient-to-br from-[#1A1A1A] to-[#2b2b2b] p-6 text-white shadow-soft"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-brand text-base font-black text-white">
              TF
            </div>
            <div>
              <p className="text-sm font-black tracking-normal">ThinkSharp Foundation</p>
              <p className="text-xs font-semibold text-white/60">Impact snapshot</p>
            </div>
          </div>
          <p className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white/80">
            {periodLabel}
          </p>
        </div>

        <div className="mt-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/55">Tracking our impact</p>
          <h2 className="mt-2 inline-block rounded-lg bg-brand px-4 py-2 text-2xl font-black uppercase leading-none tracking-normal text-white">
            Across Every Programme
          </h2>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3">
          <Stat label="Beneficiaries reached" value={stats.beneficiariesReached} />
          <Stat label="Trees planted" value={stats.treesPlanted} />
          <Stat label="Hours given" value={stats.hoursGiven} />
          <Stat label="People involved" value={stats.peopleInvolved} />
        </div>

        <p className="mt-6 text-xs font-semibold text-white/55">
          Every session, drive, and hour logged becomes a number the foundation can stand behind.
        </p>
      </div>

      {(onDownload || onShare) && (
        <div className="flex flex-wrap gap-2">
          {onDownload && (
            <button
              className="inline-flex items-center gap-2 border border-border bg-white px-4 py-2 text-sm font-semibold text-ink hover:border-brand hover:text-brand"
              type="button"
              onClick={onDownload}
              disabled={busy}
            >
              <Download size={15} />
              Download image
            </button>
          )}
          {onShare && canShare && (
            <button
              className="inline-flex items-center gap-2 border border-brand bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-ink"
              type="button"
              onClick={onShare}
              disabled={busy}
            >
              <Share2 size={15} />
              Share
            </button>
          )}
        </div>
      )}
    </div>
  );
});

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/10 p-4">
      <p className="text-2xl font-black tracking-normal text-white">{Number(value).toLocaleString("en-IN")}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-wider text-white/55">{label}</p>
    </div>
  );
}
