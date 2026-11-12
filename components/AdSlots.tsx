import { Megaphone } from "lucide-react";
import { AdSlotButton } from "./AdSlotButton";
import { AD_PLANS, MAX_SPONSORS } from "@/lib/ads";
import { getSponsors } from "@/lib/sponsors";

const cheapest = AD_PLANS[0];

// Four sponsor slots. A paid slot shows the sponsor. A free slot shows what an
// ad would look like and opens the ad form when clicked.
export async function AdSlots({ compact = false }: { compact?: boolean }) {
  const sponsors = await getSponsors();
  const slots = Array.from({ length: MAX_SPONSORS }, (_, index) => sponsors[index] ?? null);
  const box = compact ? "px-3 py-2.5" : "px-4 py-3.5";

  return (
    <section aria-label="Sponsored">
      <p className="flex items-center justify-between text-xs text-muted">
        <span>Sponsored</span>
        <span>{MAX_SPONSORS - sponsors.length} of {MAX_SPONSORS} free</span>
      </p>
      <ul className={`mt-2 grid gap-2 ${compact ? "" : "grid-cols-2 lg:grid-cols-1"}`}>
        {slots.map((sponsor, index) => (
          <li key={sponsor?.id ?? `free-${index}`}>
            {sponsor ? (
              <a
                href={sponsor.url}
                rel="sponsored noopener"
                target="_blank"
                data-pm-goal="sponsor_click"
                data-pm-goal-sponsor={sponsor.name}
                className={`block h-full rounded-ctl border border-line bg-surface no-underline hover:border-accent-ink ${box}`}
              >
                <span className="block truncate font-medium">{sponsor.name}</span>
                <span className={`mt-0.5 block text-muted ${compact ? "text-xs" : "text-sm"}`}>
                  {sponsor.text}
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
