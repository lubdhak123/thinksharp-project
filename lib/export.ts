"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { getTotalHours } from "./queries";
import type { Activity, Member, Summary } from "./types";

export function exportActivitiesToExcel(records: Activity[]) {
  const rows = records.map((record) => ({
    Date: record.activity_date,
    Name: record.volunteer_name,
    Type: record.volunteer_type,
    Organisation: record.organisation ?? "",
    Location: record.location,
    Programme: record.programme_name,
    Project: record.project_type,
    "Intern Work Type": record.intern_work_type ?? "",
    "Volunteers Participated": record.num_volunteers,
    "Individual Hours": record.individual_hours,
    "Group Hours": record.group_hours,
    "Volunteering Hours": record.volunteering_hours,
    "Total Hours": getTotalHours(record),
    "Beneficiaries Impacted": record.beneficiaries_impacted,
    "Trees Planted": record.trees_planted,
    "Activities Completed": record.activities_completed,
    "Internship Start Date": record.internship_start_date ?? "",
    "Internship End Date": record.internship_end_date ?? "",
    "Staff In-Charge": record.staff_in_charge ?? "",
    "Submitted By": record.submitted_by ?? "",
    "Staff Notes / Observations": record.remarks ?? ""
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Activities");
  XLSX.writeFile(workbook, `thinksharp-activities-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportSummaryToPdf(summary: Summary, records: Activity[], view: string) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("ThinkSharp Volunteer & Intern Impact Dashboard", 14, 18);
  doc.setFontSize(10);
  doc.text(`View: ${view} | Generated: ${new Date().toLocaleString()}`, 14, 26);

  autoTable(doc, {
    startY: 34,
    head: [["Metric", "Value"]],
    body: [
      ["Total Volunteers", summary.totalVolunteers],
      ["Total Interns", summary.totalInterns],
      ["Active Volunteers", summary.activeVolunteers],
      ["Active Interns", summary.activeInterns],
      ["Volunteer Hours", summary.volunteerHours],
      ["Intern Hours", summary.internHours],
      ["Beneficiaries Impacted", summary.beneficiariesImpacted],
      ["Activities Conducted", summary.activitiesConducted],
      ["Trees Planted", summary.treesPlanted],
      ["Volunteer Sessions", summary.volunteerSessions],
      ["Intern Projects", summary.internProjects]
    ]
  });

  autoTable(doc, {
    startY: (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY
      ? (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
      : 120,
    head: [["Date", "Name", "Type", "Programme", "Project", "Staff In-Charge", "Hours"]],
    body: records.slice(0, 25).map((record) => [
      record.activity_date,
      record.volunteer_name,
      record.entry_type === "intern" ? "Intern" : record.volunteer_type,
      record.entry_type === "intern" ? record.milestone : record.programme_name,
      record.entry_type === "intern" ? record.intern_work_type : record.project_type,
      record.staff_in_charge ?? "",
      getTotalHours(record)
    ])
  });

  doc.save(`thinksharp-dashboard-${view.toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportMemberCertificate(
  member: Member,
  stats: { hours: number; activities: number; beneficiaries: number }
) {
  // A4 Landscape orientation: 297mm x 210mm
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // 1. Draw outer brand borders (ThinkSharp brand red color)
  doc.setDrawColor(228, 39, 43);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, 277, 190);

  // 2. Draw inner thin accent border
  doc.setDrawColor(31, 31, 31);
  doc.setLineWidth(0.3);
  doc.rect(12, 12, 273, 186);

  // 3. Foundation Header
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(26, 26, 26);
  doc.text("THINKSHARP FOUNDATION", 148.5, 36, { align: "center" });

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(112, 112, 112);
  doc.text("Empowering Rural Education", 148.5, 43, { align: "center" });

  // Decorative center ribbon / lines
  doc.setDrawColor(228, 39, 43);
  doc.setLineWidth(0.5);
  doc.line(118, 52, 178, 52);

  // 4. Main Certificate Header
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(228, 39, 43);
  doc.text("CERTIFICATE OF COMPLETION", 148.5, 68, { align: "center" });

  // 5. Presentational statement
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(51, 51, 51);
  doc.text("This certificate is proudly presented to", 148.5, 86, { align: "center" });

  // 6. Recipient Name (Large & Bold)
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(26, 26, 26);
  doc.text(member.name, 148.5, 98, { align: "center" });

  // 7. Role & Contribution details
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(77, 77, 77);

  const roleText = member.role === "intern" ? "Internship" : "Volunteering";
  const descText = `for outstanding contribution and service during their ${roleText} tenure with ThinkSharp Foundation.`;
  doc.text(descText, 148.5, 110, { align: "center" });

  // 8. Stats summary statement
  const statsText1 = `During this period, they successfully contributed a total of ${stats.hours} hours`;
  const statsText2 = `across ${stats.activities} completed activities, directly impacting approximately ${stats.beneficiaries} beneficiaries.`;
  doc.text(statsText1, 148.5, 120, { align: "center" });
  doc.text(statsText2, 148.5, 126, { align: "center" });

  // 9. Footnote Metadata
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(112, 112, 112);
  doc.text(`Certificate No: ${member.certificate_number || "TSF-CERT-2026-XXXX"}`, 30, 154);

  const issueDate = member.completed_at
    ? new Date(member.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  doc.setFont("Helvetica", "normal");
  doc.text(`Date of Issue: ${issueDate}`, 30, 160);

  // 10. Signatures Section
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);

  // Rameshwar Khairnar Co-Founder
  doc.line(160, 165, 210, 165);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Rameshwar Khairnar", 185, 170, { align: "center" });
  doc.setFont("Helvetica", "normal");
  doc.setTextColor(112, 112, 112);
  doc.text("Co-Founder", 185, 174, { align: "center" });

  // Santosh Phad Founder
  doc.line(220, 165, 270, 165);
  doc.setFont("Helvetica", "bold");
  doc.text("Santosh Phad", 245, 170, { align: "center" });
  doc.setFont("Helvetica", "normal");
  doc.text("Founder & Trustee", 245, 174, { align: "center" });

  // Save PDF
  const filename = `TSF-Certificate-${member.name.replace(/\s+/g, "-")}.pdf`;
  doc.save(filename);
}
