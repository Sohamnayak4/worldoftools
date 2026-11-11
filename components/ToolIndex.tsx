"use client";

import Link from "next/link";
import { useState } from "react";

export type ToolIndexItem = {
  slug: string;
  name: string;
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
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const visible = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const haystack = `${item.name} ${item.keywords}`.toLowerCase();
        return words.every((word) => haystack.includes(word));
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div>
      <label htmlFor="tool-search" className="block text-sm text-muted">
        Search tools
      </label>
      <input
        id="tool-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="compress video, heic to jpg"
        autoComplete="off"
        className="mt-1 w-full rounded-ctl border border-line bg-surface px-3 py-2.5 text-base placeholder:text-muted"
      />
      {visible.length === 0 ? (
        <p className="mt-6 text-muted">
          No tools match that search. Try a shorter word.
        </p>
      ) : (
        visible.map((group) => (
          <section key={group.id} className="mt-8 border-t border-line pt-4">
            <h2 className="text-lg font-semibold">{group.label}</h2>
            <ul className="mt-2">
              {group.items.map((item) => (
                <li key={item.slug}>
                  <Link href={`/${item.slug}`} className="inline-block py-1.5">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
