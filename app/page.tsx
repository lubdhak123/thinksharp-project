"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart3, ListChecks, PencilLine, ShieldCheck, UserPlus, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const stats = [
  { label: "Beneficiaries reached", value: "12,480" },
  { label: "Trees planted", value: "3,620" },
  { label: "Volunteer hours", value: "8,945" },
  { label: "Active programmes", value: "27" }
];

const tickerItems = [
  "Riya Menon logged Dashboard Development work in Pune",
  "GreenWorks Team completed a Plantation Drive in Nashik",
  "Arjun Rao recorded 4 volunteer hours in Hyderabad",
  "STEM Cohort 12 wrapped a robotics workshop in Bengaluru",
  "Neha Kulkarni added a classroom session in Aurangabad",
  "Sunrise Interns planted 120 saplings in Palghar",
  "Vikas Sharma logged a mentorship hour in Delhi"
];

const photos = [
  {
    src: "/impact-classroom.jpg",
    tag: "Classroom sessions",
    caption: "Learning that meets beneficiaries where they are."
  },
  {
    src: "/impact-stem.jpg",
    tag: "Computer & STEM labs",
    caption: "Digital fluency, one keyboard at a time."
  },
  {
    src: "/impact-plantation.jpg",
    tag: "Plantation drives",
    caption: "Hands in the soil, shade for tomorrow."
  }
];

const cards = [
  {
    href: "/volunteer-apply",
    icon: UserPlus,
    title: "Apply to join",
    desc: "Register interest as a volunteer or intern for admin review.",
    emphasized: false,
    audience: "public"
  },
  {
    href: "/submit",
    icon: PencilLine,
    title: "Log an activity",
    desc: "Record a session, drive, or hour in under a minute.",
    emphasized: false,
    audience: "member"
  },
  {
    href: "/dashboard",
    icon: BarChart3,
    title: "View dashboard",
    desc: "See totals, trends, and programme breakdowns at a glance.",
    emphasized: true,
    audience: "authenticated"
  },
  {
    href: "/records",
    icon: ListChecks,
    title: "Browse records",
    desc: "Search every entry ever logged across the foundation.",
    emphasized: false,
    audience: "admin"
  },
  {
    href: "/admin",
    icon: ShieldCheck,
    title: "Admin portal",
    desc: "Review volunteer and intern requests before onboarding.",
    emphasized: false,
    audience: "admin"
  },
  {
    href: "/admin/members",
    icon: Users,
    title: "Members",
    desc: "Track onboarded volunteers and interns by TSF ID and status.",
    emphasized: false,
    audience: "admin"
  }
] as const;

