import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CategoryPage } from "@/components/CategoryPage";
import { LimitGauge } from "@/components/LimitGauge";
import { ToolShell } from "@/components/ToolShell";
import { UtilityTool } from "@/components/UtilityTool";
import { isWidgetName } from "@/lib/widgets";
import { specsFor } from "@/lib/photoSpecs";
import { jsonLdHtml, toolJsonLd } from "@/lib/jsonld";
import { pageMeta } from "@/lib/seo";
import { stripFor } from "@/lib/strip";
import {
  CATEGORIES,
  getCategory,
  getRelatedTools,
  getTool,
  tools,
} from "@/lib/tools";

// Every tool page and every category page is built from the registry at
// build time. Any other slug is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return [
    ...tools.map((tool) => ({ slug: tool.slug })),
    ...CATEGORIES.map((category) => ({ slug: category.id })),
  ];
}

export async function generateMetadata({
  params,
}: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (category) {
    return pageMeta({
      title: category.title,
      description: category.metaDescription,
      path: `/${category.id}`,
    });
  }
  const tool = getTool(slug);
  if (!tool) return {};
  return pageMeta({
    title: tool.title,
    description: tool.metaDescription,
    path: `/${tool.slug}`,
  });
}

export default async function ToolPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (category) return <CategoryPage category={category} />;
  const tool = getTool(slug);
  if (!tool) notFound();

  const related = getRelatedTools(tool);
  const limitBytes =
    tool.preset.kind === "target-size" ? tool.preset.targetBytes : undefined;

  return (
    <article className="mx-auto max-w-[880px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(toolJsonLd(tool))} />
      <Breadcrumb trail={[{ href: `/${tool.category}`, label: getCategory(tool.category)?.h1 ?? "Tools" }]} />
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{tool.h1}</h1>
      <p className="mt-3 max-w-[65ch]">{tool.shortAnswer}</p>
      <div className="mt-6">
        {tool.preset.kind === "utility" && isWidgetName(tool.preset.widget) ? (
          <UtilityTool widget={tool.preset.widget} />
        ) : tool.input ? (
          <ToolShell
            engine={tool.engine}
            input={tool.input}
            actionLabel={tool.actionLabel}
            preset={tool.preset}
            slug={tool.slug}
            options={tool.options}
            range={tool.range}
            sizePicker={tool.sizePicker}
            cropPicker={tool.cropPicker}
            cropSpecs={
              tool.preset.kind === "crop" && tool.preset.specs
                ? specsFor(tool.preset.specs)
                : undefined
            }
          />
        ) : (
          limitBytes !== undefined && <LimitGauge limitBytes={limitBytes} />
        )}
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {stripFor(tool).map((tile) => (
          <li key={tile.title} className="rounded-ctl border border-line px-4 py-3">
            <p className="font-semibold">{tile.title}</p>
            <p className="text-sm text-muted">{tile.detail}</p>
          </li>
        ))}
      </ul>

      <AdSlot position="below-tool" />

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <ol className="mt-3 max-w-[65ch] list-decimal space-y-2 pl-5">
          {tool.howItWorks.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="text-2xl font-semibold">Facts</h2>
        <dl className="mt-3">
          {tool.facts.map((fact) => (
            <div
              key={fact.label}
              className="border-b border-line py-2.5 last:border-b-0 sm:grid sm:grid-cols-[14rem_1fr] sm:gap-4"
            >
              <dt className="text-sm text-muted sm:text-base">{fact.label}</dt>
              <dd>
                {fact.value}
                {fact.sourceUrl && (
                  <>
                    {" "}
                    <a href={fact.sourceUrl} rel="noopener" className="text-sm">
                      Source
                    </a>
                  </>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="text-2xl font-semibold">Questions</h2>
        {tool.faqs.map((faq) => (
          <div key={faq.q} className="mt-5 max-w-[65ch]">
            <h3 className="font-sans text-base font-semibold">{faq.q}</h3>
            <p className="mt-1">{faq.a}</p>
          </div>
        ))}
      </section>

      <section className="mt-12 border-t border-line pt-8">
        <h2 className="text-2xl font-semibold">Related tools</h2>
        {related.length > 0 ? (
          <ul className="mt-2 grid gap-x-8 sm:grid-cols-2">
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={`/${item.slug}`} className="group block py-2 no-underline">
                  <span className="font-medium underline decoration-line underline-offset-[3px] group-hover:text-accent-ink">
                    {item.h1}
                  </span>
                  <span className="mt-0.5 block text-sm text-muted">{item.blurb}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2">
            <Link href="/">See all tools</Link>
          </p>
        )}
      </section>
    </article>
  );
}
