"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; icon: string };

const TABS: Tab[] = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/explore", label: "Explore", icon: "🧭" },
  { href: "/saved", label: "Saved", icon: "♡" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t-2 border-dashed border-[#1a1a1a]/15 bg-[#fff8ec]/95 backdrop-blur">
      <ul className="mx-auto flex w-full max-w-xl">
        {TABS.map((tab) => {
          const active =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
                  active ? "text-[#1a1a1a]" : "text-[#1a1a1a]/40"
                }`}
              >
                <span
                  className={`text-lg leading-none ${active ? "text-[#F5A623]" : ""}`}
                  aria-hidden
                >
                  {tab.icon}
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
