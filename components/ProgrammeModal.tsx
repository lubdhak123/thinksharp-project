"use client";

import { useEffect } from "react";
import { X, ArrowRight, BookOpen, Laptop, Sprout, Calendar, Award, GraduationCap, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type ProgrammeTag = "Classroom sessions" | "Computer & STEM labs" | "Plantation drives";

interface ProgrammeModalProps {
  programme: ProgrammeTag;
  onClose: () => void;
}

export function ProgrammeModal({ programme, onClose }: ProgrammeModalProps) {
  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const content = {
    "Classroom sessions": {
      title: "Classroom Sessions",
      tagline: "Empowering children through education and mentorship.",
      icon: <GraduationCap className="w-8 h-8 text-brand" />,
      overview: "Volunteers visit schools and community centres to conduct teaching sessions, mentoring programmes, reading clubs, life skills workshops, and educational activities designed to enrich standard state school curriculums.",
      activities: [
        "Teaching Mathematics and Basic Science",
        "English Communication and Vocabulary Building",
        "Storytelling and Reading Clubs",
        "Fun Science Experiments & Demonstrations",
        "Career Guidance Workshops",
        "One-on-One Student Mentorship"
      ],
      responsibilities: [
        "Prepare simple, engaging lesson plans using TSF guidelines",
        "Conduct live sessions at assigned local schools",
        "Record student attendance and session metrics",
        "Submit activity reports immediately after each session",
        "Coordinate closely with local school staff and teachers"
      ],
      metrics: [
        { label: "Students Reached", value: "12,000+" },
        { label: "Schools Covered", value: "85+" },
        { label: "Volunteers Active", value: "450+" },
        { label: "Service Hours Logged", value: "9,000+" }
      ],
      skills: ["Communication", "Leadership", "Teaching", "Public Speaking", "Teamwork", "Problem Solving"],
      commitment: "2–6 hours/week · Flexible schedule",
      cta: "Apply as Classroom Volunteer"
    },
    "Computer & STEM labs": {
      title: "Computer & STEM Labs",
      tagline: "Fostering digital fluency and technological readiness.",
      icon: <Laptop className="w-8 h-8 text-brand" />,
      overview: "TSF installs computers and robotics lab kits inside rural schools. Volunteers teach children fundamental digital skills, programming concepts, robotics, and safety to prepare them for the modern digital economy.",
      activities: [
        "Teaching Computer Basics (Word, Excel, Paint)",
        "Introduction to Programming (Scratch, basic block-coding)",
        "AI Awareness & Digital Tools Workshops",
        "STEM Kit Assemblies and Robotics demonstrations",
        "Digital Citizenship and Internet Safety Guidelines",
        "Digital Art, Photo Editing, & Creative Thinking"
      ],
      responsibilities: [
        "Ensure digital labs are clean and correctly powered up",
        "Instruct students using structured STEM slides",
        "Help students assemble basic robotics prototypes",
        "Log student progress deliverables inside dashboard",
        "Report hardware maintenance needs to TSF admins"
      ],
      metrics: [
        { label: "Digital Students", value: "4,500+" },
        { label: "PCs Installed", value: "320+" },
        { label: "STEM Labs Supported", value: "32+" },
        { label: "Digital Hours Logged", value: "3,200+" }
      ],
      skills: ["Technology Literacy", "Coding & STEM", "Mentoring", "Presentation", "Innovation", "Troubleshooting"],
      commitment: "2–8 hours/week · Structured labs schedule",
      cta: "Join the STEM Programme"
    },
    "Plantation drives": {
      title: "Plantation Drives",
      tagline: "Hands in the soil, shade for tomorrow.",
      icon: <Sprout className="w-8 h-8 text-brand" />,
      overview: "ThinkSharp Foundation environmental drives focus on planting trees and maintaining green zones around rural schools. Volunteers lead sapling plantation, educate children on ecological preservation, and build clean campuses.",
      activities: [
        "Planting native shade and fruit-bearing saplings",
        "Constructing basic protective cages and watering structures",
        "Campus cleaning and waste separation drives",
        "Water conservation and harvesting workshops",
        "Environmental awareness campaigns and posters creation",
        "Conducting tree-care audits and growth logs"
      ],
      responsibilities: [
        "Organize local school community weekend plantation rallies",
        "Acquire and catalog native tree saplings",
        "Teach students about regional ecology and soil care",
        "Record trees planted and update counts in database",
        "Coordinate watering grids with local volunteer caretakers"
      ],
      metrics: [
        { label: "Trees Planted", value: "3,620+" },
        { label: "Green Campuses", value: "45+" },
        { label: "Eco Volunteers", value: "250+" },
        { label: "Outreach Hours Logged", value: "1,800+" }
      ],
      skills: ["Environmental Stewardship", "Project Planning", "Community Engagement", "Teamwork", "Physical Coordination"],
      commitment: "Weekend drives · 2–5 hours per drive",
      cta: "Become a Green Volunteer"
    }
  }[programme];

  // Helper timeline steps
  const steps = [
    { num: "01", name: "Apply" },
    { num: "02", name: "Review" },
    { num: "03", name: "Approval" },
    { num: "04", name: "TSF ID" },
    { num: "05", name: "Agreement" },
    { num: "06", name: "Start" },
    { num: "07", name: "Reports" },
    { num: "08", name: "Track" },
    { num: "09", name: "Certificate" }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-display">
      {/* Outer click handler */}
      <div className="absolute inset-0 cursor-default" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-white border border-border rounded-2xl shadow-2xl z-10 flex flex-col animate-fade-in text-left">
        
        {/* Header Hero Cover */}
        <div className="relative h-44 bg-gradient-to-br from-[#111] to-[#222] p-6 text-white border-b border-brand/20 flex flex-col justify-end">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/10 text-white hover:bg-white/20 p-2 rounded-xl transition-all shadow-xs ring-1 ring-white/10"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="p-2.5 bg-brand-light/95 border border-brand/20 rounded-xl shadow-lg shrink-0">
              {content.icon}
            </div>
            <div>
              <span className="text-[10px] font-black tracking-widest text-brand uppercase">ThinkSharp Programme Detail</span>
              <h2 className="text-xl md:text-2xl font-black text-white mt-1">{content.title}</h2>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 md:p-8 flex flex-col gap-6 overflow-y-auto">
          {/* Subtitle / Tagline */}
          <div>
            <p className="text-sm font-bold text-brand italic">“{content.tagline}”</p>
            <p className="text-xs text-ink font-semibold leading-relaxed mt-2.5 bg-paper/20 p-4 border border-border rounded-xl">
              {content.overview}
            </p>
          </div>

          {/* Impact stats grid */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-brand mb-3">📈 Dynamic Impact Metrics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {content.metrics.map((m, idx) => (
                <div key={idx} className="p-4 border border-border rounded-xl bg-paper/10 text-center hover:shadow-xs transition-shadow">
                  <span className="text-[10px] font-extrabold text-mist uppercase tracking-widest block">{m.label}</span>
                  <strong className="text-xl font-black text-brand mt-1.5 block tabular-nums">{m.value}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Activities vs Responsibilities */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-border p-5 rounded-2xl bg-white shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand mb-3 border-b border-border/60 pb-2">🎯 Typical Activities</h3>
              <ul className="flex flex-col gap-2 text-xs text-ink font-semibold">
                {content.activities.map((a, i) => (
                  <li key={i} className="flex items-start gap-1.5 leading-normal">
                    <span className="text-brand shrink-0">•</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-border p-5 rounded-2xl bg-white shadow-xs">
              <h3 className="text-xs font-black uppercase tracking-wider text-brand mb-3 border-b border-border/60 pb-2">📋 Core Responsibilities</h3>
              <ul className="flex flex-col gap-2 text-xs text-ink font-semibold font-display">
                {content.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5 leading-normal">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Skills & Commitment Section */}
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-brand mb-3">🎓 Volunteer Skills Developed</h3>
              <div className="flex flex-wrap gap-2">
                {content.skills.map((s) => (
                  <span key={s} className="px-2.5 py-1 text-[9px] font-extrabold bg-[#e9f7ef] text-[#167241] border border-[#167241]/20 rounded-full uppercase tracking-wider">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-brand mb-3">⏰ Expected Commitment</h3>
              <div className="p-3 border border-border rounded-xl bg-paper/20 flex items-center gap-2 text-xs text-ink font-semibold">
                <Calendar className="w-4 h-4 text-brand shrink-0" />
                <span>{content.commitment}</span>
              </div>
            </div>
          </div>

          {/* Reusable Volunteer Journey Timeline */}
          <div className="border-t border-border/65 pt-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand mb-4">🏆 How This Programme Works (Volunteer Lifecycle)</h3>
            <div className="overflow-x-auto pb-2 scrollbar-thin">
              <div className="flex items-center gap-2 min-w-[700px] py-1 font-display">
                {steps.map((st, i) => (
                  <div key={st.num} className="flex items-center gap-2">
                    <div className="flex items-center gap-2 p-2 border border-border rounded-xl bg-paper/10 text-xs font-semibold hover:border-brand/40 transition-colors">
                      <span className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                        {st.num}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-ink tracking-wide whitespace-nowrap">{st.name}</span>
                    </div>
                    {i < steps.length - 1 && (
                      <span className="text-mist/50 font-bold font-display select-none">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Call-to-action button */}
          <div className="border-t border-border/60 pt-6 flex justify-end">
            <Link
              href="/volunteer-apply"
              onClick={onClose}
              className="inline-flex h-11 items-center gap-2 bg-brand hover:bg-[#c31e21] px-6 text-xs font-bold uppercase tracking-wider text-white transition-colors rounded-xl shadow-lg shadow-brand/20"
            >
              {content.cta} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
