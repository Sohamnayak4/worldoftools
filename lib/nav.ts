import { CATEGORIES, type Category, tools } from "./tools";

// Plain data for the sidebar, the phone menu and the search dialog. Kept
// serializable so client components can receive it as props.
export type NavTool = {
  slug: string;
  name: string;
  blurb: string;
  category: Category;
  keywords: string;
};

export type NavCategory = {
  id: Category;
  label: string;
  tools: NavTool[];
};

export const navTools: NavTool[] = tools.map((tool) => ({
  slug: tool.slug,
  name: tool.h1,
  blurb: tool.blurb,
  category: tool.category,
  keywords: [tool.primaryKeyword, ...tool.secondaryKeywords].join(" "),
}));

export const navCategories: NavCategory[] = CATEGORIES.map((category) => ({
  id: category.id,
  label: category.label,
  tools: navTools.filter((tool) => tool.category === category.id),
})).filter((category) => category.tools.length > 0);

// Words that must all appear in a tool's name, blurb or keywords.
export function matchTools(list: NavTool[], query: string): NavTool[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return list;
  return list.filter((tool) => {
    const haystack = `${tool.name} ${tool.blurb} ${tool.keywords}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
