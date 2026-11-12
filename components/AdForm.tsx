"use client";

import { useId, useState } from "react";
import { AD_LIMITS, AD_PLANS, type AdPlan, checkAdRequest } from "@/lib/ads";

const fieldClass =
  "mt-1 w-full rounded-ctl border border-line bg-bg px-3 py-2.5 text-base placeholder:text-muted";

// Collects the ad and sends the advertiser to the Dodo payment page.
export function AdForm({ placesLeft, bare = false }: { placesLeft: number; bare?: boolean }) {
  const [plan, setPlan] = useState<AdPlan["id"]>("30d");
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const id = useId();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const checked = checkAdRequest({ plan, name, url, text });
    if (!checked.ok) {
      setError(checked.message);
      return;
    }
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(checked.ad),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "The payment page could not be opened. Try again.");
        setBusy(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("You seem to be offline. Check your connection and try again.");
      setBusy(false);
    }
  }

  if (placesLeft === 0) {
    return (
      <p className="rounded-ctl border border-line bg-surface p-4">
        All ad slots are taken right now. Check back in a few days.
      </p>
    );
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className={bare ? "" : "rounded-ctl border border-line bg-surface p-4 sm:p-6"}
    >
      <fieldset>
        <legend className="text-sm text-muted">How long</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {AD_PLANS.map((item) => (
            <label
              key={item.id}
              className={`flex cursor-pointer items-center justify-between rounded-ctl border px-4 py-3 ${
                plan === item.id ? "border-accent-ink" : "border-line"
              }`}
            >
              <span className="flex items-center gap-3">
                <input
                  type="radio"
                  name="plan"
                  value={item.id}
                  checked={plan === item.id}
                  onChange={() => setPlan(item.id)}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                {item.days} days
              </span>
              <span className="font-semibold">{item.price}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5">
        <label htmlFor={`${id}-name`} className="block text-sm text-muted">
          Product or company name
        </label>
        <input
          id={`${id}-name`}
          value={name}
          maxLength={AD_LIMITS.name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Acme Notes"
          className={fieldClass}
        />
      </div>
      <div className="mt-4">
        <label htmlFor={`${id}-text`} className="block text-sm text-muted">
          One line about it, up to {AD_LIMITS.text} characters
        </label>
        <input
          id={`${id}-text`}
          value={text}
          maxLength={AD_LIMITS.text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Notes that sync across all your devices"
          className={fieldClass}
        />
        <p className="mt-1 text-right text-xs text-muted">
          {text.length} of {AD_LIMITS.text}
        </p>
      </div>
      <div className="mt-1">
        <label htmlFor={`${id}-url`} className="block text-sm text-muted">
          Link
        </label>
        <input
          id={`${id}-url`}
          type="url"
          inputMode="url"
          value={url}
          maxLength={AD_LIMITS.url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
          className={fieldClass}
        />
      </div>

      <p role="alert" className="mt-3 min-h-5 text-sm text-over">
        {error}
      </p>
      <button
        type="submit"
        disabled={busy}
        data-pm-goal="checkout_click"
        data-pm-goal-plan={plan}
        className="mt-2 rounded-ctl bg-accent px-5 py-3 font-semibold text-on-accent hover:bg-text hover:text-bg disabled:bg-line disabled:text-muted"
      >
        {busy ? "Opening the payment page" : "Continue to payment"}
      </button>
      <p className="mt-3 text-sm text-muted">
        Payment is handled by Dodo Payments. You can pay by card and other
        methods they offer.
      </p>
    </form>
  );
}
