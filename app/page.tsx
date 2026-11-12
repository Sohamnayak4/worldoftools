import Link from "next/link";
import type { ReactNode } from "react";
import { AdSlot } from "@/components/AdSlot";
import { ToolIndex } from "@/components/ToolIndex";
import { CategoryIcon, ToolIcon } from "@/components/ToolIcon";
import { navCategories, navTools } from "@/lib/nav";
import { getTool, tools } from "@/lib/tools";

// Featured tiles at the top. Change freely: each is a slug.
const START_WITH = [
  "compress-video-for-discord",
  "compress-image-to-50kb",
  "heic-to-jpg",
  "merge-pdf",
  "compress-video-to-size",
  "mp4-to-mp3",
  "resize-photo-and-signature",
  "qr-code-generator",
];

export default function HomePage() {
  const icons: Record<string, ReactNode> = {};
  for (const tool of navTools) icons[tool.slug] = <ToolIcon slug={tool.slug} size={16} />;
  for (const category of navCategories) {
    icons[`category:${category.id}`] = <CategoryIcon id={category.id} size={18} />;
  }
  const featured = START_WITH.map((slug) => getTool(slug)).filter(
    (tool) => tool !== undefined,
  );

  const startWith = (
    <section aria-labelledby="start-with" className="mt-8">
      <h2 id="start-with" className="text-sm font-normal text-muted">
        Start with
      </h2>
      <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
        {featured.map((tool) => (
          <li key={tool.slug}>
            <Link
              href={`/${tool.slug}`}
              className="group flex h-full flex-col rounded-ctl border border-line bg-surface p-4 no-underline hover:border-accent-ink"
            >
              <span className="text-accent-ink">
                <ToolIcon slug={tool.slug} size={22} />
              </span>
              <span className="mt-6 font-semibold leading-snug">{tool.h1}</span>
              <span className="mt-1 hidden text-sm text-muted sm:block">{tool.blurb}</span>
            </Link>
          </li>
        ))}
      </ul>
      <AdSlot position="featured" reservedHeight={88} />
    </section>
  );

  return (
    <div className="mx-auto max-w-[1120px]">
      <h1 className="mt-10 max-w-[760px] text-4xl font-semibold leading-[1.05] sm:text-5xl lg:mt-14">
        Free file tools that run in your browser
      </h1>
      <p className="mt-4 mb-8 max-w-[640px] text-lg text-muted">
        Compress, convert and edit video, audio, images and PDFs. {tools.length}{" "}
        tools, no account, and your files never leave your device.
      </p>
      <ToolIndex categories={navCategories} icons={icons} featured={startWith} />
    </div>
  );
}
