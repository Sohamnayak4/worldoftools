import Link from "next/link";
import { AdSlot } from "./AdSlot";
import { LogoMark } from "./Logo";
import { SITE_PROMISE } from "@/lib/site";
import { CATEGORIES } from "@/lib/tools";

export function SiteFooter() {
  return (
    <footer className="border-t border-line px-4 py-8 text-sm text-muted sm:px-6 lg:px-10">
      <AdSlot position="footer" />
      <div className="mx-auto max-w-[1120px]">
        <p className="flex items-center gap-2 text-text">
          <LogoMark size={18} />
          {SITE_PROMISE}
        </p>
        <nav aria-label="Footer" className="mt-3 flex flex-wrap justify-between gap-4">
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
          <ul className="flex flex-wrap gap-x-4">
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
            <li>
              <Link href="/advertise" className="inline-block py-1">
                Advertise
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
