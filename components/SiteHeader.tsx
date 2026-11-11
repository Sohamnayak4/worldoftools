import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { SITE_NAME } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex w-full max-w-[720px] items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="font-heading text-lg font-semibold no-underline"
        >
          {SITE_NAME}
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