export default function HomePage() {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const [processingInvite, setProcessingInvite] = useState(false);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    async function handleInviteLanding() {
      if (!supabase || typeof window === "undefined") return;

      const url = new URL(window.location.href);
      const params = new URLSearchParams(url.search);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const code = params.get("code");
      const type = params.get("type") ?? hash.get("type");
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");

      if (!code && !accessToken && type !== "invite" && type !== "recovery") return;

      setProcessingInvite(true);
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        }

        router.replace("/set-password");
      } catch (err) {
        setInviteError(err instanceof Error ? err.message : "Could not verify invitation link.");
        setProcessingInvite(false);
      }
    }

    handleInviteLanding();
  }, [router]);

  const ticker = [...tickerItems, ...tickerItems];

  if (processingInvite) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center font-display">
        <div className="text-center grid gap-3">
          <span className="mx-auto block h-8 w-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-mist uppercase tracking-wider">Verifying invitation link...</p>
          {inviteError && <p className="text-xs text-red-500">{inviteError}</p>}
        </div>
      </div>
    );
  }
  const visibleCards = cards.filter((card) => {
    if (loading) return card.audience === "public";
    if (!user) return card.audience === "public";
    if (role === "admin") return card.audience === "admin" || card.audience === "authenticated";
    return card.audience === "member" || card.audience === "authenticated";
  });
  const doorwayHeading = !user
    ? "Three doorways in."
    : role === "admin"
      ? "Admin workspace."
      : "Your volunteer workspace.";

  return (
    <main className="min-h-screen bg-paper text-ink">
      <section
        className="relative overflow-hidden bg-ink text-white"
        style={{
          backgroundImage:
            "radial-gradient(1200px 600px at 20% 10%, rgba(228,39,43,0.18), transparent 60%), radial-gradient(900px 500px at 90% 90%, rgba(228,39,43,0.10), transparent 60%), linear-gradient(160deg, #141414, #1f1f1f)",
          backgroundSize: "200% 200%"
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 animate-hero-drift opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(600px 400px at 30% 30%, rgba(228,39,43,0.10), transparent 70%), radial-gradient(700px 500px at 70% 70%, rgba(255,255,255,0.03), transparent 70%)",
            backgroundSize: "200% 200%"
          }}
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-24 pt-24 md:pb-32 md:pt-32">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-white/85 ring-1 ring-white/10 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            TRACKING OUR IMPACT
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.02] tracking-tight md:text-6xl lg:text-7xl">
            <span className="inline-block rounded-2xl bg-brand px-4 py-2 text-white shadow-[0_10px_40px_-10px_rgba(228,39,43,0.6)] md:px-5 md:py-3">
              ACROSS EVERY
            </span>{" "}
            <span className="inline-block rounded-2xl bg-brand px-4 py-2 text-white shadow-[0_10px_40px_-10px_rgba(228,39,43,0.6)] md:px-5 md:py-3">
              PROGRAMME
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/70 md:text-lg">
            Every session, drive, and hour logged here becomes a number the foundation can stand behind.
          </p>

          <div className="mt-12 rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10 backdrop-blur md:p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-live-pulse rounded-full bg-brand" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
              </span>
              <span className="text-[10px] font-bold tracking-[0.18em] text-brand">LIVE</span>
              <span className="text-[11px] text-white/50">Updated just now</span>
            </div>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
              {stats.map((stat) => (
                <div className="flex flex-col" key={stat.label}>
                  <span className="text-3xl font-bold tabular-nums text-white md:text-4xl">{stat.value}</span>
                  <span className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/60">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="group overflow-hidden border-y border-border bg-white/60 backdrop-blur" aria-label="Recent activity">
        <div className="flex items-center gap-3 py-3">
          <span className="ml-5 shrink-0 rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-white">
            RECENT
          </span>
          <div className="relative flex-1 overflow-hidden">
            <div className="flex w-max animate-ticker group-hover:[animation-play-state:paused]">
              {ticker.map((item, index) => (
                <span className="flex items-center whitespace-nowrap px-6 text-xs text-mist" key={`${item}-${index}`}>
                  <span className="mr-6 h-1 w-1 rounded-full bg-brand/60" />
                  {item}
                </span>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-paper to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-paper to-transparent" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-[0.18em] text-brand">WHAT WE DO</p>
            <h2 className="mt-2 text-2xl font-bold text-ink md:text-3xl">Three programmes, one shared record.</h2>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {photos.map((photo) => (
            <figure className="group relative overflow-hidden rounded-2xl bg-ink shadow-sm" key={photo.tag}>
              <Image
                src={photo.src}
                alt={photo.tag}
                loading="lazy"
                width={1024}
                height={1024}
                className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />
              <figcaption className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <span className="inline-block rounded-full bg-brand px-2.5 py-0.5 text-[10px] font-bold tracking-[0.14em]">
                  {photo.tag.toUpperCase()}
                </span>
                <p className="mt-2 text-sm text-white/90">{photo.caption}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20 md:pb-28">
        <div className="mb-8">
          <p className="text-[11px] font-bold tracking-[0.18em] text-brand">GET STARTED</p>
          <h2 className="mt-2 text-2xl font-bold text-ink md:text-3xl">{doorwayHeading}</h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                href={card.href}
                className={
                  "group relative flex h-full flex-col rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 md:p-7 " +
                  (card.emphasized
                    ? "border-2 border-brand bg-brand-light hover:shadow-[0_20px_40px_-20px_rgba(228,39,43,0.5)]"
                    : "border border-border bg-white hover:shadow-[0_16px_32px_-20px_rgba(0,0,0,0.25)]")
                }
                key={card.href}
              >
                <div
                  className={
                    "grid h-11 w-11 place-items-center rounded-xl " +
                    (card.emphasized ? "bg-brand text-white" : "border border-border bg-paper text-ink")
                  }
                >
                  <Icon className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <h3 className="mt-5 text-xl font-bold text-ink">{card.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-mist">{card.desc}</p>
                <span
                  className={
                    "mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-transform group-hover:translate-x-0.5 " +
                    (card.emphasized ? "text-brand" : "text-ink")
                  }
                >
                  Open <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Volunteer & Internship Application CTA ── */}
      {!user && <section className="mx-auto max-w-6xl px-5 pb-20 md:pb-28">
        <div className="rounded-2xl border border-border bg-white p-8 md:p-12 text-center shadow-sm relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle at center, var(--brand) 0%, transparent 70%)",
            }}
          />
          <div className="relative z-10 max-w-2xl mx-auto grid gap-4 font-display">
            <p className="text-[11px] font-bold tracking-[0.18em] text-brand uppercase">Join the movement</p>
            <h2 className="text-2xl font-bold text-ink md:text-3xl uppercase tracking-wide">
              Want to Volunteer or Intern?
            </h2>
            <p className="text-sm leading-relaxed text-mist md:text-base">
              Join ThinkSharp Foundation and make an impact in education, community development, technology, and social initiatives.
            </p>
            <div className="mt-4">
              <Link
                href="/volunteer-apply"
                className="inline-flex items-center justify-center rounded-none bg-brand px-8 py-3 text-sm font-bold uppercase tracking-wide text-white hover:bg-ink transition-colors h-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                Apply as Volunteer / Intern
              </Link>
            </div>
            <p className="mt-2 text-xs text-mist max-w-md mx-auto leading-relaxed">
              Become a volunteer or intern with ThinkSharp Foundation. Submit your application online and our team will review it before onboarding.
            </p>
          </div>
        </div>
      </section>}

      <footer className="border-t border-border bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-brand text-xs font-bold text-white">
              TF
            </span>
            <span className="font-bold text-ink">ThinkSharp Foundation</span>
          </div>
          <p className="text-xs text-mist">Internal impact dashboard - 2026 ThinkSharp Foundation</p>
        </div>
      </footer>
    </main>
  );
}
