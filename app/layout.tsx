import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_NAME, SITE_PROMISE, SITE_URL } from "@/lib/site";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME}: free file tools that run in your browser`,
  description: `Free tools to compress, convert and resize files. Everything runs in your browser. ${SITE_PROMISE}`,
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#16181d",
};

// Runs before first paint. Dark is the default. A saved choice wins.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-theme="dark"
      suppressHydrationWarning
      className={`${bricolage.variable} ${hanken.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh flex flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-[720px] flex-1 px-4 pb-16">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
