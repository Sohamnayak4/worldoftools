import { ogContentType, ogSize, renderOgImage } from "@/lib/og";
import { tools } from "@/lib/tools";

export const size = ogSize;
export const contentType = ogContentType;
export const alt = "worldof.tools: free file tools that run in your browser";

export default async function Image() {
  return renderOgImage({
    title: "Free file tools that run in your browser",
    line: `${tools.length} tools for video, audio, images, PDFs and text. No account.`,
  });
}
