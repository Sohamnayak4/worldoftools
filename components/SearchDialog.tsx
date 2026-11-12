"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { OPEN_SEARCH_EVENT } from "./SearchButton";
import { type NavTool, matchTools } from "@/lib/navMatch";

// Site-wide tool search. Opens with Ctrl K or Cmd K, or the search buttons.
export function SearchDialog({
  tools,
  icons,
}: {
  tools: NavTool[];
  icons: Record<string, ReactNode>;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listId = useId();
  const results = matchTools(tools, query).slice(0, 12);

  function open() {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    setQuery("");
    setActive(0);
    dialog.showModal();
    inputRef.current?.focus();
  }

  function go(slug: string) {
    dialogRef.current?.close();
    router.push(`/${slug}`);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        open();
      }
    }
    document.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SEARCH_EVENT, open);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SEARCH_EVENT, open);
    };
  });

  return (
    <dialog
      ref={dialogRef}
      aria-label="Search tools"
      onClick={(event) => {
        // A click on the backdrop closes the dialog.
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="m-0 mx-auto mt-[12vh] w-[min(560px,calc(100%-2rem))] rounded-ctl border border-line bg-surface p-0 text-text backdrop:bg-black/60"
    >
      <div className="border-b border-line p-2">
        <input
          ref={inputRef}
          type="search"
          value={query}
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results[active] ? `${listId}-${results[active].slug}` : undefined}
          aria-label="Search tools"
          placeholder="Search tools"
          autoComplete="off"
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive((index) => Math.min(index + 1, results.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter" && results[active]) {
              event.preventDefault();
              go(results[active].slug);
            }
          }}
          className="w-full rounded-ctl bg-bg px-3 py-2.5 text-base placeholder:text-muted"
        />
      </div>
      <ul id={listId} role="listbox" aria-label="Tools" className="max-h-[50vh] overflow-y-auto p-1">
        {results.length === 0 ? (
          <li className="px-3 py-4 text-sm text-muted">No tools match. Try a shorter word.</li>
        ) : (
          results.map((tool, index) => (
            <li
              key={tool.slug}
              id={`${listId}-${tool.slug}`}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onClick={() => go(tool.slug)}
              className="flex cursor-pointer items-center gap-3 rounded-ctl px-3 py-2 aria-selected:bg-bg"
            >
              <span className="text-muted">{icons[tool.slug]}</span>
              <span className="min-w-0">
                <span className="block truncate text-sm">{tool.name}</span>
                <span className="block truncate text-xs text-muted">{tool.blurb}</span>
              </span>
            </li>
          ))
        )}
      </ul>
    </dialog>
  );
}
