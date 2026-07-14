import { VolunteerApplicationForm } from "@/components/VolunteerApplicationForm";
import { ApplicationQrCode } from "@/components/ApplicationQrCode";

export default function VolunteerApplyPage() {
  return (
    <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
      <div className="font-display">
        <p className="text-xs font-bold uppercase tracking-widest text-brand">Application Portal</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-ink uppercase">Apply to Volunteer or Intern</h2>
      </div>
      <ApplicationQrCode />
      <VolunteerApplicationForm />
    </main>
  );
}
