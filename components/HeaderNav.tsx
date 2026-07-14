"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

export function HeaderNav() {
  const pathname = usePathname();
  const { user, role, signOut, loading } = useAuth();
  const [memberStatus, setMemberStatus] = useState<string>("Active");

  useEffect(() => {
    if (user && role && role !== "admin") {
      import("@/lib/members").then(({ fetchCurrentMember }) => {
        fetchCurrentMember(user)
          .then((m) => {
            if (m) setMemberStatus(m.status);
          })
          .catch((e) => console.error("Error loading status in nav", e));
      });
    }
  }, [user, role]);

  if (loading) {
    return <div className="h-8 w-16 animate-pulse bg-paper" />;
  }

  // Determine which links to show based on auth state and role
  const links: { href: string; label: string }[] = [{ href: "/", label: "Home" }];

  if (!user) {
    links.push({ href: "/volunteer-apply", label: "Apply" });
  } else {
    // Logged in
    links.push({ href: "/dashboard", label: "Dashboard" });

    if (role === "admin") {
      links.push({ href: "/records", label: "Records" });
      links.push({ href: "/admin", label: "Admin" });
      links.push({ href: "/admin/applications", label: "Applications" });
      links.push({ href: "/admin/members", label: "Members" });
    } else {
      if (memberStatus === "Active") {
        links.push({ href: "/submit", label: "Submit Activity" });
      }
    }
  }

  return (
    <nav className="flex flex-wrap items-center gap-1 sm:gap-3">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-2 py-2 text-xs font-bold transition-colors sm:px-3 sm:text-sm ${
              isActive
                ? "text-brand"
                : "text-mist hover:text-ink"
            }`}
          >
            {link.label}
          </Link>
        );
      })}

      {user ? (
        <button
          onClick={signOut}
          className="rounded-none bg-paper border border-border hover:bg-brand-light/10 text-brand px-3 py-1.5 text-xs font-bold uppercase tracking-wider font-display transition-colors h-8"
        >
          Sign Out
        </button>
      ) : (
        <Link
          href="/login"
          className="rounded-none bg-brand hover:bg-ink text-white px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider font-display transition-colors h-8 flex items-center justify-center"
        >
          Sign In
        </Link>
      )}
    </nav>
  );
}
