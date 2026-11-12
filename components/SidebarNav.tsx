"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import type { NavCategory } from "@/lib/navMatch";

// Every category with its tools. The current tool is marked, and its
// category is open. Icons arrive as rendered elements from the server.
export function SidebarNav({
  categories,
  icons,
  onNavigate,
}: {
  categories: NavCategory[];
  icons: Record<string, ReactNode>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const current = pathname.replace(/^\//, "");
  return (
    <nav aria-label="Tools">
      <p className="px-2 text-xs text-muted">Tools</p>
      <ul className="mt-1">
        {categories.map((category) => {
          const open =
            current === category.id ||
            category.tools.some((tool) => tool.slug === current);
          return (
            <li key={category.id}>
              <details open={open} className="group">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-ctl px-2 py-1.5 text-sm hover:text-accent-ink [&::-webkit-details-marker]:hidden">
                  <span className="text-muted">{icons[`category:${category.id}`]}</span>
                  <span className="flex-1">{category.label}</span>
                  <span className="text-xs text-muted">{category.tools.length}</span>
                  <ChevronRight
                    size={14}
                    aria-hidden="true"
                    className="text-muted group-open:rotate-90"
                  />
                </summary>
                <ul className="mb-1 ml-3 border-l border-line pl-2">
                  <li>
                    <Link
                      href={`/${category.id}`}
                      onClick={onNavigate}
                      aria-current={current === category.id ? "page" : undefined}
                      className="block rounded-ctl px-2 py-1 text-sm text-muted no-underline hover:text-text aria-[current=page]:bg-surface aria-[current=page]:text-text"
                    >
                      All {category.label.toLowerCase()} tools
                    </Link>
                  </li>
                  {category.tools.map((tool) => (
                    <li key={tool.slug}>
                      <Link
                        href={`/${tool.slug}`}
                        onClick={onNavigate}
                        aria-current={current === tool.slug ? "page" : undefined}
                        className="flex items-center gap-2 rounded-ctl px-2 py-1 text-sm text-muted no-underline hover:text-text aria-[current=page]:bg-surface aria-[current=page]:text-text"
                      >
                        <span className="shrink-0">{icons[tool.slug]}</span>
                        <span className="truncate">{tool.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
