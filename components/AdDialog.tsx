"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { AdForm } from "./AdForm";
import { OPEN_AD_FORM_EVENT } from "./AdSlotButton";

// The ad form in a popup, opened from any free ad slot.
export function AdDialog({ placesLeft }: { placesLeft: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    function open() {
      dialogRef.current?.showModal();
    }
    window.addEventListener(OPEN_AD_FORM_EVENT, open);
    return () => window.removeEventListener(OPEN_AD_FORM_EVENT, open);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="ad-dialog-title"
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(560px,calc(100%-2rem))] overflow-y-auto rounded-ctl border border-line bg-bg p-0 text-text backdrop:bg-black/60"
    >
      <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div>
          <h2 id="ad-dialog-title" className="text-xl font-semibold">
            Advertise here
          </h2>
          <p className="mt-1 text-sm text-muted">
            Your ad goes live as soon as the payment goes through.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={() => dialogRef.current?.close()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-ctl border border-line text-muted hover:text-text"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="p-5">
        <AdForm placesLeft={placesLeft} bare />
      </div>
    </dialog>
  );
}
