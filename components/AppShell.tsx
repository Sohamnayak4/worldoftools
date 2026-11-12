import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { SearchButton } from "./SearchButton";
import { SearchDialog } from "./SearchDialog";
import { SidebarNav } from "./SidebarNav";
import { AdDialog } from "./AdDialog";
import { AdSlots } from "./AdSlots";
import { HideOnHome } from "./HideOnHome";
import { ThemeToggle } from "./ThemeToggle";
import { CategoryIcon, ToolIcon } from "./ToolIcon";
import { MAX_SPONSORS } from "@/lib/ads";
import { navCategories, navTools } from "@/lib/nav";
import { getSponsors } from "@/lib/sponsors";
import { SITE_NAME } from "@/lib/site";

function Brand() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight no-underline"
    >
      <LogoMark />
      {SITE_NAME}
    </Link>
  );
}

const footerLinks = (
  <ul className="space-y-1 text-sm">
    <li>
      <Link href="/about" className="text-muted no-underline hover:text-text">
        About
      </Link>
    </li>
    <li>
      <Link href="/privacy" className="text-muted no-underline hover:text-text">
        Privacy
      </Link>
    </li>
    <li>
      <Link href="/advertise" className="text-muted no-underline hover:text-text">
        Advertise
      </Link>
    </li>
  </ul>
);

// The frame around every page: a sidebar on wide screens, a top bar with a
// menu on phones, and one search dialog for the whole site.
export async function AppShell({ children }: { children: ReactNode }) {
  const icons: Record<string, ReactNode> = {};
  for (const tool of navTools) icons[tool.slug] = <ToolIcon slug={tool.slug} size={15} />;
  for (const category of navCategories) {
    icons[`category:${category.id}`] = <CategoryIcon id={category.id} size={16} />;
  }

  return (
    <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line lg:flex">
        <div className="px-4 pt-4 pb-3">
          <Brand />
          <SearchButton className="mt-4" />
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          <SidebarNav categories={navCategories} icons={icons} />
          <HideOnHome>
            <div className="mt-5 px-2">
              <AdSlots compact />
            </div>
          </HideOnHome>
        </div>
        <div className="border-t border-line px-4 py-3">{footerLinks}</div>
      </aside>

      <div className="flex min-h-dvh min-w-0 flex-col">
        <header className="sticky top-0 z-20 border-b border-line bg-bg">
          <div className="flex items-center gap-3 px-4 py-2.5 lg:justify-end lg:px-8">
            <div className="lg:hidden">
              <MobileMenu categories={navCategories} icons={icons} footer={footerLinks} />
            </div>
            <div className="flex-1 lg:hidden">
              <Brand />
            </div>
            <ThemeToggle />
          </div>
        </header>
        {children}
      </div>

      <SearchDialog tools={navTools} icons={icons} />
      <AdDialog placesLeft={MAX_SPONSORS - (await getSponsors()).length} />
    </div>
  );
}
