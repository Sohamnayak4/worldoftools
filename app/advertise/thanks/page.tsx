import type { Metadata } from "next";
import Link from "next/link";
import { PaymentStatus } from "@/components/PaymentStatus";

export const metadata: Metadata = {
  title: "Thanks for your order",
  robots: { index: false },
};

export default function ThanksPage() {
  return (
    <article className="mx-auto max-w-[720px]">
      <h1 className="mt-10 text-3xl font-semibold sm:text-4xl">Thanks for your order</h1>
      <PaymentStatus />
      <p className="mt-6">
        <Link href="/">Back to all tools</Link>
      </p>
    </article>
  );
}
