import Link from "next/link";
import { Breadcrumb } from "./Breadcrumb";
import { SITE_PROMISE } from "@/lib/site";
import { type CategoryInfo, CATEGORIES, toolsIn } from "@/lib/tools";

// One page per category: a short intro and every tool in it.
export function CategoryPage({ category }: { category: CategoryInfo }) {
  const list = toolsIn(category.id);
  const others = CATEGORIES.filter((item) => item.id !== category.id);
  return (
    <article className="max-w-[720px]">
      <Breadcrumb trail={[]} />
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{category.h1}</h1>
      <p className="mt-3 max-w-[65ch]">{category.intro}</p>
      <p className="mt-1 text-sm text-muted">{SITE_PROMISE}</p>

      <ul className="mt-6 border-t border-line">
        {list.map((tool) => (
          <li key={tool.slug} className="border-b border-line py-3">
            <Link href={`/${tool.slug}`} className="font-semibold">
              {tool.h1}
            </Link>
            <p className="mt-0.5 text-sm text-muted">{tool.blurb}</p>
          </li>
        ))}
      </ul>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Other tools</h2>
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1">
          {others.map((item) => (
            <li key={item.id}>
              <Link href={`/${item.id}`} className="inline-block py-1.5">
                {item.h1}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
