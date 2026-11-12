import Link from "next/link";

// "All tools / Video" above a page title. The current page is not repeated,
// since the title right below names it.
export function Breadcrumb({ trail }: { trail: { href: string; label: string }[] }) {
  const items = [{ href: "/", label: "All tools" }, ...trail];
  return (
    <nav aria-label="Breadcrumb" className="mt-8 text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-x-2">
        {items.map((item, index) => (
          <li key={item.href} className="flex items-center gap-x-2">
            {index > 0 && <span aria-hidden="true">/</span>}
            <Link href={item.href} className="no-underline hover:text-accent-ink">
              {item.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
