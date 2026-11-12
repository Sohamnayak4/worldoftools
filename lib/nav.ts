import { CATEGORIES, tools } from "./tools";
import type { NavCategory, NavTool } from "./navMatch";

export type { NavCategory, NavTool } from "./navMatch";

// Plain data for the sidebar, the phone menu and the search dialog. Server
// only: client components get it as props and import from ./navMatch.
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
