"use client";

import type { ReactNode } from "react";

export const OPEN_AD_FORM_EVENT = "wot:open-ad-form";

// A free ad slot. Opens the ad form in a popup.
export function AdSlotButton({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      data-pm-goal="ad_slot_click"
      onClick={() => window.dispatchEvent(new Event(OPEN_AD_FORM_EVENT))}
      className={className}
    >
      {children}
    </button>
  );
}
