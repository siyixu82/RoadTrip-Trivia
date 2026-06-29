"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; icon: (active: boolean) => React.ReactNode };

const HomeIcon = (active: boolean) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      fill={active ? "currentColor" : "none"}
      fillOpacity={active ? 0.15 : 0}
    />
  </svg>
);

const ExploreIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
    <path
      d="m15.5 8.5-1.8 5-5 1.8 1.8-5z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.2"
    />
  </svg>
);

const SavedIcon = (active: boolean) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
    <path
      d="M12 20s-7-4.35-7-9.5A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7 3.5C19 15.65 12 20 12 20z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      fill={active ? "currentColor" : "none"}
    />
  </svg>
);

const TABS: Tab[] = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/explore", label: "Explore", icon: ExploreIcon },
  { href: "/saved", label: "Saved", icon: SavedIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-[#1a1a1a]/10 bg-white/95 backdrop-blur">
      <ul className="mx-auto flex w-full max-w-xl">
        {TABS.map((tab) => {
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 transition-colors ${
                  active ? "text-[#F5A623]" : "text-[#1a1a1a]/35"
                }`}
              >
                {tab.icon(active)}
                <span className="font-mono text-[10px] font-bold uppercase tracking-wide">
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
