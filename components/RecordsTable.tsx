import Link from "next/link";
import { Copy } from "lucide-react";
import { getTotalHours } from "@/lib/queries";
import type { Activity } from "@/lib/types";

export function RecordsTable({ records }: { records: Activity[] }) {
  return (
    <div className="overflow-auto rounded-none border border-border bg-white">
      <table className="w-full min-w-[1060px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b-2 border-border text-[11px] uppercase tracking-wider text-mist bg-paper/50">
            <th className="p-4 font-bold">Date</th>
            <th className="p-4 font-bold">Name</th>
            <th className="p-4 font-bold">Entry</th>
            <th className="p-4 font-bold">Type</th>
            <th className="p-4 font-bold">Programme / Milestone</th>
            <th className="p-4 font-bold">Project / Work</th>
            <th className="p-4 font-bold">Location</th>
            <th className="p-4 font-bold">Hours</th>
            <th className="p-4 font-bold">Beneficiaries</th>
            <th className="p-4 font-bold">Staff & Submitter</th>
            <th className="p-4 font-bold">Repeat</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td className="p-6 text-center font-bold text-mist" colSpan={11}>
                No matching activity records.
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr key={record.id} className="border-b border-border hover:bg-brand-light/40 transition-colors last:border-0">
                <td className="p-4 font-display text-xs font-semibold text-ink">{record.activity_date}</td>
                <td className="p-4 font-bold">{record.volunteer_name}</td>
                <td className="p-4">
                  <EntryBadge type={record.entry_type} />
                </td>
                <td className="p-4 text-xs font-semibold text-mist uppercase tracking-wide">
                  {record.entry_type === "intern" ? (record.department ?? "") : (record.volunteer_type ?? "")}
                </td>
                <td className="p-4">
                  {record.entry_type === "intern" ? (record.milestone ?? "") : (record.programme_name ?? "")}
                </td>
                <td className="p-4 text-xs font-bold text-brand uppercase tracking-wide font-display">
                  {record.entry_type === "intern" ? (record.intern_work_type ?? "") : (record.project_type ?? "")}
                </td>
                <td className="p-4">{record.location}</td>
                <td className="p-4 font-display font-bold text-ink">{getTotalHours(record).toLocaleString("en-IN")}</td>
                <td className="p-4 font-display font-bold text-ink">{Number(record.beneficiaries_impacted ?? 0).toLocaleString("en-IN")}</td>
                <td className="p-4">
                  <div className="font-bold text-xs text-ink">{record.staff_in_charge ?? "—"}</div>
                  <div className="text-[10px] text-mist mt-0.5">By: {record.submitted_by ?? "Self"}</div>
                </td>
                <td className="p-4">
                  <Link
                    className="inline-flex h-9 w-9 items-center justify-center border border-border bg-white text-mist hover:border-brand hover:text-brand"
                    href={`/submit?repeat=${record.id}`}
                    aria-label={`Repeat ${record.volunteer_name} activity from ${record.activity_date}`}
                    title="Repeat this record"
                  >
                    <Copy size={15} />
                  </Link>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function EntryBadge({ type }: { type: "volunteer" | "intern" }) {
  const isVolunteer = type === "volunteer";
  return (
    <span
      className={`inline-block rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        isVolunteer
          ? "bg-brand-light text-brand"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {isVolunteer ? "Volunteer" : "Intern"}
    </span>
  );
}
