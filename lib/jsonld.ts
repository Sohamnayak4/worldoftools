import { absoluteUrl } from "./seo";
import { SITE_NAME, SITE_URL } from "./site";
import { type CategoryInfo, type Tool, getCategory } from "./tools";

// Structured data (schema.org JSON-LD) built from the registry.

type Json = Record<string, unknown>;

const APP_CATEGORY: Record<Tool["category"], string> = {
  video: "MultimediaApplication",
  audio: "MultimediaApplication",
  image: "MultimediaApplication",
  pdf: "UtilitiesApplication",
  text: "UtilitiesApplication",
  utility: "UtilitiesApplication",
};

function breadcrumb(items: { name: string; path: string }[]): Json {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function toolJsonLd(tool: Tool): Json {
  const category = getCategory(tool.category);
  const url = absoluteUrl(`/${tool.slug}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name: tool.h1,
        url,
        description: tool.metaDescription,
        applicationCategory: APP_CATEGORY[tool.category],
        operatingSystem: "Any",
        browserRequirements: "Requires a current web browser with JavaScript",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: tool.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
      breadcrumb([
        { name: "All tools", path: "/" },
        { name: category?.h1 ?? "Tools", path: `/${tool.category}` },
        { name: tool.h1, path: `/${tool.slug}` },
      ]),
    ],
  };
}

export function categoryJsonLd(category: CategoryInfo, list: Tool[]): Json {
  const url = absoluteUrl(`/${category.id}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        name: category.h1,
        url,
        description: category.metaDescription,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: list.map((tool, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: tool.h1,
            url: absoluteUrl(`/${tool.slug}`),
          })),
        },
      },
      breadcrumb([
        { name: "All tools", path: "/" },
        { name: category.h1, path: `/${category.id}` },
      ]),
    ],
  };
}

export function siteJsonLd(): Json {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
        description: "Free file tools that run in your browser. Your files never leave your device.",
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        url: SITE_URL,
        logo: absoluteUrl("/icon-512.png"),
      },
    ],
  };
}

// The safe way to put JSON-LD in a script tag: "<" is escaped so the data
// can never close the tag early.
export function jsonLdHtml(data: Json): { __html: string } {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
