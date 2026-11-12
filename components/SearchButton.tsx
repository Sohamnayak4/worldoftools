"use client";

import { Search } from "lucide-react";

export const OPEN_SEARCH_EVENT = "wot:open-search";

// Opens the tool search dialog. Shows the shortcut on wide screens.
export function SearchButton({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_SEARCH_EVENT))}
      className={`flex w-full items-center gap-2 rounded-ctl border border-line bg-bg px-3 py-2 text-left text-sm text-muted hover:text-text ${className}`}
    >
      <Search size={16} aria-hidden="true" />
      <span className="flex-1">Search tools</span>
      <kbd className="hidden font-sans text-xs sm:inline">Ctrl K</kbd>
    </button>
  );
}
