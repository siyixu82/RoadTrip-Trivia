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
    <div className={`flex min-h-full flex-1 flex-col ${showNav ? "pb-16" : ""}`}>
      {children}
      {showNav && <BottomNav />}
    </div>
  );
}
