import { Megaphone } from "lucide-react";
import { AdSlotButton } from "./AdSlotButton";
import { AD_PLANS, MAX_SPONSORS, type Sponsor } from "@/lib/ads";
import { getSponsors } from "@/lib/sponsors";
import { formatCount, getTraffic } from "@/lib/traffic";

const cheapest = AD_PLANS[0];

// The sponsor's site icon, embedded in the page by the server. Sites without
// a usable icon get their first letter instead.
function SponsorIcon({ sponsor, size }: { sponsor: Sponsor; size: number }) {
  const frame = "flex shrink-0 items-center justify-center overflow-hidden rounded-ctl";
  if (sponsor.icon) {
    return (
      // A data URL, so next/image adds nothing here.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={sponsor.icon} alt="" width={size} height={size} className={`${frame} object-contain`} style={{ width: size, height: size }} />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`${frame} border border-line font-semibold text-accent-ink`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
    >
      {sponsor.name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

// Four sponsor slots. A paid slot shows the sponsor. A free slot shows what an
// ad would look like and opens the ad form when clicked.
export async function AdSlots({ compact = false }: { compact?: boolean }) {
  const [sponsors, traffic] = await Promise.all([getSponsors(), compact ? null : getTraffic()]);
  const slots = Array.from({ length: MAX_SPONSORS }, (_, index) => sponsors[index] ?? null);
  const box = compact ? "px-3 py-2.5" : "px-4 py-3.5";

  return (
    <section aria-label="Sponsored" className="flex flex-col">
      <p className="flex items-center justify-between text-xs text-muted">
        <span className="tabular-nums">
          Sponsored
          {traffic && <> · {formatCount(traffic.allTime)} visitors since launch</>}
        </span>
        <span>{MAX_SPONSORS - sponsors.length} of {MAX_SPONSORS} free</span>
      </p>
      <ul
        className={`mt-2 grid flex-1 gap-2 ${compact ? "" : "grid-cols-2 grid-rows-2 lg:gap-3"}`}
      >
        {slots.map((sponsor, index) => (
          <li key={sponsor?.id ?? `free-${index}`}>
            {sponsor ? (
              <a
                href={sponsor.url}
                rel="sponsored noopener"
                target="_blank"
                data-pm-goal="sponsor_click"
                data-pm-goal-sponsor={sponsor.name}
                className={`flex h-full items-start gap-3 rounded-ctl border border-line bg-surface no-underline hover:border-accent-ink ${box}`}
              >
                <SponsorIcon sponsor={sponsor} size={compact ? 24 : 32} />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{sponsor.name}</span>
                  <span className={`mt-0.5 block text-muted ${compact ? "text-xs" : "text-sm"}`}>
                    {sponsor.text}
                  </span>
                </span>
              </a>
            ) : (
              <AdSlotButton
                className={`flex h-full w-full flex-col items-start rounded-ctl border border-dashed border-line text-left hover:border-accent-ink ${box}`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Megaphone size={compact ? 14 : 16} aria-hidden="true" className="text-accent-ink" />
                  Your ad here
                </span>
                <span className={`mt-0.5 block text-muted ${compact ? "text-xs" : "text-sm"}`}>
                  From {cheapest.price} for {cheapest.days} days
                </span>
              </AdSlotButton>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
