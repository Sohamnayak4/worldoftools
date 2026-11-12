"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { SearchButton } from "./SearchButton";
import { SidebarNav } from "./SidebarNav";
import type { NavCategory } from "@/lib/navMatch";

// The sidebar for phones, opened from a menu button.
export function MobileMenu({
  categories,
  icons,
  footer,
}: {
  categories: NavCategory[];
  icons: Record<string, ReactNode>;
  footer: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Open menu"
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-ctl border border-line text-muted hover:text-text"
      >
        <Menu size={18} aria-hidden="true" />
      </button>
      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-bg"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <span className="font-heading font-semibold">Menu</span>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
              className="flex h-9 w-9 items-center justify-center rounded-ctl border border-line text-muted hover:text-text"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
          <div className="px-4 py-3" onClick={() => setOpen(false)}>
            <SearchButton />
          </div>
          <div className="flex-1 px-2">
            <SidebarNav categories={categories} icons={icons} onNavigate={() => setOpen(false)} />
          </div>
          <div className="border-t border-line px-4 py-3">{footer}</div>
        </div>
      )}
    </>
  );
}
