"use client";

export function Footer() {
  return (
    <footer className="no-print border-t border-[#E5E7EB] bg-white py-5 text-center font-display text-[11px] md:text-xs text-[#6B7280]">
      <div className="mx-auto max-w-7xl px-4 flex flex-col gap-1.5 justify-center items-center">
        <p className="font-semibold tracking-wide">
          © 2026 ThinkSharp Foundation Impact Tool
        </p>
        <p className="font-medium">
          Developed & Designed by{" "}
          <span className="font-bold text-ink">Lubdhak Mandal</span> •{" "}
          <a
            href="https://www.linkedin.com/in/lubdhak-mandal-15972925b"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#EF2B2D] font-black hover:underline transition-all"
          >
            LinkedIn
          </a>
        </p>
        <span className="text-[9px] font-bold text-mist/60 uppercase tracking-widest mt-0.5">
          Version 1.0
        </span>
      </div>
    </footer>
  );
}
