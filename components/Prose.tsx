import type { ReactNode } from "react";

// Plain text pages such as About and Privacy.
export function Prose({ children }: { children: ReactNode }) {
  return (
    <article className="max-w-[720px] [&_h2]:mt-10 [&_h2]:border-t [&_h2]:border-line [&_h2]:pt-6 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:mt-1.5 [&_p]:mt-3 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">
      {children}
    </article>
  );
}
