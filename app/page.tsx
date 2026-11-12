import Link from "next/link";
import { ToolIndex, type ToolIndexGroup } from "@/components/ToolIndex";
import { SITE_PROMISE } from "@/lib/site";
import { CATEGORIES, getTool, tools } from "@/lib/tools";

// Shortcuts to the jobs people come for most. Change freely: each is a slug.
const COMMON_JOBS = [
  "compress-video-for-discord",
  "compress-image-to-50kb",
  "heic-to-jpg",
  "merge-pdf",
  "mp4-to-mp3",
  "qr-code-generator",
];

export default function HomePage() {
  const groups: ToolIndexGroup[] = CATEGORIES.map((category) => ({
    id: category.id,
    label: category.label,
    items: tools
      .filter((tool) => tool.category === category.id)
      .map((tool) => ({
        slug: tool.slug,
        name: tool.h1,
        blurb: tool.blurb,
        keywords: [tool.primaryKeyword, ...tool.secondaryKeywords].join(" "),
      })),
  })).filter((group) => group.items.length > 0);

  const common = COMMON_JOBS.map((slug) => getTool(slug)).filter(
    (tool) => tool !== undefined,
  );

  return (
    <>
      <h1 className="mt-10 max-w-[720px] text-3xl font-semibold sm:text-4xl">
        Free file tools that run in your browser
      </h1>
      <p className="mt-3 max-w-[720px] text-muted">
        {tools.length} tools for video, audio, images, PDFs and text.{" "}
        {SITE_PROMISE} No account needed.
      </p>

      <nav aria-label="Common jobs" className="mt-6 max-w-[720px]">
        <p className="text-sm text-muted">Common jobs</p>
        <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
          {common.map((tool) => (
            <li key={tool.slug}>
              <Link href={`/${tool.slug}`} className="inline-block py-1">
                {tool.h1}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8">
        <ToolIndex groups={groups} />
      </div>
    </>
  );
}
