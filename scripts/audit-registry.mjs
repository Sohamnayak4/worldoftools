// Audits the tool registry for the SEO rules in CLAUDE.md.
// Run with: npm run audit
import { tools } from "../.audit/tools.js";

const problems = [];
const notes = [];
const problem = (slug, text) => problems.push(`${slug}: ${text}`);

const norm = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const squash = (text) => norm(text).replace(/ /g, "");
const slugs = new Set(tools.map((tool) => tool.slug));

// 1. One primary keyword per page, never shared.
const byKeyword = new Map();
for (const tool of tools) {
  const key = norm(tool.primaryKeyword);
  byKeyword.set(key, [...(byKeyword.get(key) ?? []), tool.slug]);
}
for (const [key, list] of byKeyword) {
  if (list.length > 1) problems.push(`Primary keyword "${key}" is shared by ${list.join(", ")}`);
}

// 2. Unique titles and descriptions.
for (const field of ["title", "metaDescription", "h1"]) {
  const seen = new Map();
  for (const tool of tools) {
    const key = norm(tool[field]);
    if (seen.has(key)) problems.push(`Same ${field} on ${seen.get(key)} and ${tool.slug}`);
    seen.set(key, tool.slug);
  }
}

for (const tool of tools) {
  const keyword = squash(tool.primaryKeyword);
  // 3. Slug, title and h1 contain the primary keyword. Words may be joined
  // or split differently ("20kb" and "20KB"), so letters are compared.
  if (!squash(tool.title).includes(keyword)) problem(tool.slug, `title lacks "${tool.primaryKeyword}"`);
  if (!squash(tool.h1).includes(keyword)) notes.push(`${tool.slug}: h1 "${tool.h1}" does not contain "${tool.primaryKeyword}" word for word`);
  const slugWords = tool.slug.split("-");
  const missingInSlug = norm(tool.primaryKeyword).split(" ").filter((word) => !slugWords.includes(word) && !["online", "to", "for", "from"].includes(word));
  if (missingInSlug.length > 0) notes.push(`${tool.slug}: slug lacks keyword words ${missingInSlug.join(", ")}`);

  // 4. Lengths.
  if (tool.title.length > 60) problem(tool.slug, `title is ${tool.title.length} characters, over 60`);
  if (tool.metaDescription.length > 160) problem(tool.slug, `description is ${tool.metaDescription.length} characters, over 160`);
  if (tool.metaDescription.length < 70) problem(tool.slug, `description is only ${tool.metaDescription.length} characters`);

  // 5. Content counts.
  if (tool.faqs.length < 3) problem(tool.slug, `only ${tool.faqs.length} FAQs`);
  const related = tool.relatedSlugs.filter((slug) => slugs.has(slug) && slug !== tool.slug);
  if (related.length < 3) problem(tool.slug, `only ${related.length} working related tools`);
  for (const slug of tool.relatedSlugs) {
    if (!slugs.has(slug)) problem(tool.slug, `related slug "${slug}" does not exist`);
    if (slug === tool.slug) problem(tool.slug, "lists itself as related");
  }
  if (tool.howItWorks.length < 3 || tool.howItWorks.length > 5) {
    problem(tool.slug, `${tool.howItWorks.length} how-it-works steps, needs 3 to 5`);
  }
  if (!tool.blurb || tool.blurb.length > 56) problem(tool.slug, "blurb missing or over 56 characters");

  // 6. Secondary keywords should appear in the page text.
  const body = norm(
    [tool.shortAnswer, ...tool.howItWorks, ...tool.facts.map((fact) => `${fact.label} ${fact.value}`), ...tool.faqs.flatMap((faq) => [faq.q, faq.a])].join(" "),
  );
  const missing = tool.secondaryKeywords.filter((keyword) => !body.includes(norm(keyword)));
  if (missing.length === tool.secondaryKeywords.length) {
    notes.push(`${tool.slug}: none of its secondary keywords appear word for word in the page text`);
  }

  // 7. Plain text rules.
  const all = JSON.stringify(tool);
  if (/[–—]/.test(all)) problem(tool.slug, "contains an en or em dash");
  if (/!/.test(tool.shortAnswer + tool.howItWorks.join(" ") + tool.faqs.map((faq) => faq.a).join(" "))) problem(tool.slug, "contains an exclamation mark");
}

// 8. No two pages share body text. Compares every sentence of the short
// answer, steps and FAQ answers across pages.
const sentences = new Map();
for (const tool of tools) {
  const parts = [tool.shortAnswer, ...tool.howItWorks, ...tool.faqs.map((faq) => faq.a)];
  for (const part of parts) {
    for (const sentence of part.split(/(?<=[.?])\s+/)) {
      const key = norm(sentence);
      if (key.split(" ").length < 6) continue;
      const owners = sentences.get(key) ?? new Set();
      owners.add(tool.slug);
      sentences.set(key, owners);
    }
  }
}
for (const [sentence, owners] of sentences) {
  if (owners.size > 1) problems.push(`Shared sentence on ${[...owners].join(", ")}: "${sentence}"`);
}

// 9. Variant pages differ in preset and facts, not just the number.
const groups = [
  tools.filter((tool) => tool.slug.startsWith("compress-image-to-")),
  tools.filter((tool) => tool.slug.startsWith("compress-video-for-")),
];
for (const group of groups) {
  for (let i = 0; i < group.length; i++) {
    for (let j = i + 1; j < group.length; j++) {
      const a = group[i];
      const b = group[j];
      if (JSON.stringify(a.preset) === JSON.stringify(b.preset)) problem(`${a.slug} and ${b.slug}`, "same preset");
      const factsA = new Set(a.facts.map((fact) => fact.value));
      const unique = b.facts.filter((fact) => !factsA.has(fact.value)).length;
      if (unique < 2) problem(`${a.slug} and ${b.slug}`, `only ${unique} different facts`);
    }
  }
}

console.log(`Tools checked: ${tools.length}`);
console.log(`FAQs: ${tools.reduce((sum, tool) => sum + tool.faqs.length, 0)}, related links: ${tools.reduce((sum, tool) => sum + tool.relatedSlugs.length, 0)}`);
console.log(`\nProblems (${problems.length}):`);
for (const line of problems) console.log(`- ${line}`);
console.log(`\nNotes (${notes.length}):`);
for (const line of notes) console.log(`- ${line}`);
process.exitCode = problems.length > 0 ? 1 : 0;
