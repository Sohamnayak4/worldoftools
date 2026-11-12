import Link from "next/link";
import { LogoMark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { SITE_NAME } from "@/lib/site";
import { CATEGORIES } from "@/lib/tools";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-[1040px] flex-wrap items-center gap-x-8 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 py-1 font-heading text-lg font-semibold tracking-tight no-underline"
        >
          <LogoMark />
          {SITE_NAME}
        </Link>
        <div className="ml-auto md:order-3">
          <ThemeToggle />
        </div>
        <nav aria-label="Tool categories" className="w-full md:w-auto">
          <ul className="flex flex-wrap gap-x-4 text-sm md:gap-x-5">
            {CATEGORIES.map((category) => (
              <li key={category.id}>
                <Link
                  href={`/${category.id}`}
                  className="inline-block py-1.5 text-muted no-underline hover:text-text"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
