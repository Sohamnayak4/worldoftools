import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import Script from "next/script";
import { AppShell } from "@/components/AppShell";
import { SiteFooter } from "@/components/SiteFooter";
import {
  PIXELMOTH_SRC,
  PIXELMOTH_WEBSITE_ID,
  SITE_NAME,
  SITE_PROMISE,
  SITE_URL,
} from "@/lib/site";
import { pageMeta } from "@/lib/seo";
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
  ...pageMeta({
    title: `${SITE_NAME}: free file tools that run in your browser`,
    description: `Free tools to compress, convert and resize video, images, audio and PDFs. Everything runs in your browser. ${SITE_PROMISE}`,
    path: "/",
  }),
  // Search Console and Bing Webmaster Tools ownership tags. Set the codes as
  // env vars in Vercel. Not needed if you verify with a DNS record instead.
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
};

// Pages show current sponsor ads, so they refresh every 10 minutes. The Dodo
// webhook refreshes them at once after a payment or refund.
export const revalidate = 600;

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
      <body>
        <AppShell>
          <main className="w-full flex-1 px-4 pb-16 sm:px-6 lg:px-10">
            {children}
          </main>
          <SiteFooter />
        </AppShell>
        {/* Analytics. Loads once for the whole site and follows page changes
            by itself, so no manual pageview calls are needed. */}
        <Script
          defer
          data-website-id={PIXELMOTH_WEBSITE_ID}
          src={PIXELMOTH_SRC}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
