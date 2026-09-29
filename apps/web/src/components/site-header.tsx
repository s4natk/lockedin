"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const links = [
  ["/tasks", "Tasks"],
  ["/focus", "Focus"],
  ["/dashboard", "Dashboard"],
  ["/analytics", "Analytics"],
  ["/history", "History"],
  ["/achievements", "Achievements"],
  ["/environments", "Environments"],
] as const;

export function SiteHeader({
  children,
  showNav = true,
  wordmarkClass = "text-zinc-500",
  linkClass = "text-zinc-500",
}: {
  children?: ReactNode;
  showNav?: boolean;
  wordmarkClass?: string;
  linkClass?: string;
}) {
  const pathname = usePathname();

  return (
    <header className="flex flex-col gap-5 border-b border-white/10 pb-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className={`font-mono text-xs tracking-[0.28em] ${wordmarkClass}`}>
          LOCKEDIN
        </Link>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/s4natk/lockedin"
            target="_blank"
            rel="noreferrer"
            className={`text-sm ${linkClass}`}
          >
            GitHub
          </a>
          {children}
        </div>
      </div>
      {showNav ? (
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              className={`text-sm ${pathname === href ? "text-zinc-100" : linkClass}`}
            >
              {label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
