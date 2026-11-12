import Link from "next/link";
import { AdSlot } from "./AdSlot";
import { LogoMark } from "./Logo";
import { SITE_PROMISE } from "@/lib/site";
import { CATEGORIES } from "@/lib/tools";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto w-full max-w-[1040px] px-4 py-8 text-sm text-muted">
        <AdSlot position="footer" />
        <p className="flex items-center gap-2 text-text">
          <LogoMark size={18} />
          {SITE_PROMISE}
        </p>
        <nav aria-label="Footer" className="mt-3 grid gap-4 sm:grid-cols-2">
          <ul className="flex flex-wrap gap-x-4">
            <li>
              <Link href="/" className="inline-block py-1">
                All tools
              </Link>
            </li>
            {CATEGORIES.map((category) => (
              <li key={category.id}>
                <Link href={`/${category.id}`} className="inline-block py-1">
                  {category.h1}
                </Link>
              </li>
            ))}
          </ul>
          <ul className="flex flex-wrap gap-x-4 sm:justify-end">
            <li>
              <Link href="/about" className="inline-block py-1">
                About
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="inline-block py-1">
                Privacy
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
