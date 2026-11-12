import { absoluteUrl } from "@/lib/seo";
import { SITE_NAME, SITE_PROMISE } from "@/lib/site";
import { CATEGORIES, toolsIn } from "@/lib/tools";

// llms.txt: a plain list of every tool for AI assistants, built from the
// registry. See https://llmstxt.org
export const dynamic = "force-static";

export function GET() {
  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    `> Free file tools that run in the browser: compress, convert and edit video, audio, images, PDFs and text. ${SITE_PROMISE} No account, no upload, no watermark.`,
    "",
    "Every tool processes files on the visitor's own device with browser APIs (WebCodecs, canvas, PDF.js). Pages that name a platform limit link to the official source and the date it was checked.",
    "",
  ];
  for (const category of CATEGORIES) {
    const list = toolsIn(category.id);
    if (list.length === 0) continue;
    lines.push(`## ${category.h1}`, "");
    for (const tool of list) {
      lines.push(`- [${tool.h1}](${absoluteUrl(`/${tool.slug}`)}): ${tool.metaDescription}`);
    }
    lines.push("");
  }
  lines.push(
    "## Optional",
    "",
    `- [About](${absoluteUrl("/about")}): how the tools work and the open source code they use`,
    `- [Privacy](${absoluteUrl("/privacy")}): what runs in the browser, analytics and cookies`,
    "",
  );
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
