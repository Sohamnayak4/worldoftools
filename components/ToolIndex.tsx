"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type ToolIndexItem = {
  slug: string;
  name: string;
  blurb: string;
  keywords: string;
};

export type ToolIndexGroup = {
  id: string;
  label: string;
  items: ToolIndexItem[];
};

// The homepage tool list with a search box. The full list is in the
// server-rendered HTML. Typing only hides rows that do not match.
export function ToolIndex({ groups }: { groups: ToolIndexGroup[] }) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const visible = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const haystack = `${item.name} ${item.blurb} ${item.keywords}`.toLowerCase();
        return words.every((word) => haystack.includes(word));
      }),
    }))
    .filter((group) => group.items.length > 0);
  const count = visible.reduce((sum, group) => sum + group.items.length, 0);

  // Press / anywhere to jump to the search box.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div>
      <div className="max-w-[720px]">
        <label htmlFor="tool-search" className="flex items-baseline justify-between text-sm text-muted">
          <span>Search tools</span>
          <span className="hidden sm:inline">Press / to search</span>
        </label>
        <input
          ref={searchRef}
          id="tool-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="compress video for discord, heic to jpg, merge pdf"
          autoComplete="off"
          className="mt-1 w-full rounded-ctl border border-line bg-surface px-4 py-3 text-lg placeholder:text-muted"
        />
        <p role="status" className="mt-2 min-h-5 text-sm text-muted">
          {query.trim() === "" ? "" : count === 0 ? "No tools match that search. Try a shorter word." : `${count} ${count === 1 ? "tool" : "tools"} match.`}
        </p>
      </div>

      <div className="mt-4 gap-x-10 md:columns-2 lg:columns-3">
        {visible.map((group) => (
          <section key={group.id} className="break-inside-avoid border-t border-line pt-4 pb-6">
            <h2 className="text-lg font-semibold">
              <Link href={`/${group.id}`} className="no-underline hover:text-accent-ink">
                {group.label}
              </Link>
              <span className="ml-2 text-sm font-normal text-muted">
                {group.items.length}
              </span>
            </h2>
            <ul className="mt-2">
              {group.items.map((item) => (
                <li key={item.slug}>
                  <Link href={`/${item.slug}`} className="group block py-2 no-underline">
                    <span className="font-medium underline decoration-line underline-offset-[3px] group-hover:text-accent-ink">
                      {item.name}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">{item.blurb}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
