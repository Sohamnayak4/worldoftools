"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// Hides its content on the homepage, which shows the same thing in a
// bigger place.
export function HideOnHome({ children }: { children: ReactNode }) {
  return usePathname() === "/" ? null : <>{children}</>;
}
