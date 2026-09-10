import { PublicActivityForm } from "@/components/PublicActivityForm";

export default function PublicReportPage() {
  return (
    <main className="mx-auto grid max-w-4xl gap-6 px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <div className="font-display text-center sm:text-left">
        <span className="text-[10px] font-black uppercase tracking-widest text-brand bg-brand-light border border-brand/20 px-3 py-1 rounded-full">
          PUBLIC ENGAGEMENT PORTAL
        </span>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-ink sm:text-4xl">
          Volunteer Activity Report
        </h1>
        <p className="mt-2 text-xs font-semibold text-mist max-w-2xl leading-relaxed">
          Submit your volunteering activity report directly to ThinkSharp Foundation. All submissions through this public link undergo Admin review before appearing on the public impact dashboard.
        </p>
      </div>

      <PublicActivityForm />
    </main>
  );
}
