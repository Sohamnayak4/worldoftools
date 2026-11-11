import { ToolIndex, type ToolIndexGroup } from "@/components/ToolIndex";
import { SITE_PROMISE } from "@/lib/site";
import { CATEGORIES, tools } from "@/lib/tools";

export default function HomePage() {
  const groups: ToolIndexGroup[] = CATEGORIES.map((category) => ({
    id: category.id,
    label: category.label,
    items: tools
      .filter((tool) => tool.category === category.id)
      .map((tool) => ({
        slug: tool.slug,
        name: tool.h1,
        keywords: [tool.primaryKeyword, ...tool.secondaryKeywords].join(" "),
      })),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <h1 className="mt-8 text-2xl font-semibold sm:text-3xl">
        Free file tools that run in your browser
      </h1>
      <p className="mt-2 mb-6 text-muted">{SITE_PROMISE}</p>
      <ToolIndex groups={groups} />
    </>
  );
}
