"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

// Reads the status Dodo adds to the return address. The address is left as
// it is, because analytics uses payment_id to credit the sale.
function readStatus(): string {
  return new URLSearchParams(window.location.search).get("status") ?? "";
}

export function PaymentStatus() {
  const status = useSyncExternalStore(
    () => () => {},
    readStatus,
    () => "",
  );
  if (status === "failed" || status === "cancelled") {
    return (
      <p className="mt-3">
        The payment did not go through, so nothing was charged.{" "}
        <Link href="/advertise">Try again</Link>.
      </p>
    );
  }
  return (
    <p className="mt-3">
      Your payment is in, and your ad goes live within a minute or two.
      Dodo Payments has emailed you a receipt.
    </p>
  );
}
