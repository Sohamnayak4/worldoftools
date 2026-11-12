import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { AdForm } from "@/components/AdForm";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AD_PLANS, MAX_SPONSORS } from "@/lib/ads";
import { getSponsors } from "@/lib/sponsors";
import { SITE_NAME } from "@/lib/site";
import { tools } from "@/lib/tools";

export const metadata: Metadata = pageMeta({
  title: `Advertise on ${SITE_NAME}`,
  description:
    "Show your product in a sponsored spot on worldof.tools for 7 or 30 days. A plain link with your name and one line of text. No tracking.",
  path: "/advertise",
});

export default async function AdvertisePage() {
  const places = MAX_SPONSORS - (await getSponsors()).length;
  return (
    <article className="mx-auto max-w-[880px]">
      <Breadcrumb trail={[]} />
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">
        Advertise on {SITE_NAME}
      </h1>
      <p className="mt-3 max-w-[65ch]">
        Put your product in front of people using {tools.length} free file
        tools. Your ad is a plain link with your name and one line of text.
        It shows in the sidebar on every page and next to the headline on the
        homepage, on phones too.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {AD_PLANS.map((plan) => (
          <li key={plan.id} className="rounded-ctl border border-line px-4 py-3">
            <p className="font-semibold">
              {plan.price} for {plan.days} days
            </p>
            <p className="text-sm text-muted">Paid once, no subscription</p>
          </li>
        ))}
        <li className="rounded-ctl border border-line px-4 py-3">
          <p className="font-semibold">
            {places} of {MAX_SPONSORS} slots free
          </p>
          <p className="text-sm text-muted">Up to {MAX_SPONSORS} ads show at once</p>
        </li>
      </ul>

      <div className="mt-8">
        <AdForm placesLeft={places} />
      </div>

      <section className="mt-12 max-w-[720px] border-t border-line pt-8">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>Choose 7 or 30 days and fill in your name, one line and your link.</li>
          <li>Pay on the Dodo Payments page.</li>
          <li>
            Your ad goes live as soon as the payment goes through, and runs
            for 7 or 30 days from that moment.
          </li>
          <li>When the days are up, the slot frees up for the next ad.</li>
        </ol>
        <h2 className="mt-10 text-2xl font-semibold">What is not allowed</h2>
        <p className="mt-3">
          Ads for anything illegal, adult content, gambling, weapons, malware,
          or anything misleading. The link must go to a working page that
          matches the ad. Ads that break these rules are taken down.
        </p>
        <h2 className="mt-10 text-2xl font-semibold">No tracking</h2>
        <p className="mt-3">
          Ads are plain links. The site does not load any code from
          advertisers and does not share visitor data with them.
        </p>
      </section>
    </article>
  );
}
