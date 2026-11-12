"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AdForm } from "./AdForm";
import { OPEN_AD_FORM_EVENT } from "./AdSlotButton";
import { useLiveCount } from "./LiveCount";

// The live user count at the top of the popup. Mounted only while the
// popup is open, so it refreshes only then.
function UserCount({ initial }: { initial: number | null }) {
  const users = useLiveCount(initial);
  return (
    <div className="flex min-h-[4.5rem] items-center gap-3 border-b border-line px-5 py-3">
      {users !== null && (
        <>
          <span className="live-dot shrink-0" aria-hidden="true" />
          <p className="tabular-nums">
            <span className="font-heading text-4xl font-semibold leading-none">
              {users.toLocaleString("en-US")}
            </span>{" "}
            <span className="text-muted">users and counting</span>
          </p>
        </>
      )}
    </div>
  );
}

// The ad form in a popup, opened from any free ad slot.
export function AdDialog({ placesLeft, users }: { placesLeft: number; users: number | null }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function show() {
      dialogRef.current?.showModal();
      setOpen(true);
    }
    window.addEventListener(OPEN_AD_FORM_EVENT, show);
    return () => window.removeEventListener(OPEN_AD_FORM_EVENT, show);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="ad-dialog-title"
      onClose={() => setOpen(false)}
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
      {open && <UserCount initial={users} />}
      <div className="p-5">
        <AdForm placesLeft={placesLeft} bare />
      </div>
    </dialog>
  );
}
