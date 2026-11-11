import Link from "next/link";
import { AdSlot } from "./AdSlot";
import { SITE_PROMISE } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto w-full max-w-[720px] px-4 py-6 text-sm text-muted">
        <AdSlot position="footer" />
        <p>{SITE_PROMISE}</p>
        <p className="mt-2">
          <Link href="/">All tools</Link>
        </p>
      </div>
    </footer>
  );
}
