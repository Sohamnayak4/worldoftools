import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdSlot } from "@/components/AdSlot";
import { LimitGauge } from "@/components/LimitGauge";
import { ToolPlaceholder } from "@/components/ToolPlaceholder";
import { SITE_PROMISE } from "@/lib/site";
import { getRelatedTools, getTool, tools } from "@/lib/tools";

// Every tool page is built from the registry at build time.
// Any slug that is not in the registry is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return tools.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) return {};
  return {
    title: tool.title,
    description: tool.metaDescription,
    alternates: { canonical: `/${tool.slug}` },
  };
}

export default async function ToolPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const tool = getTool(slug);
  if (!tool) notFound();

  const related = getRelatedTools(tool);
  const limitBytes =
    tool.preset.kind === "target-size" ? tool.preset.targetBytes : undefined;

  return (
    <article>
      <h1 className="mt-8 text-2xl font-semibold sm:text-3xl">{tool.h1}</h1>
      <p className="mt-3 max-w-[65ch]">{tool.shortAnswer}</p>
      <p className="mt-1 text-sm text-muted">{SITE_PROMISE}</p>

      <div className="mt-5">
        <ToolPlaceholder />
        {limitBytes !== undefined && (
          <div className="mt-4">
            <LimitGauge limitBytes={limitBytes} />
          </div>
        )}
      </div>

      <AdSlot position="below-tool" />

      <section className="mt-10 border-t border-line pt-6">
        <h2 className="text-xl font-semibold">How it works</h2>
        <ol className="mt-3 max-w-[65ch] list-decimal space-y-2 pl-5">
          {tool.howItWorks.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="mt-10 border-t border-line pt-6">
        <h2 className="text-xl font-semibold">Facts</h2>
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

      <section className="mt-10 border-t border-line pt-6">
        <h2 className="text-xl font-semibold">Questions</h2>
        {tool.faqs.map((faq) => (
          <div key={faq.q} className="mt-5 max-w-[65ch]">
            <h3 className="font-sans text-base font-semibold">{faq.q}</h3>
            <p className="mt-1">{faq.a}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 border-t border-line pt-6">
        <h2 className="text-xl font-semibold">Related tools</h2>
        {related.length > 0 ? (
          <ul className="mt-2">
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={`/${item.slug}`} className="inline-block py-1.5">
                  {item.h1}
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
