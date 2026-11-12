"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { type NavCategory, matchTools } from "@/lib/nav";

// The homepage tool list with a search box. The full list is in the
// server-rendered HTML. Typing only hides rows that do not match.
export function ToolIndex({
  categories,
  icons,
  featured,
  intro,
  aside,
}: {
  categories: NavCategory[];
  icons: Record<string, ReactNode>;
  // Shown between the search box and the list while nothing is typed.
  featured?: ReactNode;
  // Headline and line shown above the search box.
  intro?: ReactNode;
  // Shown beside the headline and search on wide screens, below on phones.
  aside?: ReactNode;
}) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const visible = categories
    .map((category) => ({ ...category, tools: matchTools(category.tools, query) }))
    .filter((category) => category.tools.length > 0);
  const count = visible.reduce((sum, category) => sum + category.tools.length, 0);
  const searching = query.trim() !== "";

  // Press / anywhere to jump to the search box.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, dialog, [contenteditable=true]")) return;
      event.preventDefault();
      searchRef.current?.focus();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] lg:items-stretch">
        <div className="flex flex-col">
          {intro}
          <div className="mt-auto max-w-[640px] pt-8">
            <div className="relative">
              <label htmlFor="tool-search" className="sr-only">
                Search tools
              </label>
              <Search
                size={20}
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted"
              />
              <input
                ref={searchRef}
                id="tool-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tools, like discord or heic"
                autoComplete="off"
                className="w-full rounded-ctl border border-line bg-surface py-3.5 pr-14 pl-12 text-lg placeholder:text-muted"
              />
              <kbd className="pointer-events-none absolute top-1/2 right-4 hidden -translate-y-1/2 font-sans text-sm text-muted sm:block">
                /
              </kbd>
            </div>
          </div>
        </div>
        {aside}
      </div>
      <p role="status" className="mt-2 min-h-5 text-sm text-muted">
        {!searching ? "" : count === 0 ? "No tools match that search. Try a shorter word." : `${count} ${count === 1 ? "tool" : "tools"} match.`}
      </p>

      {!searching && featured}

      <div className="mt-6 gap-x-10 md:columns-2 xl:columns-3">
        {visible.map((category) => (
          <section key={category.id} className="break-inside-avoid pb-8">
            <h2 className="flex items-center gap-2 border-b border-line pb-2 text-base font-semibold">
              <span className="text-accent-ink">{icons[`category:${category.id}`]}</span>
              <Link href={`/${category.id}`} className="no-underline hover:text-accent-ink">
                {category.label}
              </Link>
              <span className="text-sm font-normal text-muted">{category.tools.length}</span>
            </h2>
            <ul className="mt-1">
              {category.tools.map((tool) => (
                <li key={tool.slug}>
                  <Link href={`/${tool.slug}`} className="group flex gap-3 py-2.5 no-underline">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-ctl border border-line text-muted group-hover:text-accent-ink">
                      {icons[tool.slug]}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium group-hover:text-accent-ink">{tool.name}</span>
                      <span className="mt-0.5 block text-sm text-muted">{tool.blurb}</span>
                    </span>
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
