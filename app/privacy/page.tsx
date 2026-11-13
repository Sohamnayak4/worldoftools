import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { Prose } from "@/components/Prose";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: `Privacy at ${SITE_NAME}`,
  description:
    "Files you use on worldof.tools are processed in your browser and never uploaded. This page lists the analytics, cookies and storage the site uses.",
  path: "/privacy",
});

const UPDATED = "12 November 2026";

const STORAGE: { name: string; kind: string; keeps: string; why: string }[] = [
  {
    name: "pm_vid",
    kind: "Cookie",
    keeps: "1 year",
    why: "A random visitor ID for analytics, so a return visit is counted as the same visitor.",
  },
  {
    name: "pm_sid",
    kind: "Cookie",
    keeps: "30 minutes, renewed while you browse",
    why: "A random session ID for analytics, so pages in one visit are grouped.",
  },
  {
    name: "pm_ignore",
    kind: "Local storage",
    keeps: "Until you remove it",
    why: "Only set if you opt out of analytics. It tells the script not to count you.",
  },
  {
    name: "theme",
    kind: "Local storage",
    keeps: "Until you remove it",
    why: "Only set if you switch between the light and dark theme.",
  },
];

export default function PrivacyPage() {
  return (
    <Prose>
      <h1 className="mt-10 text-3xl font-semibold sm:text-4xl">Privacy</h1>
      <p className="text-sm text-muted">Last updated {UPDATED}.</p>

      <h2>Your files</h2>
      <p>
        Every tool on {SITE_NAME} works in your browser. When you pick a file,
        it is read and processed on your own device, and the result is made
        there too. Your files are never uploaded to this site or anywhere else,
        and their names and contents are not recorded.
      </p>
      <p>
        The page does download code to do the work, such as the video or PDF
        tools. That code comes from this site. Nothing about your file is sent
        with that request.
      </p>

      <h2>What you type</h2>
      <p>
        Text you type or paste into the text and utility tools, such as the
        word counter or the password generator, stays in your browser. It is
        not sent anywhere and not saved. It is gone when you close the page.
      </p>

      <h2>No accounts</h2>
      <p>
        There are no accounts, no sign-in and no email sign-up. Using the
        tools never asks for your name or email address.
      </p>

      <h2>Analytics</h2>
      <p>
        The site counts visits with Pixelmoth, an analytics tool the owner of
        this site runs on their own server. It is not Google Analytics, and the
        data is not sold or shared with advertisers. For each page you open,
        it records:
      </p>
      <ul>
        <li>
          The page address. Parts of the address that can hold personal
          details, such as an email address, are removed in your browser first.
        </li>
        <li>The page you came from, if your browser shares it.</li>
        <li>Your screen width.</li>
        <li>How long the page was open and visible.</li>
        <li>Links you follow to other sites.</li>
        <li>
          Which main buttons you press, such as starting a tool, downloading a
          result or copying text, and which tool it was. It never records your
          file, its name, or what you typed.
        </li>
      </ul>
      <p>
        Like any website, the analytics server also receives the technical
        details every browser sends with a request, such as your IP address.
      </p>
      <p>
        The site also uses Vercel Web Analytics, from the company that hosts
        the site, as a backup count. It sets no cookies. It records the page,
        referrer, country, browser, operating system and device type, and
        recognises a visitor only by a hash of the request that Vercel
        discards after 24 hours. Its script loads from this site&apos;s own
        domain.
      </p>

      <h2>Cookies and storage</h2>
      <p>
        The site sets two first-party cookies, both for analytics. It does not
        use advertising or third-party tracking cookies.
      </p>
      <ul>
        {STORAGE.map((item) => (
          <li key={item.name}>
            <strong>{item.name}</strong>, {item.kind.toLowerCase()}, kept{" "}
            {item.keeps.charAt(0).toLowerCase() + item.keeps.slice(1)}.{" "}
            {item.why}
          </li>
        ))}
      </ul>

      <h2>Turning analytics off</h2>
      <p>
        Open any page with <code>?pm_ignore=true</code> at the end of the
        address, for example <code>worldof.tools/?pm_ignore=true</code>. Your
        browser will no longer be counted. To undo it, open a page with{" "}
        <code>?pm_ignore=false</code>. Blocking the analytics script with a
        browser extension also works, and every tool still works without it.
      </p>

      <h2>Hosting</h2>
      <p>
        The site is hosted on Vercel. Like any host, Vercel processes the
        details needed to deliver pages, such as your IP address, and may keep
        short-term logs to keep the service running and safe.
      </p>

      <h2>Sponsored links</h2>
      <p>
        Some spaces on the site show sponsored links, marked as sponsored.
        They are plain links bought by advertisers. The site loads no
        code from advertisers, uses no ad networks, and shares no visitor data
        with advertisers. Each ad shows the advertiser&apos;s site icon. Our
        server copies the icon into the page, so your browser does not
        contact the advertiser&apos;s site unless you click the link. When you click a sponsored link, analytics records
        which sponsor it was, the same way it records other links you follow.
      </p>

      <h2>Buying an ad</h2>
      <p>
        If you buy an ad on the advertise page, the details you type (your
        product name, one line of text and your link) are sent to Dodo
        Payments with your order, along with the analytics visitor ID, so the
        sale can be matched to the visit. Dodo Payments handles the payment
        and asks for your email address and payment details on its own page.
        Those payment details are not shared with this site. Dodo Payments has
        its own privacy policy.
      </p>

      <h2>Changes</h2>
      <p>
        If anything here changes, this page will be updated and the date at the
        top will change.
      </p>
    </Prose>
  );
}
