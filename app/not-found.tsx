import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES, toolsIn } from "@/lib/tools";

export const metadata: Metadata = {
  title: "Page not found",
};

// Shown for any address that is not a tool, category or site page.
export default function NotFound() {
  return (
    <div className="mx-auto max-w-[880px]">
      <h1 className="text-3xl font-semibold sm:text-4xl">Page not found</h1>
      <p className="mt-3 max-w-[65ch]">
        There is no page at this address. The link may be old or mistyped.
        Every tool is listed on the <Link href="/">tool index</Link>, or pick a
        group below.
      </p>
      <ul className="mt-8 grid gap-x-8 sm:grid-cols-2">
        {CATEGORIES.map((category) => (
          <li key={category.id} className="border-b border-line py-2.5">
            <Link href={`/${category.id}`} className="font-medium">
              {category.h1}
            </Link>
            <span className="ml-2 text-sm text-muted">
              {toolsIn(category.id).length} tools
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-8">
        <Link href="/">See all tools</Link>
      </p>
    </div>
  );
}
