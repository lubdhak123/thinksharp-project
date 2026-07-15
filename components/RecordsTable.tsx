import Link from "next/link";
import { Copy, User, Calendar, MapPin, Clock, Heart, ShieldCheck } from "lucide-react";
import { getTotalHours } from "@/lib/queries";
import type { Activity } from "@/lib/types";

export function RecordsTable({ records }: { records: Activity[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
      <div className="overflow-auto">
        <table className="w-full min-w-[1120px] border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border text-[10px] uppercase tracking-widest text-mist bg-paper/60 font-black">
              <th className="p-4 pl-6 font-bold">Date</th>
              <th className="p-4 font-bold">Name</th>
              <th className="p-4 font-bold">Entry Type</th>
              <th className="p-4 font-bold">Category</th>
              <th className="p-4 font-bold">Programme / Milestone</th>
              <th className="p-4 font-bold">Project / Work</th>
              <th className="p-4 font-bold">Location</th>
              <th className="p-4 font-bold">Hours</th>
              <th className="p-4 font-bold">Impact</th>
              <th className="p-4 font-bold">Verification Status</th>
              <th className="p-4 pr-6 text-center font-bold">Repeat</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td className="p-8 text-center font-bold text-mist" colSpan={11}>
                  No matching activity records.
                </td>
              </tr>
            ) : (
              records.map((record, index) => {
                const totalHours = getTotalHours(record);
                return (
                  <tr 
                    key={record.id} 
                    className={`border-b border-border hover:bg-brand-light/30 transition-all duration-200 last:border-0 ${
                      index % 2 === 0 ? "bg-white" : "bg-paper/20"
                    }`}
                  >
                    <td className="p-4 pl-6 font-display font-semibold text-ink whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-mist shrink-0" />
                        {record.activity_date}
                      </span>
                    </td>
                    <td className="p-4 font-bold">
                      <span className="inline-flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-brand shrink-0" />
                        {record.volunteer_name}
                      </span>
                    </td>
                    <td className="p-4">
                      <EntryBadge type={record.entry_type} />
                    </td>
                    <td className="p-4 font-medium text-mist uppercase tracking-wide">
                      {record.entry_type === "intern" ? (record.department ?? "—") : (record.volunteer_type ?? "—")}
                    </td>
                    <td className="p-4 font-semibold text-ink">
                      {record.entry_type === "intern" ? (record.milestone ?? "—") : (record.programme_name ?? "—")}
                    </td>
                    <td className="p-4">
                      <span className="inline-block px-2.5 py-1 text-[9px] font-black bg-brand/5 text-brand border border-brand/10 rounded-lg uppercase tracking-wide">
                        {record.entry_type === "intern" ? (record.intern_work_type ?? "—") : (record.project_type ?? "—")}
                      </span>
                    </td>
                    <td className="p-4 text-ink font-semibold">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-mist" />
                        {record.location}
                      </span>
                    </td>
                    <td className="p-4 font-display font-bold text-ink whitespace-nowrap">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-mist" />
                        {totalHours.toLocaleString("en-IN")} hrs
                      </span>
                    </td>
                    <td className="p-4 font-display font-black text-brand whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-xs">
                        💖 {Number(record.beneficiaries_impacted ?? 0).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="font-bold text-xs text-ink flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-brand shrink-0" />
                          {record.staff_in_charge ?? "ThinkSharp Staff"}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-mist font-medium">By: {record.submitted_by ?? "Self"}</span>
                          {record.status && <StatusBadge status={record.status} />}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 pr-6 text-center">
                      <Link
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-white text-mist hover:border-brand hover:text-brand hover:shadow-sm transition-all"
                        href={`/submit?repeat=${record.id}`}
                        aria-label={`Repeat ${record.volunteer_name} activity from ${record.activity_date}`}
                        title="Repeat this record"
                      >
                        <Copy size={13} />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EntryBadge({ type }: { type: "volunteer" | "intern" }) {
  const isVolunteer = type === "volunteer";
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${
        isVolunteer
          ? "bg-brand-light text-brand border border-brand/20"
          : "bg-paper text-ink border border-border/80"
      }`}
    >
      {isVolunteer ? "Volunteer" : "Intern"}
    </span>
  );
}

function StatusBadge({ status }: { status: "Submitted" | "Approved" | "Rejected" }) {
  let styleClass = "bg-amber-50 text-amber-700 border-amber-600/20";
  if (status === "Approved") {
    styleClass = "bg-emerald-50 text-emerald-700 border-emerald-600/20";
  } else if (status === "Rejected") {
    styleClass = "bg-rose-50 text-rose-700 border-rose-600/20";
  }

  return (
    <span className={`inline-block px-1.5 py-0.25 text-[8px] font-bold rounded-sm border ${styleClass} uppercase tracking-wider`}>
      {status}
    </span>
  );
}
