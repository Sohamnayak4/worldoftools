import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/Prose";
import { SITE_NAME } from "@/lib/site";
import { CATEGORIES, tools } from "@/lib/tools";

export const metadata: Metadata = {
  title: `About ${SITE_NAME}`,
  description:
    "worldof.tools is a free set of file tools that run in your browser. Here is how they work, which open source code they use, and how the site is paid for.",
  alternates: { canonical: "/about" },
};

const CREDITS: { name: string; url: string; license: string; use: string }[] = [
  {
    name: "Mediabunny",
    url: "https://mediabunny.dev",
    license: "MPL-2.0",
    use: "reading and writing video and audio files",
  },
  {
    name: "LAME, through @mediabunny/mp3-encoder",
    url: "https://mediabunny.dev",
    license: "LGPL-2.0",
    use: "making MP3 files",
  },
  {
    name: "PDF.js",
    url: "https://mozilla.github.io/pdf.js/",
    license: "Apache-2.0",
    use: "drawing PDF pages for PDF to JPG",
  },
  {
    name: "pdf-lib (Cantoo fork)",
    url: "https://github.com/cantoo-scribe/pdf-lib",
    license: "MIT",
    use: "merging and splitting PDFs and making PDFs from images",
  },
  {
    name: "heic-to",
    url: "https://github.com/hoppergee/heic-to",
    license: "LGPL-3.0",
    use: "opening HEIC photos in browsers that cannot",
  },
  {
    name: "gifenc and gifuct-js",
    url: "https://github.com/mattdesl/gifenc",
    license: "MIT",
    use: "writing and reading GIFs",
  },
  {
    name: "uqr",
    url: "https://github.com/unjs/uqr",
    license: "MIT",
    use: "making QR codes",
  },
];

export default function AboutPage() {
  return (
    <Prose>
      <h1 className="mt-10 text-3xl font-semibold sm:text-4xl">
        About {SITE_NAME}
      </h1>
      <p>
        {SITE_NAME} is a free set of {tools.length} small tools for video,
        audio, images, PDFs and text. Each one does a single job, such as
        getting a video under Discord&apos;s upload limit or a photo under 50
        KB for a form.
      </p>

      <h2>How the tools work</h2>
      <p>
        Every tool runs in your browser, on your own phone or computer. When
        you pick a file, the page reads it from your device, does the work,
        and hands you the result to download. Your files are never uploaded,
        so the tools also work for private documents and photos.
      </p>
      <ul>
        <li>
          Video uses the video encoder built into your browser, which is why it
          needs a current version of Chrome, Edge, Safari or Firefox.
        </li>
        <li>
          Images are drawn and saved with the browser&apos;s own image tools.
        </li>
        <li>
          The code for heavy jobs, such as video or PDF, is downloaded from
          this site only when you start one, and the browser keeps it for next
          time.
        </li>
      </ul>
      <p>
        Because the work happens on your device, a slow or old device takes
        longer, and very large files can be too much for a phone. Each tool
        says its size limit before you start.
      </p>

      <h2>Where the numbers come from</h2>
      <p>
        Pages that name a platform limit, such as a file size for WhatsApp or a
        photo size for a passport, link to the official page the number came
        from and say when it was checked. Limits change, so check that page if
        something does not fit.
      </p>

      <h2>How the site is paid for</h2>
      <p>
        The tools are free and need no account. The site may show sponsored
        placements in clearly marked spaces. It will not use ad networks that
        track you across other sites.
      </p>

      <h2>Open source code</h2>
      <p>These projects do much of the work. Thank you to their authors.</p>
      <ul>
        {CREDITS.map((credit) => (
          <li key={credit.name}>
            <a href={credit.url} rel="noopener">
              {credit.name}
            </a>{" "}
            ({credit.license}), for {credit.use}.
          </li>
        ))}
      </ul>

      <h2>Find a tool</h2>
      <ul>
        {CATEGORIES.map((category) => (
          <li key={category.id}>
            <Link href={`/${category.id}`}>{category.h1}</Link>
          </li>
        ))}
      </ul>
    </Prose>
  );
}
