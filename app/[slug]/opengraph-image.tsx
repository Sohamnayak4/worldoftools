import { ogContentType, ogSize, renderOgImage } from "@/lib/og";
import { CATEGORIES, getCategory, getTool, tools } from "@/lib/tools";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "worldof.tools";

export function generateStaticParams() {
  return [
    ...tools.map((tool) => ({ slug: tool.slug })),
    ...CATEGORIES.map((category) => ({ slug: category.id })),
  ];
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (category) {
    return renderOgImage({
      eyebrow: "Category",
      title: category.h1,
      line: category.metaDescription.split(". ")[0],
    });
  }
  const tool = getTool(slug);
  return renderOgImage({
    eyebrow: tool ? getCategory(tool.category)?.label : undefined,
    title: tool?.h1 ?? "Free file tools",
    line: tool?.blurb ?? "Free file tools that run in your browser",
  });
}
