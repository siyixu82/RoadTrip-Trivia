"use client";

import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";

/**
 * App shell: renders the three-tab bottom nav on the main screens and hides it
 * on the Quiz route (which takes over the full screen while playing). Adds
 * bottom padding so content clears the fixed nav.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showNav = !pathname.startsWith("/quiz");

  return (
    <div className="flex min-h-full flex-1 justify-center">
      {/* Cream app column on the warm-gray page canvas — soft shadow + faint
          side border separate it from the background on wide viewports. */}
      <div
        className={`relative flex w-full max-w-xl flex-col border-x border-black/5 bg-[#FFF8EC] shadow-[0_0_60px_rgba(0,0,0,0.08)] ${
          showNav ? "pb-16" : ""
        }`}
      >
        {children}
        {showNav && <BottomNav />}
      </div>
    </div>
  );
}
