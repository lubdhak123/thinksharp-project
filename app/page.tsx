"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  ListChecks,
  PencilLine,
  ShieldCheck,
  UserPlus,
  Users,
  TreePine,
  Clock,
  BookOpen,
  Laptop,
  Cpu,
  Sprout,
  GraduationCap
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCountUp } from "@/hooks/useCountUp";
import { ProgrammeModal } from "@/components/ProgrammeModal";

const tickerItems = [
  "🟢 LIVE · Riya Menon logged Dashboard Development work in Pune · 2 min ago",
  "🌳 LIVE · GreenWorks Team completed a Plantation Drive in Nashik · 5 min ago",
  "⏰ LIVE · Arjun Rao recorded 4 volunteer hours in Hyderabad · 12 min ago",
  "📚 LIVE · STEM Cohort 12 wrapped a robotics workshop in Bengaluru · 20 min ago",
  "🟢 LIVE · Neha Kulkarni added a classroom session in Aurangabad · 1 hour ago",
  "🌳 LIVE · Sunrise Interns planted 120 saplings in Palghar · 2 hours ago",
  "⏰ LIVE · Vikas Sharma logged a mentorship hour in Delhi · 3 hours ago"
];

const photos = [
  {
    src: "/impact-classroom.jpg",
    tag: "Classroom sessions",
    caption: "Learning that meets beneficiaries where they are.",
    desc: "Teaching students in rural communities with basic curriculum guidance.",
    icon: GraduationCap
  },
  {
    src: "/impact-stem.jpg",
    tag: "Computer & STEM labs",
    caption: "Digital fluency, one keyboard at a time.",
    desc: "Providing computer labs and robotics kits to build future tech readiness.",
    icon: Laptop
  },
  {
    src: "/impact-plantation.jpg",
    tag: "Plantation drives",
    caption: "Hands in the soil, shade for tomorrow.",
    desc: "Engaging rural schools in planting trees and environmental stewardship.",
    icon: Sprout
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
  const [selectedProgramme, setSelectedProgramme] = useState<"Classroom sessions" | "Computer & STEM labs" | "Plantation drives" | null>(null);

  // Live count-up states for Hero
  const countBeneficiaries = useCountUp(12480, 1000);
  const countTrees = useCountUp(3620, 1000);
  const countHours = useCountUp(8945, 1000);
  const countProgrammes = useCountUp(27, 1000);

  // Collective Impact Animated Counters
  const countVolunteers = useCountUp(150, 1100);
  const countSchools = useCountUp(40, 1100);
  const countBens = useCountUp(18500, 1100);
  const countImpactHours = useCountUp(12000, 1100);
  const countPlantedTrees = useCountUp(800, 1100);

  const displayStats = [
    { label: "Beneficiaries reached", value: countBeneficiaries.toLocaleString("en-IN"), icon: Users },
    { label: "Trees planted", value: countTrees.toLocaleString("en-IN"), icon: TreePine },
    { label: "Volunteer hours", value: countHours.toLocaleString("en-IN"), icon: Clock },
    { label: "Active programmes", value: countProgrammes.toLocaleString("en-IN"), icon: BookOpen }
  ];

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
    ? "Choose Your Journey"
    : role === "admin"
      ? "Admin workspace."
      : "Your volunteer workspace.";

  return (
    <main className="min-h-screen bg-paper text-ink">
      <style>{`
        @keyframes hover-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes hover-slower {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        @keyframes float-gentle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(1deg); }
        }
        .animate-hover-slow {
          animation: hover-slow 4s ease-in-out infinite;
        }
        .animate-hover-slower {
          animation: hover-slower 6s ease-in-out infinite;
        }
        .animate-float-gentle {
          animation: float-gentle 5s ease-in-out infinite;
        }
      `}</style>

      {/* ── Tall Hero Section ── */}
      <section
        className="relative overflow-hidden bg-ink text-white min-h-[85vh] flex items-center"
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
        <div className="relative mx-auto max-w-6xl px-5 py-20 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Text Block */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-white/85 ring-1 ring-white/10 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              TRACKING OUR IMPACT
            </div>

            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl lg:text-6xl xl:text-7xl">
              <span className="inline-block rounded-2xl bg-brand px-4 py-2 text-white shadow-[0_10px_40px_-10px_rgba(228,39,43,0.6)] md:px-5 md:py-3">
                ACROSS EVERY
              </span>{" "}
              <br />
              <span className="inline-block rounded-2xl bg-brand px-4 py-2 mt-2 text-white shadow-[0_10px_40px_-10px_rgba(228,39,43,0.6)] md:px-5 md:py-3">
                PROGRAMME
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-white/85 md:text-lg">
              Empowering education, technology, and community initiatives through transparent volunteer management and real-time impact tracking.
            </p>

            {/* Hero CTAs */}
            <div className="mt-8 flex flex-wrap gap-4 font-display">
              {!user ? (
                <>
                  <Link
                    href="/volunteer-apply"
                    className="inline-flex h-12 items-center justify-center bg-brand hover:bg-[#c31e21] px-6 text-sm font-bold uppercase tracking-wider text-white transition-colors shadow-[0_4px_12px_rgba(228,39,43,0.3)]"
                  >
                    Apply as Volunteer
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex h-12 items-center justify-center border border-white/20 hover:border-white hover:bg-white/5 px-6 text-sm font-bold uppercase tracking-wider text-white transition-all"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center justify-center bg-brand hover:bg-[#c31e21] px-6 text-sm font-bold uppercase tracking-wider text-white transition-colors"
                >
                  Go to Dashboard
                </Link>
              )}
            </div>

            {/* Metrics card Overlay */}
            <div className="mt-12 rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10 backdrop-blur md:p-6 shadow-xl border border-white/5">
              <div className="mb-5 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-live-pulse rounded-full bg-brand" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
                </span>
                <span className="text-[10px] font-bold tracking-[0.18em] text-brand">LIVE DATA</span>
                <span className="text-[11px] text-white/50">Updated dynamically</span>
              </div>
              <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
                {displayStats.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div className="flex flex-col" key={stat.label}>
                      <span className="flex items-center gap-1.5 text-3xl font-bold tabular-nums text-white md:text-4xl">
                        <Icon size={18} className="text-brand shrink-0" />
                        {stat.value}
                      </span>
                      <span className="mt-1.5 text-[10px] uppercase tracking-[0.14em] text-white/60 font-semibold">{stat.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Mockup Graphic Column */}
          <div className="lg:col-span-5 hidden lg:block relative h-[450px]">
            {/* Main Mockup Card */}
            <div className="absolute top-0 right-0 w-[380px] bg-white/[0.04] backdrop-blur-md border border-white/10 p-6 rounded-2xl ring-1 ring-white/5 shadow-2xl animate-float-gentle z-10">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-white/50 tracking-wider">MONTHLY LOG TRENDS</span>
                <span className="text-[10px] bg-brand text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider">+14.2%</span>
              </div>
              
              {/* SVG mock graph */}
              <svg viewBox="0 0 300 120" className="w-full h-28 stroke-brand fill-none stroke-[3] overflow-visible">
                <path
                  d="M 10,100 C 40,90 70,30 100,50 C 130,70 160,20 190,40 C 220,60 250,5 280,15"
                  className="stroke-brand"
                  style={{
                    strokeDasharray: "500",
                    strokeDashoffset: "0"
                  }}
                />
                <path
                  d="M 10,100 C 40,90 70,30 100,50 C 130,70 160,20 190,40 C 220,60 250,5 280,15 L 280,120 L 10,120 Z"
                  className="fill-brand/10 stroke-none"
                />
              </svg>
              
              <div className="mt-4 border-t border-white/10 pt-4 flex justify-between text-xs text-white/60">
                <div>
                  <p className="text-[10px] uppercase text-white/40 font-bold">TOTAL SUBMITTED</p>
                  <p className="mt-1 font-bold text-white text-sm">482 logs</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase text-white/40 font-bold">AVERAGE HOURS</p>
                  <p className="mt-1 font-bold text-white text-sm">4.8 hrs/log</p>
                </div>
              </div>
            </div>
            
            {/* Layer 2: Floating Card 1 */}
            <div className="absolute top-52 -left-4 w-[200px] bg-[#161616]/95 border border-white/10 p-4 rounded-xl shadow-2xl animate-hover-slow ring-1 ring-white/5 z-20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#e9f7ef] text-[#167241] flex items-center justify-center shrink-0">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-[8px] uppercase text-white/40 font-bold tracking-wider font-display">ACTIVE MEMBERS</p>
                  <p className="text-xs font-bold text-white mt-0.5">82 Onboarded</p>
                </div>
              </div>
            </div>
            
            {/* Layer 3: Floating Card 2 */}
            <div className="absolute bottom-6 right-12 w-[220px] bg-white border border-border p-4 rounded-xl shadow-2xl animate-hover-slower font-display z-30">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] uppercase font-bold text-mist tracking-wide">Verification Badge</span>
                <span className="w-2 h-2 rounded-full bg-[#167241]" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-ink">TSF-CERT-2026-0012</p>
                <p className="text-[10px] text-mist mt-0.5">Verified Completion Certificate</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Live Ticker Section ── */}
      <section className="group overflow-hidden border-y border-border bg-white/60 backdrop-blur" aria-label="Recent activity">
        <div className="flex items-center gap-3 py-3">
          <span className="ml-5 shrink-0 rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] text-white">
            ACTIVITY TICKER
          </span>
          <div className="relative flex-1 overflow-hidden">
            <div className="flex w-max animate-ticker group-hover:[animation-play-state:paused]">
              {ticker.map((item, index) => (
                <span className="flex items-center whitespace-nowrap px-6 text-xs text-mist font-semibold" key={`${item}-${index}`}>
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

      {/* ── Trusted by Strip ── */}
      <section className="bg-paper/30 py-6 border-b border-border text-center">
        <p className="text-[10px] uppercase tracking-widest text-mist font-bold font-display">
          TRUSTED COLLABORATORS & SPONSORS
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-8 text-xs text-mist font-bold font-display">
          <span>100+ Rural Schools</span>
          <span className="opacity-55">·</span>
          <span>Corporate Sponsors</span>
          <span className="opacity-55">·</span>
          <span>Local NGOs</span>
          <span className="opacity-55">·</span>
          <span>Volunteer Networks</span>
        </div>
      </section>

      {/* ── Our Impact Section (Animated Numbers) ── */}
      <section className="bg-ink text-white py-16 relative overflow-hidden" style={{
        backgroundImage: "linear-gradient(180deg, #141414, #1c1c1c)"
      }}>
        <div className="relative mx-auto max-w-6xl px-5 text-center font-display">
          <p className="text-[11px] font-bold tracking-[0.18em] text-brand uppercase">OUR IMPACT</p>
          <h2 className="mt-2 text-2xl font-bold md:text-3xl">Making Rural Education Possible</h2>
          <p className="mt-2 text-sm text-white/60 max-w-lg mx-auto">
            A real-time tracking of community service hours, school setups, and environmental tree planting initiatives.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mt-12">
            {[
              { label: "Volunteers Engaged", value: `${countVolunteers}+`, icon: Users },
              { label: "Schools Setup", value: `${countSchools}`, icon: GraduationCap },
              { label: "Beneficiaries reached", value: countBens.toLocaleString("en-IN"), icon: Users },
              { label: "Service Hours", value: countImpactHours.toLocaleString("en-IN"), icon: Clock },
              { label: "Trees Planted", value: countPlantedTrees.toLocaleString("en-IN"), icon: TreePine }
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div 
                  key={i} 
                  className="flex flex-col items-center bg-white/[0.03] border border-white/5 p-6 rounded-2xl ring-1 ring-white/5 hover:scale-105 transition-transform"
                >
                  <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-3">
                    <Icon size={18} />
                  </div>
                  <span className="text-3xl font-extrabold tabular-nums text-white md:text-4xl">{stat.value}</span>
                  <span className="mt-2 text-[10px] uppercase tracking-[0.14em] text-white/50 font-bold">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Better Programme Cards Grid ── */}
      <section className="mx-auto max-w-6xl px-5 py-20 md:py-28">
        <div className="mb-10">
          <p className="text-[11px] font-bold tracking-[0.18em] text-brand">WHAT WE DO</p>
          <h2 className="mt-2 text-2xl font-bold text-ink md:text-3xl">Three programmes, one shared record.</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {photos.map((photo) => {
            const Icon = photo.icon;
            return (
              <div 
                className="group relative overflow-hidden rounded-2xl bg-white border border-border/80 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between" 
                key={photo.tag}
              >
                {/* Image Section */}
                <div className="h-60 overflow-hidden relative">
                  <Image
                    src={photo.src}
                    alt={photo.tag}
                    loading="lazy"
                    width={1024}
                    height={1024}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
                  />
                  {/* Dark gradient overlay on image */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Dynamic Floating Badge Icon */}
                  <div className="absolute top-4 left-4 bg-brand text-white p-2.5 rounded-xl shadow-lg z-20 group-hover:rotate-6 transition-transform">
                    <Icon size={18} />
                  </div>

                  <span className="absolute bottom-4 left-5 inline-block rounded-full bg-brand/20 backdrop-blur-md border border-brand/30 px-3 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white">
                    {photo.tag}
                  </span>
                </div>
                
                {/* Content Details */}
                <div className="p-6 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="text-lg font-black text-ink uppercase tracking-wide">{photo.tag}</h3>
                    <p className="mt-2 text-xs text-mist leading-relaxed">{photo.desc}</p>
                  </div>
                  <div className="mt-5 border-t border-border pt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedProgramme(photo.tag as any)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand uppercase tracking-wider group-hover:translate-x-1.5 transition-transform outline-none focus:outline-none"
                    >
                      Learn More <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Onboarding Journey Timeline Section ── */}
      <section className="mx-auto max-w-6xl px-5 pb-20 md:pb-28">
        <div className="mb-12 text-center font-display">
          <p className="text-[11px] font-bold tracking-[0.18em] text-brand uppercase">ONBOARDING STEPS</p>
          <h2 className="mt-2 text-2xl font-bold text-ink md:text-3xl">The Onboarding Journey</h2>
          <p className="mt-2 text-sm text-mist max-w-lg mx-auto">
            From registering interest to earning your certified tenure completion—our onboarding flow is transparent and crystal clear.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line for desktop screens */}
          <div className="absolute top-[24px] left-[8%] right-[8%] h-0.5 bg-border hidden md:block z-0" />
          
          <div className="grid grid-cols-1 md:grid-cols-6 gap-8 relative z-10 font-display">
            {[
              {
                step: "01",
                title: "Apply",
                desc: "Submit your registration interest online in under 3 minutes.",
              },
              {
                step: "02",
                title: "Approved",
                desc: "Administrators review and verify your application credentials.",
              },
              {
                step: "03",
                title: "Receive Invite",
                desc: "Get an email containing your new TSF ID and password setup link.",
              },
              {
                step: "04",
                title: "Login",
                desc: "Complete credentials setup and review / sign the agreement terms.",
              },
              {
                step: "05",
                title: "Volunteer",
                desc: "Start participating in activities and log them inside your dashboard.",
              },
              {
                step: "06",
                title: "Earn Certificate",
                desc: "Complete your tenure and download your custom PDF certificate.",
              },
            ].map((node, i) => (
              <article
                key={node.step}
                className="flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-0 bg-white md:bg-transparent border border-border md:border-0 p-5 md:p-0 rounded-2xl md:rounded-none relative group hover:shadow-md md:hover:shadow-none transition-shadow"
              >
                {/* Node circle */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-brand bg-[#fff5f5] text-brand flex items-center justify-center font-bold text-sm tracking-wider mb-0 md:mb-4 group-hover:scale-105 transition-transform shadow-[0_4px_12px_rgba(228,39,43,0.12)] z-20">
                  {node.step}
                </div>
                
                {/* Text details */}
                <div className="text-left">
                  <h3 className="text-base font-bold text-ink">{node.title}</h3>
                  <p className="mt-1.5 text-xs text-mist leading-relaxed">{node.desc}</p>
                </div>

                {/* Vertical connecting bar on mobile */}
                {i < 5 && (
                  <div className="absolute left-[33px] md:left-auto top-[68px] bottom-[-32px] w-0.5 bg-border block md:hidden z-0" />
                )}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Choose Your Journey / Empty White Space Fix ── */}
      <section className="mx-auto max-w-6xl px-5 pb-20 md:pb-28">
        <div className="mb-8">
          <p className="text-[11px] font-bold tracking-[0.18em] text-brand">GET STARTED</p>
          <h2 className="mt-2 text-2xl font-bold text-ink md:text-3xl">{doorwayHeading}</h2>
        </div>

        {!user ? (
          /* Render Three Equal Cards Side-by-Side to Replace Empty Space */
          <div className="grid gap-6 md:grid-cols-3">
            {/* Card 1: Login */}
            <div className="border border-border bg-white p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                  <Users size={18} />
                </div>
                <h3 className="text-lg font-bold text-ink uppercase tracking-wide">Login</h3>
                <p className="mt-2 text-xs font-semibold text-mist leading-relaxed">
                  Already a Volunteer or Intern?
                </p>
                <p className="mt-0.5 text-xs text-mist leading-relaxed">
                  Access your dashboard, check hours, and log new activities.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex h-10 items-center justify-center border border-border bg-paper hover:border-brand hover:text-brand px-4 text-xs font-bold uppercase tracking-wider text-ink transition-colors w-full"
                >
                  Sign In
                </Link>
              </div>
            </div>

            {/* Card 2: Apply */}
            <div className="border-2 border-brand bg-brand-light p-6 rounded-2xl flex flex-col justify-between hover:shadow-[0_12px_24px_rgba(228,39,43,0.15)] transition-all group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-brand text-white flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(228,39,43,0.3)] transition-transform group-hover:scale-105">
                  <UserPlus size={18} />
                </div>
                <h3 className="text-lg font-bold text-brand uppercase tracking-wide">Apply</h3>
                <p className="mt-2 text-xs font-semibold text-ink leading-relaxed">
                  Become a Volunteer or Intern
                </p>
                <p className="mt-0.5 text-xs text-mist leading-relaxed">
                  Register your interest online for administrator review and onboarding.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href="/volunteer-apply"
                  className="inline-flex h-10 items-center justify-center bg-brand hover:bg-[#c31e21] px-4 text-xs font-bold uppercase tracking-wider text-white transition-colors w-full shadow-md"
                >
                  Apply Now
                </Link>
              </div>
            </div>

            {/* Card 3: Admin Portal */}
            <div className="border border-border bg-white p-6 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow group">
              <div>
                <div className="w-10 h-10 rounded-xl bg-paper border border-border text-ink flex items-center justify-center mb-4 transition-transform group-hover:scale-105">
                  <ShieldCheck size={18} />
                </div>
                <h3 className="text-lg font-bold text-ink uppercase tracking-wide">Admin Portal</h3>
                <p className="mt-2 text-xs font-semibold text-mist leading-relaxed">
                  Foundation Staff Login
                </p>
                <p className="mt-0.5 text-xs text-mist leading-relaxed">
                  Review applications, approve profiles, and manage member tenures.
                </p>
              </div>
              <div className="mt-6">
                <Link
                  href="/admin"
                  className="inline-flex h-10 items-center justify-center border border-border bg-paper hover:border-brand hover:text-brand px-4 text-xs font-bold uppercase tracking-wider text-ink transition-colors w-full"
                >
                  Admin Login
                </Link>
              </div>
            </div>
          </div>
        ) : (
          /* Render Active Workspace Cards for Logged-In Members */
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
        )}
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

      {selectedProgramme && (
        <ProgrammeModal
          programme={selectedProgramme}
          onClose={() => setSelectedProgramme(null)}
        />
      )}
    </main>
  );
}
