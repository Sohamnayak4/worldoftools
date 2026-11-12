import type { Category } from "./tools";

// Types and search used by client components. This file must not import
// the registry itself, or every tool's page text ships in the browser bundle.
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

// Words that must all appear in a tool's name, blurb or keywords.
export function matchTools(list: NavTool[], query: string): NavTool[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return list;
  return list.filter((tool) => {
    const haystack = `${tool.name} ${tool.blurb} ${tool.keywords}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
