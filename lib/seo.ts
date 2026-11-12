import type { Metadata } from "next";
import { SITE_NAME, SITE_URL } from "./site";

// Title, description, canonical URL and social cards for one page. Every
// page calls this, so each gets its own Open Graph and Twitter details.
export function pageMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type: "website",
      locale: "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const absoluteUrl = (path: string) => new URL(path, SITE_URL).toString();
